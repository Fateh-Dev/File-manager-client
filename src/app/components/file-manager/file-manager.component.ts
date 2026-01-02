import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { FileGridComponent } from '../file-grid/file-grid.component';
import { PreviewModalComponent } from '../preview-modal/preview-modal.component';
import { InputModalComponent } from '../input-modal/input-modal.component';
import { SharingModalComponent } from '../sharing-modal/sharing-modal.component';
import { DialogComponent } from '../dialog/dialog.component';
import { FileSystemService } from '../../core/services/file-system.service';
import { NavigationService } from '../../core/services/navigation.service';
import { Folder } from '../../core/models/folder.model';
import { FileMetadata } from '../../core/models/file.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-file-manager',
  standalone: true,
  imports: [
    CommonModule,
    FileGridComponent,
    PreviewModalComponent,
    InputModalComponent,
    SharingModalComponent,
    DialogComponent,
  ],
  template: `
    <div class="h-full flex flex-col overflow-hidden">
      <!-- Upload Progress Overlay -->
      <div
        *ngIf="uploadQueue.length > 0"
        class="fixed bottom-6 right-6 z-[100] w-80 max-h-96 overflow-y-auto space-y-3"
      >
        <div
          *ngFor="let item of uploadQueue"
          class="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 animate-slide-in"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-gray-700 truncate w-48">{{ item.fileName }}</span>
            <span class="text-[10px] font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded-full"
              >{{ item.progress }}%</span
            >
          </div>
          <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              [style.width.%]="item.progress"
            ></div>
          </div>
          <div class="mt-2 flex justify-between items-center">
            <span class="text-[10px] text-gray-400 font-medium">
              {{ item.progress < 100 ? 'En cours...' : 'Finalisation...' }}
            </span>
          </div>
        </div>
      </div>

      <main class="flex-1 overflow-hidden relative">
        <app-file-grid
          [folders]="folders"
          [files]="files"
          [currentFolder]="currentFolder"
          [breadcrumbTrail]="breadcrumbTrail"
          [isLoading]="isLoading"
          [viewMode]="viewMode"
          (openFolder)="onOpenFolder($event)"
          (previewFile)="previewFile($event)"
          (downloadFile)="downloadFile($event)"
          (uploadFiles)="uploadFiles($event)"
          (navigateUp)="navigateUp()"
          (navigateToBreadcrumb)="navigateToBreadcrumb($event)"
          (renameFolder)="onRenameFolder($event)"
          (deleteFolder)="onDeleteFolder($event)"
          (moveFolder)="onMoveFolder($event)"
          (moveFile)="onMoveFile($event)"
          (deleteFile)="onDeleteFile($event)"
          (restoreFolder)="onRestoreFolder($event)"
          (restoreFile)="onRestoreFile($event)"
          (purgeFolder)="onPurgeFolder($event)"
          (purgeFile)="onPurgeFile($event)"
          (share)="onShare($event)"
        >
        </app-file-grid>
      </main>

      <app-input-modal
        [isOpen]="showFolderModal"
        [title]="modalTitle"
        [placeholder]="modalPlaceholder"
        [submitText]="modalSubmitText"
        [value]="modalValue"
        (submit)="onFolderNameSubmit($event)"
        (cancel)="onFolderModalCancel()"
      >
      </app-input-modal>

      <app-sharing-modal
        [isOpen]="showSharingModal"
        [itemId]="sharingData.id"
        [itemType]="sharingData.type"
        [itemName]="sharingData.name"
        (closed)="showSharingModal = false"
      >
      </app-sharing-modal>

      <app-preview-modal
        *ngIf="previewingFile"
        [file]="previewingFile"
        (close)="previewingFile = null"
        (download)="downloadFile($event)"
      >
      </app-preview-modal>

      <app-dialog
        [isOpen]="dialogData.isOpen"
        [title]="dialogData.title"
        [message]="dialogData.message"
        [type]="dialogData.type"
        [buttonText]="dialogData.buttonText"
        [showCancelButton]="dialogData.showCancelButton"
        [cancelText]="dialogData.cancelText"
        (closed)="dialogData.isOpen = false"
        (confirmed)="onDialogConfirm()"
      ></app-dialog>
    </div>
  `,
  styles: [
    `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .animate-slide-in {
        animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
    `,
  ],
})
export class FileManagerComponent implements OnInit, OnDestroy {
  folders: Folder[] = [];
  files: FileMetadata[] = [];
  currentFolder: Folder | null = null;
  previewingFile: FileMetadata | null = null;
  currentFolderId: number = 1;
  rootFolderId: number = 1;
  showFolderModal = false;
  modalTitle = 'Créer un Nouveau Dossier';
  modalPlaceholder = 'Entrez le nom du dossier';
  modalSubmitText = 'Créer';
  modalValue = '';
  pendingRename: { type: 'folder' | 'file'; item: any } | null = null;
  isLoading = false;
  breadcrumbTrail: { id: number; name: string }[] = [{ id: 1, name: 'Accueil' }];
  viewMode: 'standard' | 'recent' | 'recycle-bin' = 'standard';
  readonly MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB

