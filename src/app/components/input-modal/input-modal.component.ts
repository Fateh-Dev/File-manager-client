import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="isOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in"
      (click)="onCancel()"
    >
      <div
        class="bg-white rounded-lg shadow-lg w-full max-w-md animate-fade-in transform scale-100"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center rounded-t-xl"
        >
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200"
            >
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                ></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-800">{{ title }}</h3>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4">
          <div class="mb-3">
            <label class="block text-xs font-semibold text-gray-700 mb-1.5">
              {{ placeholder || 'Entrez une valeur' }}
            </label>
            <input
              #inputRef
              type="text"
              [(ngModel)]="inputValue"
              (keyup.enter)="onSubmit()"
              (keyup.escape)="onCancel()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 text-sm"
              [placeholder]="placeholder"
              autofocus
            />
          </div>

          <div
            *ngIf="errorMessage"
            class="mb-3 bg-red-50 border-l-4 border-red-500 text-red-700 p-2 rounded-md animate-fade-in"
          >
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span class="text-xs font-medium">{{ errorMessage }}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex space-x-3 p-6 border-t border-gray-100 bg-gray-50/50">
          <button (click)="onCancel()" class="btn btn-secondary w-full justify-center">
            Annuler
          </button>
          <button
            (click)="onSubmit()"
            [disabled]="!inputValue.trim()"
            class="btn btn-primary w-full justify-center"
          >
            {{ submitText }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class InputModalComponent implements OnChanges, AfterViewInit {
  @Input() isOpen = false;
  @Input() title = 'Saisie';
  @Input() placeholder = '';
  @Input() submitText = 'Valider';
  @Input() value = '';
  @Output() submit = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();
  @ViewChild('inputRef') inputRef?: ElementRef<HTMLInputElement>;

  inputValue = '';
  errorMessage = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.inputValue = this.value || '';
      this.errorMessage = '';
      // Focus input when modal opens
      setTimeout(() => {
        if (this.inputRef) {
          this.inputRef.nativeElement.focus();
        }
      }, 100);
    }
  }

  ngAfterViewInit() {
    if (this.isOpen && this.inputRef) {
      setTimeout(() => {
        this.inputRef?.nativeElement.focus();
      }, 100);
    }
  }

  onSubmit() {
    if (this.inputValue.trim()) {
      this.submit.emit(this.inputValue);
      this.inputValue = '';
      this.errorMessage = '';
    } else {
      this.errorMessage = 'Veuillez entrer un nom valide';
    }
  }

  onCancel() {
    this.cancel.emit();
    this.inputValue = '';
    this.errorMessage = '';
  }
}
