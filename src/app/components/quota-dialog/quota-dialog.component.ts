import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-quota-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="isOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in"
      (click)="onCancel()"
    >
      <div
        class="bg-white rounded-xl shadow-2xl w-full max-w-md animate-scale-in transform transition-all"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200"
            >
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                ></path>
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-800">Storage Quota</h2>
              <p class="text-sm text-gray-500" *ngIf="user">
                Updating limit for {{ user.username }}
              </p>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              New Storage Limit (GB)
            </label>
            <div class="relative">
              <input
                type="number"
                [(ngModel)]="limitGB"
                (keyup.enter)="onSubmit()"
                (keyup.escape)="onCancel()"
                class="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-gray-800 text-lg font-medium"
                placeholder="0.00"
                step="0.1"
                min="0"
                autofocus
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold"
                >GB</span
              >
            </div>
          </div>

          <!-- Quick Suggestions -->
          <div class="mb-6">
            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Quick Additions
            </p>
            <div class="grid grid-cols-3 gap-3">
              <button
                (click)="addGB(5)"
                class="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 border border-blue-100 transition-all active:scale-95"
              >
                +5 GB
              </button>
              <button
                (click)="addGB(10)"
                class="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 border border-blue-100 transition-all active:scale-95"
              >
                +10 GB
              </button>
              <button
                (click)="addGB(20)"
                class="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 border border-blue-100 transition-all active:scale-95"
              >
                +20 GB
              </button>
            </div>
          </div>

          <!-- Current Usage Info -->
          <div class="bg-blue-50 rounded-xl p-4 border border-blue-100" *ngIf="user">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-semibold text-blue-800 uppercase">Current Usage</span>
              <span class="text-xs font-bold text-blue-800"
                >{{ getPercentage() | number : '1.0-0' }}%</span
              >
            </div>
            <div class="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-500"
                [style.width.%]="getPercentage()"
              ></div>
            </div>
            <p class="text-[10px] text-blue-600 font-medium">
              Using {{ user.usedStorage / (1024 * 1024 * 1024) | number : '1.2-2' }} GB of
              {{ user.storageLimit / (1024 * 1024 * 1024) | number : '1.2-2' }} GB
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-xl"
        >
          <button
            (click)="onCancel()"
            class="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm active:scale-95"
          >
            Cancel
          </button>
          <button
            (click)="onSubmit()"
            [disabled]="limitGB < 0"
            class="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all text-sm font-bold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Update Quota
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes scaleIn {
        from {
          transform: scale(0.9) translateY(20px);
          opacity: 0;
        }
        to {
          transform: scale(1) translateY(0);
          opacity: 1;
        }
      }
      .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
      }
      .animate-scale-in {
        animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
    `,
  ],
})
export class QuotaDialogComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() user: User | null = null;
  @Output() submit = new EventEmitter<number>();
  @Output() cancel = new EventEmitter<void>();

  limitGB: number = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue && this.user) {
      this.limitGB = Math.round((this.user.storageLimit / (1024 * 1024 * 1024)) * 100) / 100;
    }
  }

  addGB(amount: number) {
    this.limitGB = Math.round((this.limitGB + amount) * 100) / 100;
  }

  getPercentage(): number {
    if (!this.user || this.user.storageLimit === 0) return 0;
    const used = this.user.usedStorage / (1024 * 1024 * 1024);
    const limit = this.limitGB || this.user.storageLimit / (1024 * 1024 * 1024);
    return Math.min(100, (used / limit) * 100);
  }

  onSubmit() {
    if (this.limitGB >= 0) {
      const bytes = Math.floor(this.limitGB * 1024 * 1024 * 1024);
      this.submit.emit(bytes);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
