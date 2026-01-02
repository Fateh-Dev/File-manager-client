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
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">Partagés avec moi</h1>
            <p class="text-sm text-gray-500">
              Fichiers et dossiers partagés par d'autres utilisateurs
            </p>
          </div>
          <button
            (click)="refresh()"
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

        <!-- Breadcrumbs and Upload -->
        <div class="flex items-center justify-between">
          <nav class="flex items-center space-x-2 text-sm">
            <button
              (click)="navigateToBreadcrumb(-1)"
              class="text-gray-500 hover:text-blue-600 transition-colors"
            >
              Partagés
            </button>
            <ng-container *ngFor="let crumb of breadcrumbs; let last = last; let i = index">
              <span class="text-gray-400">/</span>
              <button
                (click)="navigateToBreadcrumb(i)"
                [disabled]="last"
                [class.text-blue-600]="!last"
                [class.font-bold]="last"
                [class.text-gray-800]="last"
                class="hover:text-blue-700 transition-colors disabled:cursor-default"
              >
                {{ crumb.name }}
              </button>
            </ng-container>
          </nav>

          <label
            *ngIf="currentFolderId && canEdit()"
            class="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all cursor-pointer shadow-sm text-sm font-bold"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Importer</span>
            <input type="file" multiple class="hidden" (change)="onFileSelect($event)" />
          </label>
        </div>
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
          (uploadFiles)="uploadFiles($event)"
          (deleteFile)="onDeleteFile($event)"
          (deleteFolder)="onDeleteFolder($event)"
          (renameFolder)="onRenameFolder($event)"
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
  currentFolderId: number | null = null;
  currentAccessLevel: number = 0;
  breadcrumbs: { id: number; name: string }[] = [];

  constructor(
    private shareService: ShareService,
    private fileService: FileSystemService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadSharedItems();
  }

  refresh() {
    if (this.currentFolderId) {
      this.loadFolderContents(this.currentFolderId);
    } else {
      this.loadSharedItems();
    }
  }

  canEdit(): boolean {
    return this.currentAccessLevel >= 1; // 1 = Edit, 2 = Delete/All
  }

  loadSharedItems() {
    this.isLoading = true;
    this.currentFolderId = null;
    this.currentAccessLevel = 0;
    this.breadcrumbs = [];
    this.shareService.getSharedWithMe().subscribe({
      next: (items) => {
        this.folders = items
          .filter((i: any) => i.type === 'folder')
          .map((i: any) => ({
            ...i.item,
            accessLevel: i.accessLevel,
            permissionId: i.id,
          }));

        this.files = items
          .filter((i: any) => i.type === 'file')
          .map((i: any) => ({
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

  loadFolderContents(folderId: number) {
    this.isLoading = true;
    this.fileService.getFolderContents(folderId).subscribe({
      next: (res) => {
        this.currentAccessLevel = res.accessLevel;
        this.folders = res.subFolders.map((f: any) => ({
          ...f,
          ownerName: res.ownerName,
        }));
        this.files = res.files.map((f: any) => ({
          ...f,
          ownerName: res.ownerName,
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading folder contents:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onOpenFolder(folder: Folder) {
    this.currentFolderId = folder.id;
    this.breadcrumbs.push({ id: folder.id, name: folder.name });
    this.loadFolderContents(folder.id);
  }

  navigateToBreadcrumb(index: number) {
    if (index === -1) {
      this.loadSharedItems();
    } else {
      const crumb = this.breadcrumbs[index];
      this.currentFolderId = crumb.id;
      this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
      this.loadFolderContents(crumb.id);
    }
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

  onFileSelect(event: any) {
    if (event.target.files) {
      this.uploadFiles(event.target.files);
    }
  }

  uploadFiles(fileList: FileList | File[]) {
    if (!this.currentFolderId) return;
    this.isLoading = true;
    const files = Array.from(fileList);
    let completed = 0;

    files.forEach((file) => {
      this.fileService.uploadFile(file, this.currentFolderId!).subscribe({
        next: (event) => {
          if (event.type === 4) {
            // Sent successfully
            completed++;
            if (completed === files.length) {
              this.loadFolderContents(this.currentFolderId!);
            }
          }
        },
        error: (err) => {
          console.error('Upload error:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
    });
  }

  onDeleteFile(file: FileMetadata) {
    if (confirm(`Voulez-vous vraiment supprimer ${file.name} ?`)) {
      this.fileService.deleteFile(file.id).subscribe(() => {
        this.refresh();
      });
    }
  }

  onDeleteFolder(folder: Folder) {
    if (confirm(`Voulez-vous vraiment supprimer le dossier ${folder.name} et tout son contenu ?`)) {
      this.fileService.deleteFolder(folder.id).subscribe(() => {
        this.refresh();
      });
    }
  }

  onRenameFolder(event: { folder: Folder; newName: string }) {
    const newName = prompt('Entrez le nouveau nom du dossier :', event.folder.name);
    if (newName && newName !== event.folder.name) {
      this.fileService.renameFolder(event.folder.id, newName).subscribe(() => {
        this.refresh();
      });
    }
  }
}
