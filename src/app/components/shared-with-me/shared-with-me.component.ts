import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileGridComponent } from '../file-grid/file-grid.component';
import { PreviewModalComponent } from '../preview-modal/preview-modal.component';
import { ShareService } from '../../core/services/share.service';
import { FileSystemService } from '../../core/services/file-system.service';
import { FileMetadata } from '../../core/models/file.model';
import { Folder } from '../../core/models/folder.model';

@Component({
  selector: 'app-shared-with-me',
  standalone: true,
  imports: [CommonModule, FileGridComponent, PreviewModalComponent],
  template: `
    <div class="h-full flex flex-col overflow-hidden bg-white">
      <!-- Header -->
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Partagés avec moi</h1>
          <p class="text-sm text-gray-500">
            Fichiers et dossiers partagés par d'autres utilisateurs
          </p>
        </div>
        <button
          (click)="loadSharedItems()"
          class="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Actualiser"
        >
          <svg
            class="w-5 h-5"
            [class.animate-spin]="isLoading"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            ></path>
          </svg>
        </button>
      </div>

      <main class="flex-1 overflow-hidden relative">
        <app-file-grid
          [folders]="folders"
          [files]="files"
          [isLoading]="isLoading"
          viewMode="standard"
          [isSharedView]="true"
          (openFolder)="onOpenFolder($event)"
          (previewFile)="previewFile($event)"
          (downloadFile)="downloadFile($event)"
        >
        </app-file-grid>
      </main>

      <app-preview-modal
        *ngIf="previewingFile"
        [file]="previewingFile"
        (close)="previewingFile = null"
        (download)="downloadFile($event)"
      >
      </app-preview-modal>
    </div>
  `,
  styles: [],
})
export class SharedWithMeComponent implements OnInit {
  folders: Folder[] = [];
  files: any[] = [];
  isLoading = false;
  previewingFile: FileMetadata | null = null;

  constructor(
    private shareService: ShareService,
    private fileService: FileSystemService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadSharedItems();
  }

  loadSharedItems() {
    this.isLoading = true;
    this.shareService.getSharedWithMe().subscribe({
      next: (items) => {
        // Backend returns: { Id, AccessLevel, Type, Item: { id, name, ownerName, ... } }
        this.folders = items
          .filter((i) => i.type === 'folder')
          .map((i) => ({
            ...i.item,
            accessLevel: i.accessLevel,
            permissionId: i.id,
          }));

        this.files = items
          .filter((i) => i.type === 'file')
          .map((i) => ({
            ...i.item,
            accessLevel: i.accessLevel,
            permissionId: i.id,
          }));

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading shared items:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onOpenFolder(folder: Folder) {
    // For now, let's just show contents of shared folder
    // This would require a special API if we want to navigate inside shared folders
    // For MVV, let's keep it simple.
  }

  previewFile(file: FileMetadata) {
    this.previewingFile = file;
  }

  downloadFile(file: FileMetadata) {
    this.fileService.downloadFile(file.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
    });
  }
}
