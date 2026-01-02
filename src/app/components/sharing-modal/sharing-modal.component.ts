import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShareService } from '../../core/services/share.service';

@Component({
  selector: 'app-sharing-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="isOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in"
      (click)="onClose()"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up relative overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white"
        >
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200"
            >
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                ></path>
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-800">Partager avec un utilisateur</h2>
              <p class="text-xs text-gray-500 truncate max-w-[200px]">{{ itemName }}</p>
            </div>
          </div>
          <button
            (click)="onClose()"
            class="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <div *ngIf="!successMessage" class="space-y-6">
            <!-- People with Access Section -->
            <div *ngIf="activePermissions.length > 0" class="space-y-3">
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider"
                >Personnes ayant accès</label
              >
              <div class="space-y-2">
                <div
                  *ngFor="let perm of activePermissions"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600"
                    >
                      {{ perm.username.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-700">{{ perm.username }}</p>
                      <p class="text-[10px] text-gray-400 capitalize">
                        {{ perm.accessLevel === 1 ? 'Lecture & Modification' : 'Lecture seule' }}
                      </p>
                    </div>
                  </div>
                  <button
                    (click)="revokePermission(perm.id)"
                    [disabled]="isRevoking === perm.id"
                    class="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Révoquer l'accès"
                  >
                    <svg
                      *ngIf="isRevoking !== perm.id"
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                    <div
                      *ngIf="isRevoking === perm.id"
                      class="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"
                    ></div>
                  </button>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="space-y-2">
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider"
                  >Partager avec d'autres</label
                >
                <div class="relative">
                  <input
                    type="text"
                    [(ngModel)]="searchUser"
                    placeholder="Rechercher un utilisateur..."
                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                  <svg
                    class="w-5 h-5 text-gray-400 absolute right-3 top-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </div>
              </div>

              <!-- Users List -->
              <div class="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                <div *ngIf="isLoadingUsers" class="py-10 text-center">
                  <div
                    class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"
                  ></div>
                  <p class="text-xs text-gray-500">Chargement des utilisateurs...</p>
                </div>

                <div
                  *ngFor="let user of filteredUsers"
                  (click)="selectedUserId = user.id"
                  class="p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all border border-transparent"
                  [class.bg-blue-50]="selectedUserId === user.id"
                  [class.border-blue-200]="selectedUserId === user.id"
                  [class.hover:bg-gray-50]="selectedUserId !== user.id"
                >
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-600"
                    >
                      {{ user.username.charAt(0).toUpperCase() }}
                    </div>
                    <span class="text-sm font-medium text-gray-700">{{ user.username }}</span>
                  </div>
                  <div
                    *ngIf="selectedUserId === user.id"
                    class="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-sm animate-scale-in"
                  >
                    <svg
                      class="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  </div>
                </div>

                <div
                  *ngIf="!isLoadingUsers && filteredUsers.length === 0"
                  class="py-10 text-center"
                >
                  <p class="text-sm text-gray-500">Aucun utilisateur trouvé</p>
                </div>
              </div>

              <!-- Access Level -->
              <div class="pt-2">
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"
                  >Niveau d'accès</label
                >
                <div class="grid grid-cols-2 gap-2">
                  <button
                    (click)="accessLevel = 0"
                    class="btn w-full"
                    [class.btn-primary]="accessLevel === 0"
                    [class.btn-secondary]="accessLevel !== 0"
                  >
                    Lecture uniquement
                  </button>
                  <button
                    (click)="accessLevel = 1"
                    class="btn w-full"
                    [class.btn-primary]="accessLevel === 1"
                    [class.btn-secondary]="accessLevel !== 1"
                  >
                    Lecture & Modification
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Success State -->
          <div *ngIf="successMessage" class="py-8 text-center space-y-4 animate-scale-in">
            <div
              class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"
            >
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-800">Partagé !</h3>
            <p class="text-gray-600">{{ successMessage }}</p>
            <button (click)="onClose()" class="btn btn-primary mt-6 px-8">Terminé</button>
          </div>
        </div>

        <!-- Footer -->
        <div *ngIf="!successMessage" class="flex space-x-3 p-6 bg-gray-50 border-t border-gray-100">
          <button (click)="onClose()" class="btn btn-secondary w-full justify-center">
            Annuler
          </button>
          <button
            (click)="share()"
            [disabled]="!selectedUserId || isSharing"
            class="btn btn-primary w-full justify-center"
          >
            <span
              *ngIf="isSharing"
              class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"
            ></span>
            <span>{{ isSharing ? 'Partage...' : 'Partager' }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      @keyframes scaleIn {
        from {
          transform: scale(0.95);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
      .animate-slide-up {
        animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .animate-scale-in {
        animation: scaleIn 0.2s ease-out;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e5e7eb;
        border-radius: 20px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #d1d5db;
      }
    `,
  ],
})
export class SharingModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() itemId?: number;
  @Input() itemType?: 'file' | 'folder';
  @Input() itemName = '';
  @Output() closed = new EventEmitter<void>();

  users: any[] = [];
  activePermissions: any[] = [];
  searchUser = '';
  selectedUserId: number | null = null;
  accessLevel = 0; // 0 = Read, 1 = Edit
  isSharing = false;
  isRevoking: number | null = null;
  isLoadingUsers = false;
  successMessage: string | null = null;

  constructor(private shareService: ShareService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadUsers();
    this.loadItemPermissions();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      this.loadUsers();
      this.loadItemPermissions();
    }
  }

  get filteredUsers() {
    if (!this.searchUser) return this.users;
    const query = this.searchUser.toLowerCase();
    return this.users.filter((u) => u.username.toLowerCase().includes(query));
  }

  loadUsers() {
    this.isLoadingUsers = true;
    this.shareService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoadingUsers = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isLoadingUsers = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadItemPermissions() {
    if (!this.itemId) return;
    this.shareService
      .getItemPermissions(
        this.itemType === 'file' ? this.itemId : undefined,
        this.itemType === 'folder' ? this.itemId : undefined
      )
      .subscribe({
        next: (perms) => {
          this.activePermissions = perms;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error loading permissions:', err),
      });
  }

  revokePermission(permissionId: number) {
    this.isRevoking = permissionId;
    this.shareService.revokeShare(permissionId).subscribe({
      next: () => {
        this.activePermissions = this.activePermissions.filter((p) => p.id !== permissionId);
        this.isRevoking = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Revoke error:', err);
        this.isRevoking = null;
        this.cdr.detectChanges();
      },
    });
  }

  onClose() {
    this.isOpen = false;
    this.successMessage = null;
    this.selectedUserId = null;
    this.searchUser = '';
    this.closed.emit();
  }

  share() {
    if (!this.itemId || !this.selectedUserId) return;

    this.isSharing = true;
    const targetUser = this.users.find((u) => u.id === this.selectedUserId);

    this.shareService
      .shareItem(
        this.selectedUserId,
        this.itemType === 'file' ? this.itemId : undefined,
        this.itemType === 'folder' ? this.itemId : undefined,
        this.accessLevel
      )
      .subscribe({
        next: () => {
          this.isSharing = false;
          this.successMessage = `Contenu partagé avec ${targetUser?.username}`;
          this.loadItemPermissions(); // Refresh list
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Sharing error:', err);
          this.isSharing = false;
          this.cdr.detectChanges();
          alert('Erreur lors du partage');
        },
      });
  }
}
