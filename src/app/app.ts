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
  searchQuery: string = '';

  viewMode: 'standard' | 'recent' | 'recycle-bin' = 'standard';

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
    this.viewMode = 'standard'; // Reset view mode
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

  loadRecycleBin() {
    this.isLoading = true;
    this.viewMode = 'recycle-bin';
    this.currentFolderId = -1; // Special ID
    this.folders = [];
    this.files = [];
    this.cdr.detectChanges();

    this.fileService.getRecycleBin().subscribe({
      next: (res) => {
        this.folders = res.folders || [];
        this.files = res.files || [];
        this.currentFolder = { id: -1, name: 'Recycle Bin' };
        this.breadcrumbTrail = [{ id: 1, name: 'Root' }, { id: -1, name: 'Recycle Bin' }];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading recycle bin:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadRecentFiles() {
    this.isLoading = true;
    this.viewMode = 'recent';
    this.currentFolderId = -2; // Special ID
    this.folders = [];
    this.files = [];
    this.cdr.detectChanges();

    this.fileService.getRecentFiles().subscribe({
      next: (res) => {
        this.files = res.files || [];
        this.currentFolder = { id: -2, name: 'Recent Files' };
        this.breadcrumbTrail = [{ id: 1, name: 'Root' }, { id: -2, name: 'Recent Files' }];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading recent files:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadDownloads() {
    this.isLoading = true;
    this.viewMode = 'standard'; // Downloads is a real folder, so standard view
    this.folders = [];
    this.files = [];
    this.cdr.detectChanges();

    this.fileService.getDownloads().subscribe({
      next: (res) => {
        // Treat as loading a folder
        this.currentFolderId = res.id;
        this.currentFolder = { id: res.id, name: 'Downloads' };

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

        this.breadcrumbTrail = [{ id: 1, name: 'Root' }, { id: res.id, name: 'Downloads' }];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading downloads:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onRestoreFolder(folder: Folder) {
    this.fileService.restoreFolder(folder.id).subscribe({
      next: () => {
        console.log('Folder restored');
        this.loadRecycleBin(); // Reload recycle bin
      },
      error: (err) => alert('Failed to restore folder')
    });
  }

  onRestoreFile(file: FileMetadata) {
    this.fileService.restoreFile(file.id).subscribe({
      next: () => {
        console.log('File restored');
        this.loadRecycleBin();
      },
      error: (err) => alert('Failed to restore file')
    });
  }

  onPurgeFolder(folder: Folder) {
    if (confirm('Are you sure you want to permanently delete this folder? This cannot be undone.')) {
      this.fileService.purgeFolder(folder.id).subscribe({
        next: () => {
          console.log('Folder purged');
          this.loadRecycleBin();
        },
        error: (err) => alert('Failed to delete folder permanently')
      });
    }
  }

  onPurgeFile(file: FileMetadata) {
    if (confirm('Are you sure you want to permanently delete this file? This cannot be undone.')) {
      this.fileService.purgeFile(file.id).subscribe({
        next: () => {
          console.log('File purged');
          this.loadRecycleBin();
        },
        error: (err) => alert('Failed to delete file permanently')
      });
    }
  }

  onOpenFolder(folder: Folder) {
    if (this.viewMode === 'recycle-bin') return; // Cannot open deleted folders
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
      if (previous.id < 0) {
        // Handle special views if needed, but usually we go back to root or parent
        if (previous.name === 'Recycle Bin') this.loadRecycleBin();
        else if (previous.name === 'Recent Files') this.loadRecentFiles();
        else this.loadFolder(previous.id);
      } else {
        this.currentFolderId = previous.id;
        this.loadFolder(previous.id);
      }
    }
  }

  navigateToBreadcrumb(index: number) {
    if (index < this.breadcrumbTrail.length - 1) {
      this.breadcrumbTrail = this.breadcrumbTrail.slice(0, index + 1);
      const target = this.breadcrumbTrail[index];
      if (target.id < 0) {
        if (target.name === 'Recycle Bin') this.loadRecycleBin();
        else if (target.name === 'Recent Files') this.loadRecentFiles();
      } else {
        this.currentFolderId = target.id;
        this.loadFolder(target.id);
      }
    }
  }

  previewFile(file: FileMetadata) {
    if (this.viewMode === 'recycle-bin') return; // Cannot preview deleted files
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
    if (!this.currentFolderId || this.currentFolderId < 0) return; // Cannot upload to special views
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
    if (this.currentFolderId < 0) return; // Cannot create folder in special views
    this.showFolderModal = true;
    this.cdr.detectChanges();
  }

  onFolderNameSubmit(name: string) {
    console.log('Creating folder:', name, 'in parent:', this.currentFolderId);
    if (name && this.currentFolderId && this.currentFolderId > 0) {
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

  onMoveFile(event: { file: FileMetadata, targetFolderId: number | null }) {
    if (!event.targetFolderId) return;

    this.isLoading = true;
    this.fileService.moveFile(event.file.id, event.targetFolderId).subscribe({
      next: () => {
        this.loadFolder(this.currentFolderId);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error moving file:', error);
        this.isLoading = false;
        alert('Failed to move file');
      }
    });
  }

  onDeleteFile(file: FileMetadata) {
    this.fileService.deleteFile(file.id).subscribe({
      next: () => {
        console.log('File deleted successfully');
        this.loadFolder(this.currentFolderId);
      },
      error: (err) => {
        console.error('Delete file error:', err);
        const errorMsg = err.error?.error || err.message || 'Unknown error';
        alert('Failed to delete file: ' + errorMsg);
      }
    });
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;

    if (!this.searchQuery.trim()) {
      // Immediately restore folder view when search is cleared
      if (this.currentFolderId !== -1) {
        this.loadFolder(this.currentFolderId);
      } else {
        this.currentFolderId = 1;
        this.loadFolder(1);
      }
      return;
    }

    // Don't trigger search automatically - only on Enter key
  }

  onSearchEnter() {
    if (this.searchQuery && this.searchQuery.trim()) {
      // Trigger search on Enter
      this.performSearch(this.searchQuery);
    }
  }

  private performSearch(searchQuery: string) {
    // Skip if query is empty (cleared)
    if (!searchQuery.trim()) {
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges(); // Force update to show loading state

    this.fileService.search(searchQuery).subscribe({
      next: (results) => {
        this.folders = results.folders;
        this.files = results.files;
        this.currentFolder = { id: -1, name: 'Search Results', parentFolderId: undefined, subFolders: [], files: [] };
        this.breadcrumbTrail = [{ id: 1, name: 'Root' }, { id: -1, name: 'Search Results' }];
        this.isLoading = false;
        this.cdr.detectChanges(); // Force update after data is loaded
      },
      error: (error) => {
        console.error('Error searching:', error);
        this.isLoading = false;
        this.cdr.detectChanges(); // Force update on error
      }
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.currentFolderId = 1;
    this.loadFolder(1);
  }
}
