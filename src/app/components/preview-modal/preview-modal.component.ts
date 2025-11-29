import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FileMetadata } from '../../core/models/file.model';
import { FileSystemService } from '../../core/services/file-system.service';

@Component({
  selector: 'app-preview-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="file" 
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" 
         (click)="close.emit()">
      <div class="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-5xl max-h-[95vh] w-full flex flex-col animate-fade-in" 
           (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <div class="flex items-center space-x-3 flex-1 min-w-0">
            <div class="w-10 h-10 bg-blue-500 rounded-md flex items-center justify-center flex-shrink-0">
              <svg *ngIf="isImage" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <svg *ngIf="isPdf" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
              <svg *ngIf="!isImage && !isPdf" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-bold text-gray-800 truncate">{{ file.name }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">{{ formatFileSize(file.size) }} • {{ file.extension.toUpperCase() }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-1.5 ml-3">
            <button 
              class="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-600 hover:text-blue-600"
              (click)="download.emit(file)"
              title="Télécharger">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
            </button>
            <button 
              class="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-600 hover:text-red-600"
              (click)="close.emit()"
              title="Fermer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Content -->
        <div class="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
          <div *ngIf="loading" class="text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3"></div>
            <p class="text-gray-600 text-sm font-medium">Chargement de l'aperçu...</p>
          </div>
          
          <img *ngIf="!loading && isImage && previewUrl" 
               [src]="previewUrl" 
               class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" 
               alt="{{ file.name }}" />
          
          <iframe *ngIf="!loading && isPdf && previewUrl" 
                  [src]="previewUrl" 
                  class="w-full h-full min-h-[600px] rounded-lg shadow-lg border-0"></iframe>
          
          <div *ngIf="!loading && !isImage && !isPdf" class="text-center max-w-md">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h4 class="text-base font-semibold text-gray-800 mb-1.5">Aperçu Non Disponible</h4>
            <p class="text-gray-600 text-sm mb-4">Ce type de fichier ne peut pas être prévisualisé dans le navigateur.</p>
            <button 
              class="inline-flex items-center space-x-1.5 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-semibold"
              (click)="download.emit(file)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              <span>Télécharger le Fichier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PreviewModalComponent implements OnChanges {
  @Input() file: FileMetadata | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() download = new EventEmitter<FileMetadata>();

  previewUrl: SafeResourceUrl | null = null;
  loading = false;

  constructor(private fileService: FileSystemService, private sanitizer: DomSanitizer) { }

  ngOnChanges() {
    if (this.file) {
      this.loadPreview();
    } else {
      this.previewUrl = null;
      this.loading = false;
    }
  }

  get isImage() {
    return this.file && ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(this.file.extension.toLowerCase());
  }

  get isPdf() {
    return this.file && this.file.extension.toLowerCase() === '.pdf';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Octets';
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  loadPreview() {
    if (!this.file) return;
    if (!this.isImage && !this.isPdf) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.fileService.downloadFile(this.file.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
