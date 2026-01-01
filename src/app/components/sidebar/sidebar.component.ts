import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-56 bg-white h-full border-r border-gray-200 flex flex-col shadow-sm">
      <div class="p-4 py-2.5  border-gray-200">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              ></path>
            </svg>
          </div>
          <h2 class="text-base font-bold text-gray-800">Mes Fichiers</h2>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto p-3">
        <nav class="space-y-1">
          <button
            class="w-full p-2 hover:bg-gray-100 rounded-md cursor-pointer flex items-center text-gray-700 hover:text-blue-600 transition-colors text-sm"
            (click)="navigateHome.emit()"
          >
            <div
              class="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center mr-2 group-hover:bg-blue-500 transition-colors"
            >
              <svg
                class="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                ></path>
              </svg>
            </div>
            <span class="font-medium">Accueil</span>
          </button>

          <!-- <div class="pt-3 mt-3 border-t border-gray-200">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
              Conception
            </p> -->
          <button
            class="w-full p-2 hover:bg-gray-100 rounded-md cursor-pointer flex items-center text-gray-700 hover:text-blue-600 transition-colors text-sm"
            (click)="navigatePdfEditor.emit()"
          >
            <div
              class="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center mr-2 group-hover:bg-blue-500 transition-colors"
            >
              <svg
                class="w-4 h-4 text-gray-600"
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
            <span class="font-medium">Éditeur PDF</span>
          </button>
          <button
            class="w-full p-2 hover:bg-gray-100 rounded-md cursor-pointer flex items-center text-gray-700 hover:text-blue-600 transition-colors text-sm"
            (click)="navigateSharedWithMe.emit()"
          >
            <div
              class="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center mr-2 group-hover:bg-blue-500 transition-colors"
            >
              <svg
                class="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                ></path>
              </svg>
            </div>
            <span class="font-medium">Partagés avec moi</span>
          </button>
          <!-- </div> -->

          <!-- Admin Link -->
          <button
            *ngIf="isAdmin"
            class="w-full p-2 hover:bg-gray-100 rounded-md cursor-pointer flex items-center text-gray-700 hover:text-blue-600 transition-colors text-sm"
            (click)="navigateAdmin.emit()"
          >
            <div
              class="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center mr-2 group-hover:bg-blue-500 transition-colors"
            >
              <svg
                class="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                ></path>
              </svg>
            </div>
            <span class="font-medium">Administration</span>
          </button>
          <div class="pt-3 mt-3 border-t border-gray-200">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
              Accès Rapide
            </p>
            <div class="space-y-0.5">
              <div
                class="p-2 rounded-md flex items-center text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors text-sm"
                (click)="navigateRecent.emit()"
              >
                <svg
                  class="w-4 h-4 mr-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span class="text-xs">Fichiers Récents</span>
              </div>
              <div
                class="p-2 rounded-md flex items-center text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors text-sm"
                (click)="navigateDownloads.emit()"
              >
                <svg
                  class="w-4 h-4 mr-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  ></path>
                </svg>
                <span class="text-xs">Téléchargements</span>
              </div>
              <div
                class="p-2 rounded-md flex items-center text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors text-sm"
                (click)="navigateRecycleBin.emit()"
              >
                <svg
                  class="w-4 h-4 mr-2 text-gray-400"
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
                <span class="text-xs">Corbeille</span>
              </div>
            </div>
          </div>
        </nav>
      </div>
      <div class="p-3 border-t border-gray-200">
        <div class="bg-gray-50 rounded-md p-3">
          <p class="text-xs font-semibold text-gray-600 mb-1">Stockage</p>
          <div class="w-full bg-gray-200 rounded-full h-1.5 mb-1.5">
            <div
              class="h-1.5 rounded-full transition-all"
              [ngClass]="
                storagePercentage > 90
                  ? 'bg-red-500'
                  : storagePercentage > 70
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
              "
              [style.width.%]="storagePercentage"
            ></div>
          </div>
          <p class="text-xs text-gray-500">
            {{ usedStorageGB }} Go sur {{ storageLimitGB }} Go utilisés
          </p>
        </div>
      </div>
    </div>
  `,
})
export class SidebarComponent implements OnInit {
  @Input() isAdmin = false;
  @Output() navigateHome = new EventEmitter<void>();
  @Output() navigatePdfEditor = new EventEmitter<void>();
  @Output() navigateRecent = new EventEmitter<void>();
  @Output() navigateDownloads = new EventEmitter<void>();
  @Output() navigateRecycleBin = new EventEmitter<void>();
  @Output() navigateAdmin = new EventEmitter<void>();
  @Output() navigateSharedWithMe = new EventEmitter<void>();

  usedStorageGB = '0';
  storageLimitGB = '5';
  storagePercentage = 0;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadStorageInfo();
  }

  loadStorageInfo() {
    this.authService.getMe().subscribe({
      next: (user) => {
        const usedGB = user.usedStorage / (1024 * 1024 * 1024);
        const limitGB = user.storageLimit / (1024 * 1024 * 1024);
        this.usedStorageGB = usedGB.toFixed(2);
        this.storageLimitGB = limitGB.toFixed(1);
        this.storagePercentage = limitGB > 0 ? Math.min((usedGB / limitGB) * 100, 100) : 0;
      },
      error: (err) => console.error('Failed to load storage info', err),
    });
  }
}
