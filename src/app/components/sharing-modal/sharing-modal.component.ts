import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShareService } from '../../core/services/share.service';

@Component({
  selector: 'app-sharing-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="isOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in"
      (click)="onClose()"
    >
      <div
        class="bg-white rounded-xl shadow-2xl w-full max-w-md animate-slide-up relative overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white"
        >
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200"
            >
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-2.684a3 3 0 000 2.684zm0 9a3 3 0 100-2.684a3 3 0 000 2.684z"
                ></path>
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-800">Partager</h2>
              <p class="text-xs text-gray-500 truncate max-w-[200px]">{{ itemName }}</p>
            </div>
          </div>
          <button
            (click)="onClose()"
            class="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <div *ngIf="!shareLink" class="space-y-4">
            <p class="text-sm text-gray-600">
              Générez un lien pour partager ce contenu avec n'importe qui.
            </p>

            <div class="space-y-2">
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider"
                >Expiration (Optionnel)</label
              >
              <input
                type="datetime-local"
                [(ngModel)]="expirationDate"
                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
              />
            </div>

            <button
              (click)="generateLink()"
              [disabled]="isGenerating"
              class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span
                *ngIf="isGenerating"
                class="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"
              ></span>
              <span>{{ isGenerating ? 'Génération...' : 'Générer le lien de partage' }}</span>
            </button>
          </div>

          <div *ngIf="shareLink" class="space-y-4 animate-fade-in">
            <div
              class="p-4 bg-green-50 rounded-lg border border-green-100 flex items-center space-x-3"
            >
              <svg
                class="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              <p class="text-sm text-green-700 font-medium">Lien généré avec succès !</p>
            </div>

            <div class="relative">
              <input
                #linkInput
                type="text"
                [value]="shareLink"
                readonly
                class="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-blue-600 outline-none"
              />
              <button
                (click)="copyLink()"
                class="absolute right-2 top-1.5 p-2 bg-white hover:bg-gray-100 text-gray-500 hover:text-blue-600 rounded-lg shadow-sm border border-gray-100 transition-all active:scale-95"
                title="Copier le lien"
              >
                <svg
                  *ngIf="!isCopied"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  ></path>
                </svg>
                <svg
                  *ngIf="isCopied"
                  class="w-5 h-5 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </button>
            </div>

            <p class="text-[10px] text-gray-400 text-center italic">
              Quiconque possède ce lien pourra accéder au contenu.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 bg-gray-50 flex justify-end">
          <button
            (click)="onClose()"
            class="px-6 py-2 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      .animate-slide-up {
        animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
    `,
  ],
})
export class SharingModalComponent {
  @Input() isOpen = false;
  @Input() itemId?: number;
  @Input() itemType?: 'file' | 'folder';
  @Input() itemName = '';
  @Output() closed = new EventEmitter<void>();

  expirationDate = '';
  isGenerating = false;
  shareLink = '';
  isCopied = false;

  constructor(private shareService: ShareService) {}

  onClose() {
    this.isOpen = false;
    this.shareLink = '';
    this.expirationDate = '';
    this.isCopied = false;
    this.closed.emit();
  }

  generateLink() {
    if (!this.itemId) return;

    this.isGenerating = true;
    const dto = {
      fileId: this.itemType === 'file' ? this.itemId : undefined,
      folderId: this.itemType === 'folder' ? this.itemId : undefined,
      expirationDate: this.expirationDate ? new Date(this.expirationDate).toISOString() : undefined,
    };

    this.shareService.createShareLink(dto).subscribe({
      next: (res) => {
        const baseUrl = window.location.origin;
        this.shareLink = `${baseUrl}/share/${res.token}`;
        this.isGenerating = false;
      },
      error: (err) => {
        console.error('Sharing error:', err);
        this.isGenerating = false;
        alert('Erreur lors de la génération du lien');
      },
    });
  }

  copyLink() {
    if (!this.shareLink) return;

    // Fallback for older browsers or non-https
    const textArea = document.createElement('textarea');
    textArea.value = this.shareLink;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      this.isCopied = true;
      setTimeout(() => (this.isCopied = false), 2000);
    } catch (err) {
      console.error('Unable to copy', err);
    }
    document.body.removeChild(textArea);
  }
}
