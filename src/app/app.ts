import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FileGridComponent } from './components/file-grid/file-grid.component';
import { PreviewModalComponent } from './components/preview-modal/preview-modal.component';
import { LoginComponent } from './components/login/login.component';
import { InputModalComponent } from './components/input-modal/input-modal.component';
import { FileSystemService } from './core/services/file-system.service';
import { AuthService } from './core/services/auth.service';
import { Folder } from './core/models/folder.model';
import { FileMetadata } from './core/models/file.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, FileGridComponent, PreviewModalComponent, LoginComponent, InputModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  folders: Folder[] = [];
  files: FileMetadata[] = [];
  currentFolder: Folder | null = null;
  previewingFile: FileMetadata | null = null;
  currentFolderId: number = 1;
  showFolderModal = false;
  isAuthenticated = false;
  isLoading = false;
  breadcrumbTrail: { id: number, name: string }[] = [{ id: 1, name: 'Root' }];

  constructor(
    private fileService: FileSystemService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.isAuthenticated = !!this.authService.getToken();
  }

  ngOnInit() {
    if (this.isAuthenticated) {
      this.isLoading = true;
      setTimeout(() => {
        this.loadFolder(1);
      }, 50);
    }
  }

  loadFolder(folderId: number, folderName?: string) {
    console.log('=== loadFolder called with folderId:', folderId);
    this.isLoading = true;
    this.currentFolderId = folderId;
    this.folders = [];
    this.files = [];
    this.cdr.detectChanges();

    this.fileService.getFolderContents(folderId).subscribe({
      next: (res) => {
        console.log('=== API Response:', res);
        if (res) {
          this.currentFolder = { id: res.id || folderId, name: res.name || folderName || 'Root' };
          let subFoldersData = res.subFolders || res.folders || res.children;
          let filesData = res.files;

          if (subFoldersData && typeof subFoldersData === 'object' && '$values' in subFoldersData) {
            this.folders = Array.isArray(subFoldersData.$values) ? subFoldersData.$values : [];
          } else if (Array.isArray(subFoldersData)) {
            this.folders = subFoldersData;
          } else {
            this.folders = [];
          }

          if (filesData && typeof filesData === 'object' && '$values' in filesData) {
            this.files = Array.isArray(filesData.$values) ? filesData.$values : [];
          } else if (Array.isArray(filesData)) {
            this.files = filesData;
          } else {
            this.files = [];
          }

          // Update breadcrumb trail when navigating forward
          if (folderName) {
            this.breadcrumbTrail.push({ id: folderId, name: this.currentFolder.name });
          }

          console.log('=== Parsed folders:', this.folders);
          console.log('=== Parsed files:', this.files);
        } else {
          this.currentFolder = { id: folderId, name: folderName || 'Root' };
          this.folders = [];
          this.files = [];
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading folder:', err);
        this.isLoading = false;
        this.folders = [];
        this.files = [];
        this.currentFolder = { id: folderId, name: folderName || 'Root' };
        this.cdr.detectChanges();
      }
    });
  }

  onOpenFolder(folder: Folder) {
    this.loadFolder(folder.id, folder.name);
  }

  navigateToHome() {
    this.breadcrumbTrail = [{ id: 1, name: 'Root' }];
    this.loadFolder(1);
  }

  navigateUp() {
    if (this.breadcrumbTrail.length > 1) {
      this.breadcrumbTrail.pop();
      const previous = this.breadcrumbTrail[this.breadcrumbTrail.length - 1];
      this.currentFolderId = previous.id;
      this.loadFolder(previous.id);
    }
  }

  navigateToBreadcrumb(index: number) {
    if (index < this.breadcrumbTrail.length - 1) {
      this.breadcrumbTrail = this.breadcrumbTrail.slice(0, index + 1);
      const target = this.breadcrumbTrail[index];
      this.currentFolderId = target.id;
      this.loadFolder(target.id);
    }
  }

  previewFile(file: FileMetadata) {
    this.previewingFile = file;
  }

  downloadFile(file: FileMetadata) {
    this.fileService.downloadFile(file.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  uploadFiles(fileList: FileList) {
    if (!this.currentFolderId) return;
    this.isLoading = true;
    const files = Array.from(fileList);
    let completed = 0;

    files.forEach(file => {
      this.fileService.uploadFile(file, this.currentFolderId).subscribe({
        next: () => {
          completed++;
          if (completed === files.length) {
            this.loadFolder(this.currentFolderId);
          }
        },
        error: (err) => {
          console.error('Upload error:', err);
          completed++;
          if (completed === files.length) {
            this.isLoading = false;
          }
        }
      });
    });
  }

  createFolder() {
    this.showFolderModal = true;
    this.cdr.detectChanges();
  }

  onFolderNameSubmit(name: string) {
    console.log('Creating folder:', name, 'in parent:', this.currentFolderId);
    if (name && this.currentFolderId) {
      this.showFolderModal = false;
      this.isLoading = true;

      this.fileService.createFolder({ name, parentFolderId: this.currentFolderId }).subscribe({
        next: (res) => {
          console.log('Folder created successfully:', res);
          this.loadFolder(this.currentFolderId);
        },
        error: (err) => {
          console.error('Create folder error:', err);
          this.isLoading = false;
        }
      });
    }
  }

  onFolderModalCancel() {
    this.showFolderModal = false;
    this.cdr.detectChanges();
  }

  logout() {
    this.authService.logout();
    window.location.reload();
  }

  onRenameFolder(event: { folder: Folder, newName: string }) {
    this.fileService.renameFolder(event.folder.id, event.newName).subscribe({
      next: () => {
        console.log('Folder renamed successfully');
        this.loadFolder(this.currentFolderId);
      },
      error: (err) => {
        console.error('Rename folder error:', err);
        alert('Failed to rename folder: ' + (err.error?.error || err.message || 'Unknown error'));
      }
    });
  }

  onDeleteFolder(folder: Folder) {
    this.fileService.deleteFolder(folder.id).subscribe({
      next: () => {
        console.log('Folder deleted successfully');
        this.loadFolder(this.currentFolderId);
      },
      error: (err) => {
        console.error('Delete folder error:', err);
        const errorMsg = err.error?.error || err.message || 'Unknown error';
        alert('Failed to delete folder: ' + errorMsg);
      }
    });
  }

  onMoveFolder(event: { folder: Folder, targetFolderId: number | null }) {
    this.fileService.moveFolder(event.folder.id, event.targetFolderId).subscribe({
      next: () => {
        console.log('Folder moved successfully');
        this.loadFolder(this.currentFolderId);
      },
      error: (err) => {
        console.error('Move folder error:', err);
        const errorMsg = err.error?.error || err.message || 'Unknown error';
        alert('Failed to move folder: ' + errorMsg);
      }
    });
  }
}
