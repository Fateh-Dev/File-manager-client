import {
  Component,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FieldPosition } from '../../../core/models/field-position.model';
import { TemplatePayload } from '../../../core/models/template-payload.model';
import { FileSystemService } from '../../../core/services/file-system.service';
import { PdfTemplateService } from '../../../core/services/pdf-template.service';

type EditorMode = 'IDLE' | 'DRAWING' | 'MOVING' | 'RESIZING';

const STORAGE_KEY = 'pdf_template_draft';

@Component({
  selector: 'app-pdf-template-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pdf-template-editor.component.html',
  styleUrl: './pdf-template-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfTemplateEditorComponent implements OnInit {
  @ViewChild('imageContainer') imageContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('templateImage') templateImage!: ElementRef<HTMLImageElement>;
  @ViewChild('canvasArea') canvasArea!: ElementRef<HTMLDivElement>;

  @Output() templateSaved = new EventEmitter<any>();

  fields: FieldPosition[] = [];
  selectedFieldId: string | null = null;
  mode: EditorMode = 'IDLE';

  imageUrl: string | null = null;
  isFullscreen = false;
  imageFile: File | null = null;
  imageGuid: string | null = null;
  isUploading = false;

  // Zoom functionality
  zoomLevel: number = 1.0;
  readonly minZoom: number = 0.25;
  readonly maxZoom: number = 4.0;
  readonly zoomStep: number = 0.25;

  private startX = 0;
  private startY = 0;
  private currentField: FieldPosition | null = null;
  private resizeHandle: string | null = null;

  fieldForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public cdr: ChangeDetectorRef,
    private fileSystemService: FileSystemService,
    private pdfService: PdfTemplateService
  ) {
    this.fieldForm = this.fb.group({
      templateName: ['', Validators.required],
      fieldName: [''],
    });
  }

  ngOnInit(): void {
    this.fieldForm.get('fieldName')?.valueChanges.subscribe((name) => {
      if (this.selectedFieldId) {
        const field = this.fields.find((f) => f.id === this.selectedFieldId);
        if (field) {
          field.fieldName = name;
          this.saveToLocalStorage();
          this.cdr.markForCheck();
        }
      }
    });

    this.fieldForm.get('templateName')?.valueChanges.subscribe(() => {
      this.saveToLocalStorage();
    });

    this.loadFromLocalStorage();
  }

  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.imageFile = input.files[0];

      // 1. Preview locally
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imageUrl = e.target?.result as string;
        this.fields = [];
        this.selectedFieldId = null;
        this.zoomLevel = 1.0; // Reset zoom when new image is loaded
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(this.imageFile);

      // 2. Upload immediately to get GUID
      this.isUploading = true;
      this.imageGuid = null;
      this.cdr.markForCheck();

      // We use folderId 1 as a default "Root" for templates
      this.fileSystemService.uploadFile(this.imageFile, 1).subscribe({
        next: (res: any) => {
          // Assuming the backend returns the file metadata with a GUID 'id'
          this.imageGuid = res.guid;
          this.isUploading = false;
          this.saveToLocalStorage();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error uploading template image:', err);
          this.isUploading = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  onMouseDown(event: MouseEvent): void {
    if (!this.imageUrl) return;

    const rect = this.imageContainer.nativeElement.getBoundingClientRect();
    // Adjust coordinates for zoom level
    const x = (event.clientX - rect.left) / this.zoomLevel;
    const y = (event.clientY - rect.top) / this.zoomLevel;

    // Check if clicked on a field or its handle
    const clickedField = this.getFieldAt(x, y);
    const handle = this.getHandleAt(x, y);

    if (handle) {
      this.mode = 'RESIZING';
      this.resizeHandle = handle.type;
      this.selectedFieldId = handle.fieldId;
      this.startX = x;
      this.startY = y;
    } else if (clickedField) {
      this.mode = 'MOVING';
      this.selectedFieldId = clickedField.id;
      this.startX = x;
      this.startY = y;
      this.fieldForm.patchValue({ fieldName: clickedField.fieldName }, { emitEvent: false });
    } else {
      // Start drawing new field
      this.mode = 'DRAWING';
      const id = Date.now().toString();
      // Use base dimensions for percentage calculations
      const baseWidth = rect.width / this.zoomLevel;
      const baseHeight = rect.height / this.zoomLevel;
      const newField: FieldPosition = {
        id,
        fieldName: `Field ${this.fields.length + 1}`,
        xPercent: (x / baseWidth) * 100,
        yPercent: (y / baseHeight) * 100,
        widthPercent: 0,
        heightPercent: 0,
      };
      this.currentField = newField; // Assign to currentField for drawing
      this.selectedFieldId = id;
      this.startX = x;
      this.startY = y;
      this.fieldForm.patchValue({ fieldName: newField.fieldName }, { emitEvent: false });
    }

    this.cdr.markForCheck();
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.mode === 'IDLE' || !this.selectedFieldId) return;

    const rect = this.imageContainer.nativeElement.getBoundingClientRect();
    // Adjust coordinates for zoom level
    const x = Math.max(
      0,
      Math.min((event.clientX - rect.left) / this.zoomLevel, rect.width / this.zoomLevel)
    );
    const y = Math.max(
      0,
      Math.min((event.clientY - rect.top) / this.zoomLevel, rect.height / this.zoomLevel)
    );

    let field: FieldPosition | null = null;
    if (this.mode === 'DRAWING') {
      field = this.currentField;
    } else {
      field = this.fields.find((f) => f.id === this.selectedFieldId) || null;
    }

    if (!field) return;

    // Use base dimensions (not zoomed) for all calculations
    const baseWidth = rect.width / this.zoomLevel;
    const baseHeight = rect.height / this.zoomLevel;

    if (this.mode === 'DRAWING') {
      const width = x - this.startX;
      const height = y - this.startY;

      field.xPercent = (Math.min(this.startX, x) / baseWidth) * 100;
      field.yPercent = (Math.min(this.startY, y) / baseHeight) * 100;
      field.widthPercent = (Math.abs(width) / baseWidth) * 100;
      field.heightPercent = (Math.abs(height) / baseHeight) * 100;
    } else if (this.mode === 'MOVING') {
      const dx = x - this.startX;
      const dy = y - this.startY;

      const newX = (field.xPercent / 100) * baseWidth + dx;
      const newY = (field.yPercent / 100) * baseHeight + dy;
      const fieldW = (field.widthPercent / 100) * baseWidth;
      const fieldH = (field.heightPercent / 100) * baseHeight;

      if (newX >= 0 && newX + fieldW <= baseWidth) {
        field.xPercent = (newX / baseWidth) * 100;
        this.startX = x;
      }
      if (newY >= 0 && newY + fieldH <= baseHeight) {
        field.yPercent = (newY / baseHeight) * 100;
        this.startY = y;
      }
    } else if (this.mode === 'RESIZING' && this.resizeHandle) {
      const currentX = (field.xPercent / 100) * baseWidth;
      const currentY = (field.yPercent / 100) * baseHeight;
      const currentW = (field.widthPercent / 100) * baseWidth;
      const currentH = (field.heightPercent / 100) * baseHeight;

      if (this.resizeHandle.includes('right')) {
        field.widthPercent = (Math.max(10, x - currentX) / baseWidth) * 100;
      }
      if (this.resizeHandle.includes('bottom')) {
        field.heightPercent = (Math.max(10, y - currentY) / baseHeight) * 100;
      }
      if (this.resizeHandle.includes('left')) {
        const newW = currentW + (currentX - x);
        if (newW >= 10) {
          field.xPercent = (x / baseWidth) * 100;
          field.widthPercent = (newW / baseWidth) * 100;
        }
      }
      if (this.resizeHandle.includes('top')) {
        const newH = currentH + (currentY - y);
        if (newH >= 10) {
          field.yPercent = (y / baseHeight) * 100;
          field.heightPercent = (newH / baseHeight) * 100;
        }
      }
    }

    this.cdr.markForCheck();
  }

  @HostListener('window:mouseup')
  onMouseUp(): void {
    if (this.mode === 'DRAWING' && this.currentField) {
      if (this.currentField.widthPercent > 0.5 && this.currentField.heightPercent > 0.5) {
        this.fields.push(this.currentField);
        this.selectField(this.currentField.id);
        this.saveToLocalStorage();
      }
    } else if (this.mode === 'MOVING' || this.mode === 'RESIZING') {
      this.saveToLocalStorage();
    }

    this.mode = 'IDLE';
    this.currentField = null;
    this.resizeHandle = null;
    this.cdr.markForCheck();
  }

  deleteField(id: string): void {
    this.fields = this.fields.filter((f) => f.id !== id);
    if (this.selectedFieldId === id) {
      this.selectedFieldId = null;
      this.fieldForm.patchValue({ fieldName: '' });
    }
    this.saveToLocalStorage();
    this.cdr.markForCheck();
  }

  selectField(id: string): void {
    this.selectedFieldId = id;
    const field = this.fields.find((f) => f.id === id);
    if (field) {
      this.fieldForm.patchValue({ fieldName: field.fieldName }, { emitEvent: false });
    }
    this.cdr.markForCheck();
  }

  onSave(): void {
    if (this.fieldForm.invalid || this.fields.length === 0 || !this.imageUrl) return;

    this.isUploading = true;
    this.cdr.markForCheck();

    let fileToUpload: File | null = this.imageFile;

    // If imageFile is lost (e.g. page refresh), convert base64 (imageUrl) back to File
    if (!fileToUpload && this.imageUrl.startsWith('data:')) {
      fileToUpload = this.dataURLtoFile(this.imageUrl, 'template.png');
    }

    if (!fileToUpload) {
      alert("Image manquante. Veuillez recharger l'image.");
      this.isUploading = false;
      this.cdr.markForCheck();
      return;
    }
    console.log(this.fields);
    this.pdfService
      .saveTemplate(this.fieldForm.value.templateName, fileToUpload, this.fields)
      .subscribe({
        next: (res) => {
          this.isUploading = false;
          alert('Modèle enregistré avec succès !');
          this.clearLocalStorage();
          this.templateSaved.emit(res);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error saving template:', err);
          this.isUploading = false;
          alert("Erreur lors de l'enregistrement du modèle.");
          this.cdr.markForCheck();
        },
      });
  }

  private dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  private saveToLocalStorage(): void {
    const draft = {
      templateName: this.fieldForm.value.templateName,
      imageUrl: this.imageUrl,
      imageGuid: this.imageGuid,
      fields: this.fields,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }

  private loadFromLocalStorage(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        this.imageUrl = draft.imageUrl;
        this.imageGuid = draft.imageGuid;
        this.fields = draft.fields || [];
        if (draft.templateName) {
          this.fieldForm.patchValue({ templateName: draft.templateName }, { emitEvent: false });
        }
        this.cdr.markForCheck();
      } catch (e) {
        console.error('Failed to load draft from local storage', e);
      }
    }
  }

  private clearLocalStorage(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  private getFieldAt(x: number, y: number): FieldPosition | null {
    const rect = this.imageContainer.nativeElement.getBoundingClientRect();
    // Use base dimensions (not zoomed) for calculations
    const baseWidth = rect.width / this.zoomLevel;
    const baseHeight = rect.height / this.zoomLevel;
    // Search backwards to get front-most field
    for (let i = this.fields.length - 1; i >= 0; i--) {
      const f = this.fields[i];
      const fx = (f.xPercent / 100) * baseWidth;
      const fy = (f.yPercent / 100) * baseHeight;
      const fw = (f.widthPercent / 100) * baseWidth;
      const fh = (f.heightPercent / 100) * baseHeight;

      if (x >= fx && x <= fx + fw && y >= fy && y <= fy + fh) {
        return f;
      }
    }
    return null;
  }

  private getHandleAt(x: number, y: number): { fieldId: string; type: string } | null {
    const rect = this.imageContainer.nativeElement.getBoundingClientRect();
    // Use base dimensions (not zoomed) for calculations
    const baseWidth = rect.width / this.zoomLevel;
    const baseHeight = rect.height / this.zoomLevel;
    const handleSize = 8 / this.zoomLevel; // Adjust handle size for zoom

    for (const f of this.fields) {
      const fx = (f.xPercent / 100) * baseWidth;
      const fy = (f.yPercent / 100) * baseHeight;
      const fw = (f.widthPercent / 100) * baseWidth;
      const fh = (f.heightPercent / 100) * baseHeight;

      const handles = [
        { type: 'top-left', x: fx, y: fy },
        { type: 'top-right', x: fx + fw, y: fy },
        { type: 'bottom-left', x: fx, y: fy + fh },
        { type: 'bottom-right', x: fx + fw, y: fy + fh },
      ];

      for (const h of handles) {
        if (Math.abs(x - h.x) <= handleSize && Math.abs(y - h.y) <= handleSize) {
          return { fieldId: f.id, type: h.type };
        }
      }
    }
    return null;
  }

  getSelectedField(): FieldPosition | null {
    if (this.mode === 'DRAWING' && this.currentField) {
      return this.currentField;
    }
    return this.fields.find((f) => f.id === this.selectedFieldId) || null;
  }

  // Zoom methods with mouse position tracking
  zoomIn(event?: MouseEvent): void {
    const newZoom = Math.min(this.maxZoom, this.zoomLevel + this.zoomStep);
    this.setZoomWithMousePosition(newZoom, event);
  }

  zoomOut(event?: MouseEvent): void {
    const newZoom = Math.max(this.minZoom, this.zoomLevel - this.zoomStep);
    this.setZoomWithMousePosition(newZoom, event);
  }

  resetZoom(): void {
    this.setZoomWithMousePosition(1.0);
  }

  setZoom(level: number, event?: MouseEvent): void {
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, level));
    this.setZoomWithMousePosition(newZoom, event);
  }

  private setZoomWithMousePosition(newZoom: number, event?: MouseEvent): void {
    if (!this.imageContainer || !this.canvasArea || !this.imageUrl) {
      this.zoomLevel = newZoom;
      this.cdr.markForCheck();
      return;
    }

    const oldZoom = this.zoomLevel;
    if (oldZoom === newZoom) return; // No change needed

    const canvas = this.canvasArea.nativeElement;
    const imageElement = this.imageContainer.nativeElement;

    // Get current scroll position BEFORE any changes
    const scrollLeft = canvas.scrollLeft;
    const scrollTop = canvas.scrollTop;

    // Get mouse position relative to canvas viewport
    let mouseX = 0;
    let mouseY = 0;

    if (event) {
      // Use actual mouse position from event (relative to viewport)
      const canvasRect = canvas.getBoundingClientRect();
      mouseX = event.clientX - canvasRect.left;
      mouseY = event.clientY - canvasRect.top;
    } else {
      // Use center of visible canvas area
      mouseX = canvas.clientWidth / 2;
      mouseY = canvas.clientHeight / 2;
    }

    // Get bounding rects BEFORE zoom change
    const imageRect = imageElement.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    // Calculate the image's position within the canvas scroll container
    const imageOffsetX = imageRect.left - canvasRect.left;
    const imageOffsetY = imageRect.top - canvasRect.top;

    // Mouse position relative to the image container (in viewport coordinates)
    const relativeX = mouseX - imageOffsetX;
    const relativeY = mouseY - imageOffsetY;

    // Calculate the point on the image in base (unzoomed) coordinates
    // The scroll position tells us how far we've scrolled in the zoomed space
    // We need to convert this to base coordinates
    // Position in base space = (scroll + relative position) / oldZoom
    const baseX = (scrollLeft + relativeX) / oldZoom;
    const baseY = (scrollTop + relativeY) / oldZoom;

    // Update zoom level
    this.zoomLevel = newZoom;
    this.cdr.markForCheck();

    // Calculate new scroll position to keep the same point under the mouse
    // After zoom, the same base point will be at: baseX * newZoom (in zoomed coordinates)
    // We want: newScroll + relativeX = baseX * newZoom
    // Therefore: newScroll = baseX * newZoom - relativeX
    const newScrollLeft = baseX * newZoom - relativeX;
    const newScrollTop = baseY * newZoom - relativeY;

    // Use requestAnimationFrame to ensure DOM is updated before setting scroll
    // We need to wait for Angular to apply the transform
    requestAnimationFrame(() => {
      // Re-measure after transform is applied
      const newImageRect = imageElement.getBoundingClientRect();
      const newCanvasRect = canvas.getBoundingClientRect();
      const newImageOffsetX = newImageRect.left - newCanvasRect.left;
      const newImageOffsetY = newImageRect.top - newCanvasRect.top;

      // Recalculate relative position with new offsets (after zoom)
      const newRelativeX = mouseX - newImageOffsetX;
      const newRelativeY = mouseY - newImageOffsetY;

      // Calculate final scroll position
      // The base point (in unzoomed coordinates) will be at baseX * newZoom in zoomed space
      // We want this point to be at the mouse position
      // Mouse position = newScroll + newRelativeX
      // So: newScroll = baseX * newZoom - newRelativeX
      const finalScrollLeft = baseX * newZoom - newRelativeX;
      const finalScrollTop = baseY * newZoom - newRelativeY;

      // Apply scroll position (round to avoid sub-pixel issues)
      canvas.scrollLeft = Math.max(0, Math.round(finalScrollLeft));
      canvas.scrollTop = Math.max(0, Math.round(finalScrollTop));
    });
  }

  getZoomPercent(): number {
    return Math.round(this.zoomLevel * 100);
  }

  // Handle mouse wheel zoom on canvas
  onWheel(event: WheelEvent): void {
    if (!this.imageUrl) return;

    // Only zoom if Ctrl key is pressed (or Cmd on Mac)
    if (event.ctrlKey) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(Math.max(this.minZoom, this.zoomLevel + delta), this.maxZoom);
      this.setZoomWithMousePosition(newZoom, event as unknown as MouseEvent);
    }
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.cdr.markForCheck();
  }

  @HostListener('document:keydown.escape')
  exitFullscreen(): void {
    if (this.isFullscreen) {
      this.isFullscreen = false;
      this.cdr.markForCheck();
    }
  }
}
