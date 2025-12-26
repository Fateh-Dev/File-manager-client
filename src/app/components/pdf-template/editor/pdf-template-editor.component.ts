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

  @Output() templateSaved = new EventEmitter<TemplatePayload>();

  fields: FieldPosition[] = [];
  selectedFieldId: string | null = null;
  mode: EditorMode = 'IDLE';

  imageUrl: string | null = null;
  imageFile: File | null = null;

  private startX = 0;
  private startY = 0;
  private currentField: FieldPosition | null = null;
  private resizeHandle: string | null = null;

  fieldForm: FormGroup;

  constructor(private fb: FormBuilder, public cdr: ChangeDetectorRef) {
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
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imageUrl = e.target?.result as string;
        this.fields = [];
        this.selectedFieldId = null;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(this.imageFile);
    }
  }

  onMouseDown(event: MouseEvent): void {
    if (!this.imageUrl) return;

    const rect = this.imageContainer.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

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
      const newField: FieldPosition = {
        id,
        fieldName: `Field ${this.fields.length + 1}`,
        xPercent: (x / rect.width) * 100,
        yPercent: (y / rect.height) * 100,
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
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(event.clientY - rect.top, rect.height));

    const field = this.fields.find((f) => f.id === this.selectedFieldId);
    if (!field) return;

    if (this.mode === 'DRAWING') {
      const width = x - this.startX;
      const height = y - this.startY;

      field.xPercent = (Math.min(this.startX, x) / rect.width) * 100;
      field.yPercent = (Math.min(this.startY, y) / rect.height) * 100;
      field.widthPercent = (Math.abs(width) / rect.width) * 100;
      field.heightPercent = (Math.abs(height) / rect.height) * 100;
    } else if (this.mode === 'MOVING') {
      const dx = x - this.startX;
      const dy = y - this.startY;

      const newX = (field.xPercent / 100) * rect.width + dx;
      const newY = (field.yPercent / 100) * rect.height + dy;
      const fieldW = (field.widthPercent / 100) * rect.width;
      const fieldH = (field.heightPercent / 100) * rect.height;

      if (newX >= 0 && newX + fieldW <= rect.width) {
        field.xPercent = (newX / rect.width) * 100;
        this.startX = x;
      }
      if (newY >= 0 && newY + fieldH <= rect.height) {
        field.yPercent = (newY / rect.height) * 100;
        this.startY = y;
      }
    } else if (this.mode === 'RESIZING' && this.resizeHandle) {
      const currentX = (field.xPercent / 100) * rect.width;
      const currentY = (field.yPercent / 100) * rect.height;
      const currentW = (field.widthPercent / 100) * rect.width;
      const currentH = (field.heightPercent / 100) * rect.height;

      if (this.resizeHandle.includes('right')) {
        field.widthPercent = (Math.max(10, x - currentX) / rect.width) * 100;
      }
      if (this.resizeHandle.includes('bottom')) {
        field.heightPercent = (Math.max(10, y - currentY) / rect.height) * 100;
      }
      if (this.resizeHandle.includes('left')) {
        const newW = currentW + (currentX - x);
        if (newW >= 10) {
          field.xPercent = (x / rect.width) * 100;
          field.widthPercent = (newW / rect.width) * 100;
        }
      }
      if (this.resizeHandle.includes('top')) {
        const newH = currentH + (currentY - y);
        if (newH >= 10) {
          field.yPercent = (y / rect.height) * 100;
          field.heightPercent = (newH / rect.height) * 100;
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
    if (this.fieldForm.invalid || this.fields.length === 0 || !this.imageFile) return;

    const payload: TemplatePayload = {
      templateName: this.fieldForm.value.templateName,
      fields: this.fields,
      imageTemplate: this.imageFile,
    };

    this.templateSaved.emit(payload);
  }

  private getFieldAt(x: number, y: number): FieldPosition | null {
    const rect = this.imageContainer.nativeElement.getBoundingClientRect();
    // Search backwards to get front-most field
    for (let i = this.fields.length - 1; i >= 0; i--) {
      const f = this.fields[i];
      const fx = (f.xPercent / 100) * rect.width;
      const fy = (f.yPercent / 100) * rect.height;
      const fw = (f.widthPercent / 100) * rect.width;
      const fh = (f.heightPercent / 100) * rect.height;

      if (x >= fx && x <= fx + fw && y >= fy && y <= fy + fh) {
        return f;
      }
    }
    return null;
  }

  private getHandleAt(x: number, y: number): { fieldId: string; type: string } | null {
    const rect = this.imageContainer.nativeElement.getBoundingClientRect();
    const handleSize = 8;

    for (const f of this.fields) {
      const fx = (f.xPercent / 100) * rect.width;
      const fy = (f.yPercent / 100) * rect.height;
      const fw = (f.widthPercent / 100) * rect.width;
      const fh = (f.heightPercent / 100) * rect.height;

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
}
