import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-input-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div *ngIf="isOpen" 
         class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in"
         (click)="onCancel()">
      <div class="bg-white rounded-lg shadow-lg w-full max-w-md animate-fade-in transform scale-100"
           (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="p-4 border-b border-gray-200 bg-gray-50">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            <h2 class="text-base font-bold text-gray-800">{{ title }}</h2>
          </div>
        </div>
        
        <!-- Content -->
        <div class="p-4">
          <div class="mb-3">
            <label class="block text-xs font-semibold text-gray-700 mb-1.5">
              {{ placeholder || 'Enter value' }}
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
          
          <div *ngIf="errorMessage" class="mb-3 bg-red-50 border-l-4 border-red-500 text-red-700 p-2 rounded-md animate-fade-in">
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-xs font-medium">{{ errorMessage }}</span>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="flex justify-end space-x-2 p-4 border-t border-gray-200 bg-gray-50">
          <button 
            (click)="onCancel()"
            class="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium rounded-md hover:bg-gray-200 transition-colors text-sm"
          >
            Cancel
          </button>
          <button 
            (click)="onSubmit()"
            [disabled]="!inputValue.trim()"
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitText }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class InputModalComponent implements OnChanges, AfterViewInit {
    @Input() isOpen = false;
    @Input() title = 'Input';
    @Input() placeholder = '';
    @Input() submitText = 'OK';
    @Output() submit = new EventEmitter<string>();
    @Output() cancel = new EventEmitter<void>();
    @ViewChild('inputRef') inputRef?: ElementRef<HTMLInputElement>;

    inputValue = '';
    errorMessage = '';

    ngOnChanges(changes: SimpleChanges) {
        if (changes['isOpen'] && changes['isOpen'].currentValue) {
            this.inputValue = '';
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
            this.errorMessage = 'Please enter a valid name';
        }
    }

    onCancel() {
        this.cancel.emit();
        this.inputValue = '';
        this.errorMessage = '';
    }
}