  dialogData = {
    isOpen: false,
    title: '',
    message: '',
    type: 'error' as 'success' | 'error' | 'info' | 'warning',
    buttonText: 'OK',
    showCancelButton: false,
    cancelText: 'Annuler',
  };

  uploadQueue: { fileName: string; progress: number }[] = [];

  pendingDelete: { type: 'file' | 'folder'; id: number; name: string } | null = null;

  showSharingModal = false;
  sharingData: { id?: number; type?: 'file' | 'folder'; name: string } = { name: '' };

  private subs = new Subscription();

  constructor(
    private fileService: FileSystemService,
    private navigationService: NavigationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isLoading = true;

    // Subscribe to global actions
    this.subs.add(
      this.navigationService.sidebarAction$.subscribe((action) => {
        if (action === 'home') this.navigateHome();
        if (action === 'recent') this.loadRecentFiles();
        if (action === 'downloads') this.loadDownloads();
        if (action === 'recycle') this.loadRecycleBin();
      })
    );

    this.subs.add(
      this.navigationService.search$.subscribe((query) => {
        if (query && query.trim()) this.performSearch(query);
        else this.loadFolder(this.currentFolderId);
      })
    );

    this.subs.add(
      this.navigationService.createFolder$.subscribe(() => {
        this.createFolder();
      })
    );

    // Initial load
    this.fileService.getRootFolder().subscribe({
      next: (rootFolder: any) => {
        const id = rootFolder.id || 1;
        this.rootFolderId = id;
        this.currentFolderId = id;
        this.breadcrumbTrail = [{ id, name: rootFolder.name || 'Accueil' }];
        this.loadFolder(id);
      },
      error: () => this.loadFolder(1),
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  loadFolder(folderId: number, folderName?: string) {
    this.isLoading = true;
    this.currentFolderId = folderId;
    this.viewMode = 'standard';
    this.navigationService.setShowCreateFolder(true);
    this.cdr.detectChanges();

    this.fileService.getFolderContents(folderId).subscribe({
      next: (res) => {
        if (res) {
          this.currentFolder = {
            id: res.id || folderId,
            name: res.name || folderName || 'Accueil',
          };
          let subFoldersData = res.subFolders || res.folders || res.children;
          let filesData = res.files;

          if (subFoldersData && typeof subFoldersData === 'object' && '$values' in subFoldersData) {
            this.folders = Array.isArray(subFoldersData.$values) ? subFoldersData.$values : [];
          } else {
            this.folders = Array.isArray(subFoldersData) ? subFoldersData : [];
          }

          if (filesData && typeof filesData === 'object' && '$values' in filesData) {
            this.files = Array.isArray(filesData.$values) ? filesData.$values : [];
          } else {
            this.files = Array.isArray(filesData) ? filesData : [];
          }

          if (folderName) {
            this.breadcrumbTrail.push({ id: folderId, name: this.currentFolder.name });
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadRecycleBin() {
    this.isLoading = true;
    this.viewMode = 'recycle-bin';
    this.navigationService.setShowCreateFolder(false);
    this.fileService.getRecycleBin().subscribe({
      next: (res) => {
        this.folders = res.folders || [];
        this.files = res.files || [];
        this.currentFolder = { id: -1, name: 'Corbeille' };
        this.breadcrumbTrail = [
          { id: this.rootFolderId, name: 'Accueil' },
          { id: -1, name: 'Corbeille' },
        ];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadRecentFiles() {
    this.isLoading = true;
    this.viewMode = 'recent';
    this.navigationService.setShowCreateFolder(false);
    this.fileService.getRecentFiles().subscribe({
      next: (res) => {
        this.files = res.files || [];
        this.currentFolder = { id: -2, name: 'Fichiers Récents' };
        this.breadcrumbTrail = [
          { id: this.rootFolderId, name: 'Accueil' },
          { id: -2, name: 'Fichiers Récents' },
        ];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadDownloads() {
    this.isLoading = true;
    this.fileService.getDownloads().subscribe({
      next: (res) => {
        this.currentFolderId = res.id;
        this.currentFolder = { id: res.id, name: 'Téléchargements' };
        this.folders = res.subFolders || [];
        this.files = res.files || [];
        this.breadcrumbTrail = [
          { id: this.rootFolderId, name: 'Accueil' },
          { id: res.id, name: 'Téléchargements' },
        ];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onOpenFolder(folder: Folder) {
    if (this.viewMode === 'recycle-bin') return;
    this.loadFolder(folder.id, folder.name);
  }

  navigateHome() {
    this.loadFolder(this.rootFolderId);
    this.breadcrumbTrail = [{ id: this.rootFolderId, name: 'Accueil' }];
  }

  navigateUp() {
    if (this.breadcrumbTrail.length > 1) {
      this.breadcrumbTrail.pop();
      const prev = this.breadcrumbTrail[this.breadcrumbTrail.length - 1];
      this.loadFolder(prev.id);
    }
  }

  navigateToBreadcrumb(index: number) {
    this.breadcrumbTrail = this.breadcrumbTrail.slice(0, index + 1);
    this.loadFolder(this.breadcrumbTrail[index].id);
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

  uploadFiles(fileList: FileList) {
    const files = Array.from(fileList);

    // Check if any file exceeds the 10GB limit
    const overLimitFiles = files.filter((f) => f.size > this.MAX_FILE_SIZE);
    if (overLimitFiles.length > 0) {
      this.showErrorDialog(
        'Fichier trop volumineux',
        `Certains fichiers dépassent la limite autorisée de 10 Go : ${overLimitFiles
          .map((f) => f.name)
          .join(', ')}`
      );
      return;
    }

    files.forEach((file) => {
      // Create a queue item
      const queueItem = { fileName: file.name, progress: 0 };
      this.uploadQueue.push(queueItem);
      this.cdr.detectChanges();

      this.fileService.uploadFile(file, this.currentFolderId).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = Math.round((100 * event.loaded) / event.total);
            queueItem.progress = progress;
            this.cdr.detectChanges();
          } else if (event.type === HttpEventType.Response) {
            // Success! Remove from queue and refresh folder
            this.uploadQueue = this.uploadQueue.filter((i) => i !== queueItem);
            this.loadFolder(this.currentFolderId);
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.uploadQueue = this.uploadQueue.filter((i) => i !== queueItem);
          console.error('Upload error:', err);

          if (err.error?.Error?.includes('quota') || err.error?.Error?.includes('Storage')) {
            this.showErrorDialog(
              'Quota de stockage dépassé',
              'Vous avez atteint votre limite de stockage. Veuillez supprimer des fichiers ou contacter un administrateur.'
            );
          } else if (err.status === 413) {
            this.showErrorDialog(
              'Fichier trop volumineux',
              'Le fichier est trop volumineux pour être traité par le serveur.'
            );
          } else {
            this.showErrorDialog(
              'Erreur',
              'Échec du téléchargement du fichier: ' + (err.error?.Error || 'Erreur inconnue')
            );
          }
          this.cdr.detectChanges();
        },
      });
    });
  }

  onDeleteFolder(folder: any) {
    this.pendingDelete = { type: 'folder', id: folder.id, name: folder.name };
    this.showConfirmationDialog(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer le dossier "${folder.name}" et tout son contenu ?`,
      'Supprimer'
    );
  }

  onDeleteFile(file: any) {
    this.pendingDelete = { type: 'file', id: file.id, name: file.name };
    this.showConfirmationDialog(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer le fichier "${file.name}" ?`,
      'Supprimer'
    );
  }

  showConfirmationDialog(title: string, message: string, buttonText: string) {
    this.dialogData = {
      isOpen: true,
      title,
      message,
      type: 'error',
      buttonText,
      showCancelButton: true,
      cancelText: 'Annuler',
    };
    this.cdr.detectChanges();
  }

  onDialogConfirm() {
    if (this.pendingDelete) {
      const { type, id } = this.pendingDelete;
      const obs =
        type === 'folder' ? this.fileService.deleteFolder(id) : this.fileService.deleteFile(id);

      obs.subscribe({
        next: () => {
          this.loadFolder(this.currentFolderId);
          this.pendingDelete = null;
          this.dialogData.isOpen = false;
        },
        error: (err) => {
          this.showErrorDialog(
            'Erreur',
            `Échec de la suppression du ${type === 'folder' ? 'dossier' : 'fichier'}.`
          );
          this.pendingDelete = null;
        },
      });
    }
  }

  showErrorDialog(title: string, message: string) {
    this.dialogData = {
      isOpen: true,
      title,
      message,
      type: 'error',
      buttonText: 'OK',
      showCancelButton: false,
      cancelText: 'Annuler',
    };
    this.cdr.detectChanges();
  }

  createFolder() {
    this.modalTitle = 'Créer un Nouveau Dossier';
    this.modalPlaceholder = 'Entrez le nom du dossier';
    this.modalSubmitText = 'Créer';
    this.modalValue = '';
    this.pendingRename = null;
    this.showFolderModal = true;
    this.cdr.detectChanges();
  }

  onFolderNameSubmit(name: string) {
    if (this.pendingRename) {
      const { type, item } = this.pendingRename;
      if (type === 'folder') {
        this.fileService.renameFolder(item.id, name).subscribe(() => {
          this.showFolderModal = false;
          this.loadFolder(this.currentFolderId);
        });
      } else {
        // Add file rename service call if available, for now just folder
        this.showFolderModal = false;
      }
    } else {
      this.fileService
        .createFolder({ name, parentFolderId: this.currentFolderId })
        .subscribe(() => {
          this.showFolderModal = false;
          this.loadFolder(this.currentFolderId);
        });
    }
  }

  onFolderModalCancel() {
    this.showFolderModal = false;
  }

  onRenameFolder(e: any) {
    this.modalTitle = 'Renommer le Dossier';
    this.modalPlaceholder = 'Entrez le nouveau nom';
    this.modalSubmitText = 'Renommer';
    this.modalValue = e.folder.name;
    this.pendingRename = { type: 'folder', item: e.folder };
    this.showFolderModal = true;
    this.cdr.detectChanges();
  }
  onMoveFolder(e: any) {
    this.fileService
      .moveFolder(e.folder.id, e.targetFolderId)
      .subscribe(() => this.loadFolder(this.currentFolderId));
  }
  onMoveFile(e: any) {
    this.fileService
      .moveFile(e.file.id, e.targetFolderId)
      .subscribe(() => this.loadFolder(this.currentFolderId));
  }
  onRestoreFolder(f: any) {
    this.fileService.restoreFolder(f.id).subscribe(() => this.loadRecycleBin());
  }
  onRestoreFile(f: any) {
    this.fileService.restoreFile(f.id).subscribe(() => this.loadRecycleBin());
  }
  onPurgeFolder(f: any) {
    this.fileService.purgeFolder(f.id).subscribe(() => this.loadRecycleBin());
  }
  onPurgeFile(f: any) {
    this.fileService.purgeFile(f.id).subscribe(() => this.loadRecycleBin());
  }

  onShare(data: { id: number; type: 'file' | 'folder'; name: string }) {
    this.sharingData = data;
    this.showSharingModal = true;
    this.cdr.detectChanges();
  }

  performSearch(query: string) {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.fileService.search(query).subscribe((res) => {
      this.folders = res.folders || [];
      this.files = res.files || [];
      this.viewMode = 'standard';
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }
}
