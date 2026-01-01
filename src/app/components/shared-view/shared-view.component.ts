import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ShareService, SharedLinkInfo } from '../../core/services/share.service';

@Component({
  selector: 'app-shared-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center animate-pulse">
        <div
          class="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <div
            class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
          ></div>
        </div>
        <p class="text-gray-600 font-medium">Chargement du contenu partagé...</p>
      </div>

      <!-- Error State -->
      <div
        *ngIf="error"
        class="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4 animate-fade-in"
      >
        <div
          class="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            ></path>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-800">Accès Impossible</h2>
        <p class="text-gray-500 text-sm">{{ error }}</p>
        <a
          href="/"
          class="block py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
        >
          Retour à l'accueil
        </a>
      </div>

      <!-- Success State -->
      <div
        *ngIf="info && !isLoading"
        class="bg-white p-6 sm:p-10 rounded-2xl shadow-2xl max-w-2xl w-full animate-slide-up"
      >
        <div class="flex flex-col items-center text-center space-y-6">
          <div
            class="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200 transform -rotate-3 hover:rotate-0 transition-transform duration-300"
          >
            <svg
              *ngIf="info.type === 'file'"
              class="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            <svg
              *ngIf="info.type === 'folder'"
              class="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              ></path>
            </svg>
          </div>

          <div class="space-y-2">
            <h1 class="text-2xl font-black text-gray-900 break-all">{{ info.name }}</h1>
            <div class="flex items-center justify-center space-x-3 text-sm text-gray-500">
              <span *ngIf="info.type === 'file'">{{ formatSize(info.size || 0) }}</span>
              <span *ngIf="info.type === 'file'">{{ info.extension }}</span>
              <span *ngIf="info.type === 'folder'"
                >{{ info.subFolders?.length || 0 }} Dossiers,
                {{ info.files?.length || 0 }} Fichiers</span
              >
            </div>
          </div>

          <div class="w-full pt-4 border-t border-gray-100">
            <button
              *ngIf="info.type === 'file'"
              (click)="downloadFile()"
              class="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center space-x-3"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                ></path>
              </svg>
              <span>Télécharger le fichier</span>
            </button>

            <div *ngIf="info.type === 'folder'" class="space-y-4">
              <p class="text-sm font-bold text-gray-400 uppercase tracking-widest">
                Contenu du dossier
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  *ngFor="let f of info.files"
                  class="flex items-center p-3 bg-gray-50 rounded-xl space-x-3"
                >
                  <svg
                    class="w-5 h-5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                  <span class="text-sm font-medium text-gray-700 truncate">{{ f.name }}</span>
                </div>
              </div>
              <p class="text-xs text-gray-400 italic mt-4">
                Le téléchargement direct de dossier n'est pas encore disponible.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 text-[10px] text-gray-400 uppercase tracking-[0.2em]">
        Propulsé par File Manager Modern
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes slideUp {
        from {
          transform: translateY(40px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      .animate-slide-up {
        animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
    `,
  ],
})
export class SharedViewComponent implements OnInit {
  token: string = '';
  info: SharedLinkInfo | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private shareService: ShareService) {}

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (this.token) {
      this.loadInfo();
    } else {
      this.error = 'Token de partage manquant';
      this.isLoading = false;
    }
  }

  loadInfo() {
    this.shareService.getSharedInfo(this.token).subscribe({
      next: (res) => {
        this.info = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Shared info error:', err);
        this.error = err.error || 'Lien invalide ou expiré';
        this.isLoading = false;
      },
    });
  }

  downloadFile() {
    if (!this.token) return;
    window.open(this.shareService.getDownloadUrl(this.token), '_blank');
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Octets';
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
