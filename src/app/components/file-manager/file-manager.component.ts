import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileGridComponent } from '../file-grid/file-grid.component';
import { PreviewModalComponent } from '../preview-modal/preview-modal.component';
import { InputModalComponent } from '../input-modal/input-modal.component';
import { FileSystemService } from '../../core/services/file-system.service';
import { NavigationService } from '../../core/services/navigation.service';
import { Folder } from '../../core/models/folder.model';
import { FileMetadata } from '../../core/models/file.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-file-manager',
  standalone: true,
  imports: [CommonModule, FileGridComponent, PreviewModalComponent, InputModalComponent],
  template: `
    <div class="h-full flex flex-col overflow-hidden">
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
        >
        </app-file-grid>
      </main>

      <app-input-modal
        [isOpen]="showFolderModal"
        title="Créer un Nouveau Dossier"
        placeholder="Entrez le nom du dossier"
        submitText="Créer"
        (submit)="onFolderNameSubmit($event)"
        (cancel)="onFolderModalCancel()"
      >
      </app-input-modal>

      <app-preview-modal
        *ngIf="previewingFile"
        [file]="previewingFile"
        (close)="previewingFile = null"
      >
      </app-preview-modal>
    </div>
  `,
})
export class FileManagerComponent implements OnInit, OnDestroy {
  folders: Folder[] = [];
  files: FileMetadata[] = [];
  currentFolder: Folder | null = null;
  previewingFile: FileMetadata | null = null;
  currentFolderId: number = 1;
  rootFolderId: number = 1;
  showFolderModal = false;
  isLoading = false;
  breadcrumbTrail: { id: number; name: string }[] = [{ id: 1, name: 'Root' }];
  viewMode: 'standard' | 'recent' | 'recycle-bin' = 'standard';

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
        this.breadcrumbTrail = [{ id, name: rootFolder.name || 'Root' }];
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
          this.currentFolder = { id: res.id || folderId, name: res.name || folderName || 'Root' };
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
        this.currentFolder = { id: -1, name: 'Recycle Bin' };
        this.breadcrumbTrail = [
          { id: this.rootFolderId, name: 'Root' },
          { id: -1, name: 'Recycle Bin' },
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
        this.currentFolder = { id: -2, name: 'Recent Files' };
        this.breadcrumbTrail = [
          { id: this.rootFolderId, name: 'Root' },
          { id: -2, name: 'Recent Files' },
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
        this.currentFolder = { id: res.id, name: 'Downloads' };
        this.folders = res.subFolders || [];
        this.files = res.files || [];
        this.breadcrumbTrail = [
          { id: this.rootFolderId, name: 'Root' },
          { id: res.id, name: 'Downloads' },
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
    this.breadcrumbTrail = [{ id: this.rootFolderId, name: 'Root' }];
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
    Array.from(fileList).forEach((file) => {
      this.fileService
        .uploadFile(file, this.currentFolderId)
        .subscribe(() => this.loadFolder(this.currentFolderId));
    });
  }

  createFolder() {
    this.showFolderModal = true;
    this.cdr.detectChanges();
  }

  onFolderNameSubmit(name: string) {
    this.fileService.createFolder({ name, parentFolderId: this.currentFolderId }).subscribe(() => {
      this.showFolderModal = false;
      this.loadFolder(this.currentFolderId);
    });
  }

  onFolderModalCancel() {
    this.showFolderModal = false;
  }

  onRenameFolder(e: any) {
    this.fileService
      .renameFolder(e.folder.id, e.newName)
      .subscribe(() => this.loadFolder(this.currentFolderId));
  }
  onDeleteFolder(f: any) {
    this.fileService.deleteFolder(f.id).subscribe(() => this.loadFolder(this.currentFolderId));
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
  onDeleteFile(f: any) {
    this.fileService.deleteFile(f.id).subscribe(() => this.loadFolder(this.currentFolderId));
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
