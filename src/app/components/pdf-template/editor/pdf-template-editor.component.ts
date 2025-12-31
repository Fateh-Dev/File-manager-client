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

type EditorMode = 'IDLE' | 'DRAWING' | 'MOVING' | 'RESIZING';

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

  @Output() templateSaved = new EventEmitter<TemplatePayload>();

  fields: FieldPosition[] = [];
  selectedFieldId: string | null = null;
  mode: EditorMode = 'IDLE';

  imageUrl: string | null = null;
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
    private fileSystemService: FileSystemService
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
          this.cdr.markForCheck();
        }
      }
    });
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
          // Or however the backend structure is for returning the unique ID
          this.imageGuid = res.id;
          this.isUploading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error uploading template image:', err);
          this.isUploading = false;
          alert("Erreur lors du chargement de l'image sur le serveur.");
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
      this.fields.push(newField);
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
    const x = Math.max(0, Math.min((event.clientX - rect.left) / this.zoomLevel, rect.width / this.zoomLevel));
    const y = Math.max(0, Math.min((event.clientY - rect.top) / this.zoomLevel, rect.height / this.zoomLevel));

    const field = this.fields.find((f) => f.id === this.selectedFieldId);
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
    if (this.mode === 'DRAWING') {
      const field = this.fields.find((f) => f.id === this.selectedFieldId);
      if (field && (field.widthPercent < 1 || field.heightPercent < 1)) {
        this.fields = this.fields.filter((f) => f.id !== this.selectedFieldId);
        this.selectedFieldId = null;
      }
    }
    this.mode = 'IDLE';
    this.resizeHandle = null;
    this.cdr.markForCheck();
  }

  deleteField(id: string): void {
    this.fields = this.fields.filter((f) => f.id !== id);
    if (this.selectedFieldId === id) {
      this.selectedFieldId = null;
    }
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
    if (this.fieldForm.invalid || this.fields.length === 0 || !this.imageGuid) return;

    const payload: TemplatePayload = {
      templateName: this.fieldForm.value.templateName,
      fields: this.fields,
      imageTemplate: this.imageGuid,
    };

    this.templateSaved.emit(payload);
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
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -this.zoomStep : this.zoomStep;
      this.setZoom(this.zoomLevel + delta, event);
    }
  }
}
