import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FileMetadata } from '../../core/models/file.model';
import { FileSystemService } from '../../core/services/file-system.service';

@Component({
  selector: 'app-preview-modal',
  standalone: true,
  imports: [CommonModule],
  styles: [
    `
      .pdf-canvas-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
      }
      .pdf-canvas-container canvas {
        max-width: 100%;
        height: auto;
        display: block;
      }
    `,
  ],
  template: `
    <div
      *ngIf="file"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      (click)="close.emit()"
    >
      <div
        class="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-5xl max-h-[95vh] w-full flex flex-col animate-fade-in"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl"
        >
          <div class="flex items-center space-x-3 flex-1 min-w-0">
            <div
              class="w-10 h-10 bg-blue-500 rounded-md flex items-center justify-center flex-shrink-0"
            >
              <svg
                *ngIf="isImage"
                class="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              <svg
                *ngIf="isPdf"
                class="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                ></path>
              </svg>
              <svg
                *ngIf="!isImage && !isPdf"
                class="w-5 h-5 text-white"
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
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-bold text-gray-800 truncate">{{ file.name }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ formatFileSize(file.size) }} • {{ file.extension.toUpperCase() }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-1.5 ml-3">
            <button
              class="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-600 hover:text-blue-600"
              (click)="download.emit(file)"
              title="Télécharger"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                ></path>
              </svg>
            </button>
            <button
              class="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-600 hover:text-red-600"
              (click)="close.emit()"
              title="Fermer"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-hidden bg-gray-50 flex flex-col">
          <!-- Image Preview with Zoom Controls -->
          <div *ngIf="!loading && isImage && previewUrl" class="flex-1 overflow-hidden relative">
            <!-- Image Controls -->
            <div
              class="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-200"
            >
              <button
                class="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-blue-600"
                (click)="zoomOutImage()"
                [disabled]="imageZoom <= 0.5"
                title="Zoom Out"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                  ></path>
                </svg>
              </button>
              <span class="text-xs font-semibold text-gray-700 min-w-[50px] text-center"
                >{{ Math.round(imageZoom * 100) }}%</span
              >
              <button
                class="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-blue-600"
                (click)="zoomInImage()"
                [disabled]="imageZoom >= 5.0"
                title="Zoom In"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                  ></path>
                </svg>
              </button>
              <div class="w-px h-6 bg-gray-300 mx-1"></div>
              <button
                class="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-blue-600"
                (click)="resetImageZoom()"
                title="Reset Zoom"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
              </button>
              <button
                class="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-blue-600"
                (click)="toggleFullscreen()"
                title="Fullscreen"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  ></path>
                </svg>
              </button>
            </div>

            <!-- Image Container with Native Scroll -->
            <div
              #scrollContainer
              class="w-full h-full overflow-auto bg-gray-50/50 select-none"
              [class.cursor-grab]="imageZoom > 1 && !isDragging"
              [class.cursor-grabbing]="imageZoom > 1 && isDragging"
              [class.cursor-default]="imageZoom <= 1"
              (wheel)="onImageWheel($event)"
              (mousedown)="startDrag($event)"
            >
              <div class="min-w-full min-h-full flex items-center justify-center p-4">
                <img
                  #imagePreview
                  [src]="previewUrl"
                  [style.width.%]="imageZoom > 1 ? imageZoom * 100 : null"
                  [class.max-w-full]="imageZoom === 1"
                  [class.max-h-full]="imageZoom === 1"
                  [class.object-contain]="imageZoom === 1"
                  [style.max-width]="imageZoom > 1 ? 'none' : null"
                  [style.max-height]="imageZoom > 1 ? 'none' : null"
                  class="rounded-lg shadow-2xl transition-all duration-200"
                  alt="{{ file.name }}"
                  draggable="false"
                />
              </div>
            </div>
          </div>

          <!-- PDF Preview with Navigation -->
          <div *ngIf="!loading && isPdf" class="flex-1 overflow-auto flex flex-col">
            <!-- PDF Controls -->
            <div
              class="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm"
            >
              <div class="flex items-center gap-3">
                <button
                  class="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  (click)="previousPage()"
                  [disabled]="pdfPageNum <= 1"
                  title="Page Précédente"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 19l-7-7 7-7"
                    ></path>
                  </svg>
                </button>
                <span class="text-sm font-semibold text-gray-700">
                  Page {{ pdfPageNum }} / {{ pdfNumPages }}
                </span>
                <button
                  class="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  (click)="nextPage()"
                  [disabled]="pdfPageNum >= pdfNumPages"
                  title="Page Suivante"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                </button>
              </div>

              <div class="flex items-center gap-2">
                <button
                  class="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-blue-600"
                  (click)="zoomOutPdf()"
                  title="Zoom Out"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                    ></path>
                  </svg>
                </button>
                <span class="text-xs font-semibold text-gray-700 min-w-[50px] text-center"
                  >{{ Math.round(pdfScale * 100) }}%</span
                >
                <button
                  class="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-blue-600"
                  (click)="zoomInPdf()"
                  title="Zoom In"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- PDF Canvas Container -->
            <div class="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
              <div *ngIf="pdfLoading" class="text-center">
                <div
                  class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3"
                ></div>
                <p class="text-gray-600 text-sm font-medium">Chargement du PDF...</p>
              </div>
              <div *ngIf="pdfError" class="text-center text-red-600">
                <p class="text-sm font-medium">{{ pdfError }}</p>
              </div>
              <div #pdfContainer class="pdf-canvas-container shadow-lg rounded-lg bg-white"></div>
            </div>
          </div>

          <!-- Loading State -->
          <div *ngIf="loading" class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <div
                class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3"
              ></div>
              <p class="text-gray-600 text-sm font-medium">Chargement de l'aperçu...</p>
            </div>
          </div>

          <!-- Unsupported File Type -->
          <div
            *ngIf="!loading && !isImage && !isPdf"
            class="flex-1 flex items-center justify-center p-4"
          >
            <div class="text-center max-w-md">
              <div
                class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  class="w-8 h-8 text-gray-400"
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
              </div>
              <h4 class="text-base font-semibold text-gray-800 mb-1.5">Aperçu Non Disponible</h4>
              <p class="text-gray-600 text-sm mb-4">
                Ce type de fichier ne peut pas être prévisualisé dans le navigateur.
              </p>
              <div class="flex justify-center mt-4">
                <button class="btn btn-primary" (click)="download.emit(file)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    ></path>
                  </svg>
                  <span>Télécharger</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PreviewModalComponent implements OnChanges, OnInit, OnDestroy {
  @Input() file: FileMetadata | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() download = new EventEmitter<FileMetadata>();
  @ViewChild('imagePreview') imagePreview!: ElementRef<HTMLImageElement>;
  @ViewChild('pdfContainer') pdfContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  previewUrl: SafeResourceUrl | null = null;
  loading = false;

  // Expose Math to template
  Math = Math;

  // Image zoom and pan
  // Image zoom
  imageZoom: number = 1.0;
  isFullscreen: boolean = false;

  // Drag state
  isDragging = false;
  startX = 0;
  startY = 0;
  scrollLeft = 0;
  scrollTop = 0;

  // PDF viewer
  pdfDoc: any = null;
  pdfPageNum: number = 1;
  pdfNumPages: number = 0;
  pdfScale: number = 1.5;
  pdfLoading: boolean = false;
  pdfError: string | null = null;

  constructor(
    private fileService: FileSystemService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    // Load PDF.js dynamically
    this.loadPdfJs();
  }

  ngOnDestroy() {
    // Cleanup
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl as any);
    }
  }

  private async loadPdfJs() {
    // PDF.js will be loaded from CDN when needed
  }

  ngOnChanges() {
    if (this.file) {
      // Reset PDF state
      this.pdfDoc = null;
      this.pdfPageNum = 1;
      this.pdfNumPages = 0;
      this.pdfError = null;
      this.loadPreview();
    } else {
      this.previewUrl = null;
      this.loading = false;
      // Cleanup old URL
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl as any);
      }
    }
  }

  get isImage() {
    return (
      this.file &&
      ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(this.file.extension.toLowerCase())
    );
  }

  get isPdf() {
    return this.file && this.file.extension.toLowerCase() === '.pdf';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Octets';
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  loadPreview() {
    if (!this.file) return;
    if (!this.isImage && !this.isPdf) {
      this.loading = false;
      return;
    }

    // Reset zoom and pan for new file
    // Reset zoom for new file
    this.imageZoom = 1.0;
    this.pdfPageNum = 1;

    this.loading = true;
    this.fileService.downloadFile(this.file.id).subscribe({
      next: (blob) => {
        this.ngZone.run(() => {
          const url = URL.createObjectURL(blob);
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          this.loading = false;
          this.cdr.detectChanges();

          if (this.isPdf) {
            this.loadPdf(blob);
          }
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.loading = false;
          if (this.isPdf) {
            this.pdfError = 'Erreur lors du chargement du PDF';
          }
          this.cdr.detectChanges();
        });
      },
    });
  }

  private async loadPdf(blob: Blob) {
    try {
      this.pdfLoading = true;
      this.pdfError = null;

      // Load PDF.js from CDN if not already loaded
      if (typeof (window as any).pdfjsLib === 'undefined') {
        await this.loadPdfJsScript();
      }

      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const arrayBuffer = await blob.arrayBuffer();
      this.pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      this.pdfNumPages = this.pdfDoc.numPages;
      this.pdfPageNum = 1;

      await this.renderPdfPage();
      this.pdfLoading = false;
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.pdfError = 'Impossible de charger le PDF';
      this.pdfLoading = false;
    }
  }

  private async loadPdfJsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof (window as any).pdfjsLib !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load PDF.js'));
      document.head.appendChild(script);
    });
  }

  async renderPdfPage() {
    if (!this.pdfDoc || !this.pdfContainer) return;

    try {
      const page = await this.pdfDoc.getPage(this.pdfPageNum);
      const viewport = page.getViewport({ scale: this.pdfScale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Clear container and add canvas
      this.pdfContainer.nativeElement.innerHTML = '';
      this.pdfContainer.nativeElement.appendChild(canvas);
    } catch (error) {
      console.error('Error rendering PDF page:', error);
      this.pdfError = 'Erreur lors du rendu de la page';
    }
  }

  previousPage() {
    if (this.pdfPageNum > 1) {
      this.pdfPageNum--;
      this.renderPdfPage();
    }
  }

  nextPage() {
    if (this.pdfPageNum < this.pdfNumPages) {
      this.pdfPageNum++;
      this.renderPdfPage();
    }
  }

  zoomInPdf() {
    this.pdfScale = Math.min(3.0, this.pdfScale + 0.25);
    this.renderPdfPage();
  }

  zoomOutPdf() {
    this.pdfScale = Math.max(0.5, this.pdfScale - 0.25);
    this.renderPdfPage();
  }

  // Image zoom and pan methods
  zoomInImage() {
    this.imageZoom = Math.min(5.0, this.imageZoom + 0.25);
  }

  zoomOutImage() {
    this.imageZoom = Math.max(0.5, this.imageZoom - 0.25);
  }

  resetImageZoom() {
    this.imageZoom = 1.0;
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    if (!this.isFullscreen) {
      this.resetImageZoom();
    }
  }

  onImageWheel(event: WheelEvent) {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      event.stopPropagation();
      const delta = event.deltaY > 0 ? -0.25 : 0.25;
      this.imageZoom = Math.max(0.5, Math.min(5.0, this.imageZoom + delta));
    }
  }

  startDrag(e: MouseEvent) {
    if (this.imageZoom <= 1) return;
    e.preventDefault(); // Prevent text selection
    this.isDragging = true;
    this.startX = e.pageX;
    this.startY = e.pageY;
    this.scrollLeft = this.scrollContainer.nativeElement.scrollLeft;
    this.scrollTop = this.scrollContainer.nativeElement.scrollTop;
  }

  @HostListener('window:mousemove', ['$event'])
  drag(e: MouseEvent) {
    if (!this.isDragging) return;
    e.preventDefault();
    const x = e.pageX;
    const y = e.pageY;
    const walkX = x - this.startX;
    const walkY = y - this.startY;
    this.scrollContainer.nativeElement.scrollLeft = this.scrollLeft - walkX;
    this.scrollContainer.nativeElement.scrollTop = this.scrollTop - walkY;
  }

  @HostListener('window:mouseup')
  stopDrag() {
    this.isDragging = false;
  }
}
