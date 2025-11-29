import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileMetadata } from '../../core/models/file.model';
import { Folder } from '../../core/models/folder.model';

@Component({
  selector: 'app-file-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="flex-1 p-4 h-full overflow-y-auto relative bg-gray-50"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="closeMenu()">
      
      <!-- Drag and drop overlay -->
      <div *ngIf="isDragging" class="fixed inset-0 bg-blue-500/20 border-4 border-dashed border-blue-500 z-50 flex items-center justify-center pointer-events-none animate-fade-in">
        <div class="bg-white rounded-lg p-6 shadow-lg text-center">
          <div class="w-16 h-16 mx-auto mb-3 bg-blue-500 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
          </div>
          <p class="text-blue-600 text-lg font-bold">Drop files here to upload</p>
          <p class="text-gray-500 text-xs mt-1">Release to upload your files</p>
        </div>
      </div>

      <!-- Breadcrumbs and Upload Button -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <button 
            class="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-blue-600 text-sm font-medium"
            (click)="navigateUp.emit()">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            <span>Back</span>
          </button>
          <span class="text-gray-400">/</span>
          <div class="flex items-center space-x-1">
            <ng-container *ngFor="let crumb of breadcrumbTrail; let i = index; let last = last">
              <button 
                *ngIf="!last"
                class="px-2 py-1 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                (click)="navigateToBreadcrumb.emit(i)">
                {{ crumb.name }}
              </button>
              <span 
                *ngIf="last"
                class="px-2 py-1 bg-gray-100 rounded-md text-sm font-medium text-gray-800">
                {{ crumb.name }}
              </span>
              <span *ngIf="!last" class="text-gray-400">/</span>
            </ng-container>
          </div>
        </div>
        <label class="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-pointer shadow-sm text-sm font-medium">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <span>Upload</span>
          <input 
            type="file" 
            multiple 
            class="hidden" 
            (change)="onFileSelect($event)"
            #fileInput>
        </label>
      </div>

      <!-- Loading state -->
      <div *ngIf="isLoading" class="flex items-center justify-center py-16">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3"></div>
          <p class="text-gray-600 text-sm font-medium">Loading...</p>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!isLoading && folders.length === 0 && files.length === 0" class="flex flex-col items-center justify-center py-16">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
          </svg>
        </div>
        <p class="text-gray-600 text-sm font-medium mb-1">This folder is empty</p>
        <p class="text-gray-400 text-xs">Drag and drop files here or create a new folder</p>
      </div>

      <!-- Folders -->
      <div *ngIf="!isLoading && folders.length > 0" class="mb-6">
  <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 px-2">Folders</h3>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-6">
    
    <div *ngFor="let folder of folders; let i = index" 
      class="relative flex flex-col items-center justify-start py-2 px-1 rounded-lg cursor-pointer transition-all duration-300 group hover:bg-gray-50/70 hover:shadow-sm animate-fade-in"
      [style.animation-delay]="(i * 0.05) + 's'"
      [class.opacity-50]="draggingFolder?.id === folder.id"
      [class.bg-blue-50]="dragOverFolder?.id === folder.id"
      [draggable]="true"
      (dragstart)="onFolderDragStart($event, folder)"
      (dragend)="onFolderDragEnd($event)"
      (dragover)="onFolderDragOver($event, folder)"
      (dragleave)="onFolderDragLeave($event, folder)"
      (drop)="onFolderDrop($event, folder)"
      (click)="onFolderClick($event, folder)">
      
      <div class="relative w-24 h-18 text-gray-600 transition-transform duration-200 ease-in-out group-hover:scale-105">
          
          <svg fill="currentColor" viewBox="0 0 24 24" class="w-full h-full">
            <path 
              d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" style="
    color: #cab792;
  "/>
          </svg>
          
          <div class="absolute top-0 right-0 w-3 h-3 rounded-full"
               [ngClass]="getFolderColor(folder)"></div>

          <div *ngIf="getFolderFileCount(folder) > 0" 
               class="absolute bottom-0 right-0 bg-white border border-gray-200 rounded-full px-1 py-0 text-[8px] font-semibold text-gray-700 leading-none shadow-sm">
            {{ getFolderFileCount(folder) }}
          </div>
      </div>
      
     <div class="w-full text-center mt-2">
        <h4 class="text-xs font-semibold text-gray-800 truncate leading-tight" [title]="folder.name">{{ folder.name }}</h4>
        
        <p class="text-[10px] text-gray-500 truncate mt-0.5" title="Last Modified Date">
          {{ getLastModifiedDate(folder) }}
        </p>
      </div>
      
      <div class="absolute top-0 right-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          class="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-100 transition-all"
          (click)="onFolderMenuClick($event, folder)"
          title="Folder options">
          <svg class="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
          </svg>
        </button>
      </div>

      <div *ngIf="showMenuFor?.id === folder.id" 
        class="absolute right-0 top-8 z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px]"
        (click)="$event.stopPropagation()"
        (mousedown)="$event.stopPropagation()">
        
        <button 
          class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          (click)="onRenameFolder(folder)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          <span>Rename</span>
        </button>
        <button 
          class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          (click)="onMoveFolder(folder)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
          <span>Move</span>
        </button>
        <div class="border-t border-gray-200 my-1"></div>
        <button 
          class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
          (click)="onDeleteFolder(folder)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          <span>Delete</span>
        </button>
      </div>
      
    </div>
  </div>
</div>

      <!-- Files -->
      <div *ngIf="!isLoading && files.length > 0">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">Files</h3>
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          <div *ngFor="let file of files; let i = index" 
               class="bg-white p-3 rounded-lg shadow-sm hover:shadow-md cursor-pointer border border-gray-200 flex flex-col items-center justify-center transition-all duration-200 group relative animate-fade-in"
               [style.animation-delay]="(i * 0.05) + 's'"
             (click)="previewFile.emit(file)">
          
            <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-600 transition-colors">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
          </div>
            <span class="text-xs font-medium text-gray-700 truncate w-full text-center group-hover:text-blue-600 transition-colors">{{ file.name }}</span>
            <span class="text-xs text-gray-400 mt-0.5">{{ formatFileSize(file.size) }}</span>
          
          <!-- Download button on hover -->
          <button 
              class="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 hover:bg-gray-50 transition-all duration-200 z-10"
              (click)="downloadFile.emit(file); $event.stopPropagation()"
              title="Download file">
              <svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
          </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class FileGridComponent {
  @Input() folders: Folder[] = [];
  @Input() files: FileMetadata[] = [];
  @Input() currentFolder: Folder | null = null;
  @Input() breadcrumbTrail: { id: number, name: string }[] = [];
  @Input() isLoading = false;
  @Output() openFolder = new EventEmitter<Folder>();
  @Output() previewFile = new EventEmitter<FileMetadata>();
  @Output() downloadFile = new EventEmitter<FileMetadata>();
  @Output() uploadFiles = new EventEmitter<FileList>();
  @Output() navigateUp = new EventEmitter<void>();
  @Output() navigateToBreadcrumb = new EventEmitter<number>();
  @Output() renameFolder = new EventEmitter<{ folder: Folder, newName: string }>();
  @Output() deleteFolder = new EventEmitter<Folder>();
  @Output() moveFolder = new EventEmitter<{ folder: Folder, targetFolderId: number | null }>();

  isDragging = false;
  draggingFolder: Folder | null = null;
  dragOverFolder: Folder | null = null;
  showMenuFor: Folder | null = null;

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getFolderFileCount(folder: Folder): number {
    // If folder has files property, use it, otherwise default to 0
    return (folder as any).fileCount || (folder as any).files?.length || 0;
  }

  getLastModifiedDate(folder: Folder): string {
    // If folder has lastModified property, format it
    if ((folder as any).lastModified) {
      const date = new Date((folder as any).lastModified);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${date.getDate()} ${months[date.getMonth()]}`;
    }
    // Default to current date or a placeholder
    const date = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }

  getFolderColor(folder: Folder): string {
    // Alternate colors for visual variety, or use folder type
    const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];
    const index = folder.id % colors.length;
    return colors[index] || 'bg-blue-500';
  }

  onFolderClick(event: Event, folder: Folder) {
    // Don't open if we just finished dragging
    if (this.draggingFolder) {
      return;
    }

    // Only open folder if not clicking on menu button
    const target = event.target as HTMLElement;
    if (!target.closest('button')) {
      this.openFolder.emit(folder);
    }
  }

  closeMenu() {
    this.showMenuFor = null;
  }

  onFolderMenuClick(event: Event, folder: Folder) {
    event.stopPropagation();
    this.showMenuFor = this.showMenuFor?.id === folder.id ? null : folder;
  }

  onRenameFolder(folder: Folder) {
    this.showMenuFor = null;
    const newName = prompt('Enter new folder name:', folder.name);
    if (newName && newName.trim() && newName !== folder.name) {
      this.renameFolder.emit({ folder, newName: newName.trim() });
    }
  }

  onDeleteFolder(folder: Folder) {
    this.showMenuFor = null;
    if (confirm(`Are you sure you want to delete "${folder.name}"? This action cannot be undone.`)) {
      this.deleteFolder.emit(folder);
    }
  }

  onMoveFolder(folder: Folder) {
    this.showMenuFor = null;
    // Emit event to show folder picker or use drag and drop
    // For now, show instruction
    alert('To move this folder, drag and drop it onto another folder. Or use drag and drop to move it to the current folder.');
  }

  onFolderDragStart(event: DragEvent, folder: Folder) {
    this.draggingFolder = folder;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', folder.id.toString());
    }
  }

  onFolderDragEnd(event: DragEvent) {
    this.draggingFolder = null;
    this.dragOverFolder = null;
  }

  onFolderDragOver(event: DragEvent, folder: Folder) {
    event.preventDefault();
    event.stopPropagation();
    if (this.draggingFolder && this.draggingFolder.id !== folder.id) {
      this.dragOverFolder = folder;
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    }
  }

  onFolderDragLeave(event: DragEvent, folder: Folder) {
    event.preventDefault();
    event.stopPropagation();
    if (this.dragOverFolder?.id === folder.id) {
      this.dragOverFolder = null;
    }
  }

  onFolderDrop(event: DragEvent, targetFolder: Folder) {
    event.preventDefault();
    event.stopPropagation();

    if (this.draggingFolder && this.draggingFolder.id !== targetFolder.id) {
      this.moveFolder.emit({ folder: this.draggingFolder, targetFolderId: targetFolder.id });
    }

    this.draggingFolder = null;
    this.dragOverFolder = null;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Only show file upload overlay if dragging files, not folders
    if (event.dataTransfer?.types.includes('Files')) {
      this.isDragging = true;
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    // Check if dropping files or folder
    if (event.dataTransfer?.files.length) {
      this.uploadFiles.emit(event.dataTransfer.files);
    } else if (this.draggingFolder) {
      // Drop folder on empty area = move to current folder (root)
      this.moveFolder.emit({ folder: this.draggingFolder, targetFolderId: this.currentFolder?.id || null });
      this.draggingFolder = null;
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFiles.emit(input.files);
      // Reset input
      input.value = '';
    }
  }
}
