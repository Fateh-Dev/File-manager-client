import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DialogComponent } from '../dialog/dialog.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogComponent],
  template: `
    <div class="bg-gray-50 min-h-screen p-6">
      <div class="max-w-5xl mx-auto">
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Left Column - Profile Info & Storage -->
          <div class="lg:w-1/3 space-y-6">
            <!-- User Info Card -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
              <div class="p-6 bg-gradient-to-r from-blue-500 to-indigo-600">
                <div class="flex flex-col items-center text-center">
                  <div
                    class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold text-white border-2 border-white/30 mb-3"
                  >
                    {{ username?.charAt(0)?.toUpperCase() }}
                  </div>
                  <h2 class="text-xl font-bold text-white">{{ username }}</h2>
                  <p class="text-blue-100 text-sm">
                    {{ isAdmin ? 'Administrateur' : 'Utilisateur' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Storage Card -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-4">Stockage</h3>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600">Espace utilisé</span>
                <span class="text-sm font-medium text-gray-800">
                  {{ usedStorage / (1024 * 1024 * 1024) | number : '1.2-2' }} Go /
                  {{ storageLimit / (1024 * 1024 * 1024) | number : '1.2-2' }} Go
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all duration-300"
                  [ngClass]="{
                    'bg-green-500': storagePercent < 70,
                    'bg-yellow-500': storagePercent >= 70 && storagePercent < 90,
                    'bg-red-500': storagePercent >= 90
                  }"
                  [style.width.%]="storagePercent"
                ></div>
              </div>
            </div>

            <!-- Back Button -->
            <button
              (click)="goBack()"
              class="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors flex items-center"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
              Retour
            </button>
          </div>

          <!-- Right Column - Change Password -->
          <div class="lg:w-2/3">
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-4">Changer le mot de passe</h3>
              <form (ngSubmit)="changePassword()" class="space-y-4">
                <div>
                  <label class="block text-gray-700 text-sm font-medium mb-1">
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    [(ngModel)]="currentPassword"
                    name="currentPassword"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Entrez votre mot de passe actuel"
                    required
                  />
                </div>
                <div>
                  <label class="block text-gray-700 text-sm font-medium mb-1">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    [(ngModel)]="newPassword"
                    name="newPassword"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Entrez votre nouveau mot de passe"
                    required
                  />
                </div>
                <div>
                  <label class="block text-gray-700 text-sm font-medium mb-1">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    [(ngModel)]="confirmPassword"
                    name="confirmPassword"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Confirmez votre nouveau mot de passe"
                    required
                  />
                </div>
                <div class="pt-2">
                  <button
                    type="submit"
                    [disabled]="isLoading || !currentPassword || !newPassword || !confirmPassword"
                    class="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span *ngIf="!isLoading">Changer le mot de passe</span>
                    <span *ngIf="isLoading" class="flex items-center justify-center">
                      <svg
                        class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Traitement...
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <app-dialog
        [isOpen]="dialogData.isOpen"
        [title]="dialogData.title"
        [message]="dialogData.message"
        [type]="dialogData.type"
        [buttonText]="dialogData.buttonText"
        (closed)="closeDialog()"
      ></app-dialog>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  username: string | null = null;
  isAdmin = false;
  usedStorage = 0;
  storageLimit = 0;
  storagePercent = 0;

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;

  dialogData = {
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
    buttonText: 'OK',
  };

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.username = this.authService.getUsername();
    this.isAdmin = this.authService.isAdmin();
    this.loadUserInfo();
  }

  loadUserInfo() {
    this.authService.getMe().subscribe({
      next: (user) => {
        this.usedStorage = user.usedStorage || 0;
        this.storageLimit = user.storageLimit || 5 * 1024 * 1024 * 1024;
        this.storagePercent =
          this.storageLimit > 0 ? (this.usedStorage / this.storageLimit) * 100 : 0;
      },
      error: (err) => {
        console.error('Error loading user info:', err);
      },
    });
  }

  changePassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.showDialog('Erreur', 'Les mots de passe ne correspondent pas.', 'error');
      return;
    }

    if (this.newPassword.length < 4) {
      this.showDialog('Erreur', 'Le mot de passe doit contenir au moins 4 caractères.', 'error');
      return;
    }

    this.isLoading = true;
    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.showDialog('Succès', 'Votre mot de passe a été changé avec succès.', 'success');
      },
      error: (err) => {
        this.isLoading = false;
        const message = err.error || 'Une erreur est survenue.';
        this.showDialog('Erreur', message, 'error');
      },
    });
  }

  showDialog(title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.dialogData = {
      isOpen: true,
      title,
      message,
      type,
      buttonText: 'OK',
    };
  }

  closeDialog() {
    this.dialogData.isOpen = false;
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
