import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DialogComponent } from '../dialog/dialog.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Logo and Title -->
        <div class="text-center mb-6 animate-fade-in">
          <div
            class="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-lg shadow-md mb-3"
          >
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              ></path>
            </svg>
          </div>
          <h1 class="text-xl font-bold text-gray-800 mb-1">Gestionnaire de Fichiers</h1>
          <p class="text-gray-500 text-sm">Connectez-vous pour accéder à vos fichiers</p>
        </div>

        <!-- Login Card -->
        <div class="bg-white rounded-lg shadow-md p-6 animate-fade-in">
          <h2 class="text-lg font-bold text-gray-800 mb-4 text-center">
            {{ isRegister ? 'Créer un Compte' : 'Bienvenue' }}
          </h2>

          <form (ngSubmit)="isRegister ? register() : login()" class="space-y-4">
            <div>
              <label class="block text-gray-700 text-xs font-semibold mb-1.5">
                Nom d'utilisateur
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <svg
                    class="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                </div>
                <input
                  type="text"
                  [(ngModel)]="username"
                  name="username"
                  class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="Entrez votre nom d'utilisateur"
                  required
                />
              </div>
            </div>

            <div>
              <label class="block text-gray-700 text-xs font-semibold mb-1.5"> Mot de passe </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <svg
                    class="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    ></path>
                  </svg>
                </div>
                <input
                  type="password"
                  [(ngModel)]="password"
                  name="password"
                  class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="Entrez votre mot de passe"
                  required
                />
              </div>
            </div>

            <div *ngIf="isRegister">
              <label class="block text-gray-700 text-xs font-semibold mb-1.5">
                Confirmer le mot de passe
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <svg
                    class="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    ></path>
                  </svg>
                </div>
                <input
                  type="password"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="Confirmez votre mot de passe"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              [disabled]="isLoading"
              class="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span *ngIf="!isLoading">{{ isRegister ? 'Créer un Compte' : 'Se Connecter' }}</span>
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
          </form>

          <div class="mt-4 text-center">
            <button
              (click)="toggleMode()"
              class="text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors"
            >
              {{
                isRegister
                  ? 'Vous avez déjà un compte ? Connectez-vous'
                  : "Vous n'avez pas de compte ? Inscrivez-vous"
              }}
            </button>
          </div>
        </div>

        <!-- Footer -->
        <p class="text-center text-gray-400 text-sm mt-6">
          Système de gestion de fichiers sécurisé
        </p>
      </div>

      <!-- Generic Dialog -->
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
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  confirmPassword = '';
  isRegister = false;
  isLoading = false;
  returnUrl = '/';

  dialogData = {
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
    buttonText: 'Compris',
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // If already authenticated, redirect to home/returnUrl
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  login() {
    this.isLoading = true;
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (this.authService.isAuthenticated()) {
          this.router.navigate([this.returnUrl]);
        } else {
          this.showDialog('Erreur', 'Échec de la connexion. Token invalide.', 'error');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (
          err.status === 401 &&
          err.error === 'Account is inactive. Please contact an administrator.'
        ) {
          this.showDialog(
            'Compte Inactif',
            'Votre compte est inactif. Veuillez contacter un administrateur.',
            'error'
          );
        } else {
          this.showDialog(
            'Erreur de Connexion',
            'Échec de la connexion. Veuillez vérifier vos identifiants.',
            'error'
          );
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  register() {
    if (this.password !== this.confirmPassword) {
      this.showDialog('Erreur', 'Les mots de passe ne correspondent pas.', 'error');
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.authService.register({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.isLoading = false;
        this.username = '';
        this.password = '';
        this.confirmPassword = '';
        this.showDialog(
          'Inscription Réussie',
          'Votre compte a été créé avec succès et est en cours de validation par un administrateur.',
          'success'
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showDialog(
          'Erreur',
          "Échec de l'inscription. Le nom d'utilisateur existe peut-être déjà.",
          'error'
        );
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  showDialog(title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.dialogData = {
      isOpen: true,
      title,
      message,
      type,
      buttonText: 'Compris',
    };
  }

  closeDialog() {
    this.dialogData.isOpen = false;
    if (this.dialogData.type === 'success') {
      this.isRegister = false;
    }
  }

  toggleMode() {
    this.isRegister = !this.isRegister;
    this.username = '';
    this.password = '';
    this.confirmPassword = '';
  }
}
