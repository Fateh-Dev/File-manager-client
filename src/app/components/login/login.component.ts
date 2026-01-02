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
    <div class="min-h-screen flex overflow-hidden">
      <!-- Left Side - Illustration -->
      <div
        class="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 items-center justify-center p-12 overflow-hidden"
      >
        <!-- Animated Background Elements -->
        <div class="absolute inset-0">
          <div
            class="absolute top-0 left-0 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-blob"
          ></div>
          <div
            class="absolute top-1/2 right-0 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl animate-blob animation-delay-2000"
          ></div>
          <div
            class="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-400/30 rounded-full blur-3xl animate-blob animation-delay-4000"
          ></div>
        </div>

        <!-- Illustration Content -->
        <div class="relative z-10 text-white max-w-lg">
          <div class="mb-8 animate-fade-in-down">
            <svg
              class="w-full h-auto"
              viewBox="0 0 500 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <!-- File Cabinet Illustration -->
              <g opacity="0.1">
                <circle cx="250" cy="200" r="150" fill="white" />
              </g>

              <!-- Main File Cabinet -->
              <rect x="150" y="120" width="200" height="240" rx="8" fill="white" opacity="0.95" />
              <rect x="160" y="130" width="180" height="70" rx="6" fill="#E0E7FF" />
              <rect x="160" y="210" width="180" height="70" rx="6" fill="#C7D2FE" />
              <rect x="160" y="290" width="180" height="60" rx="6" fill="#A5B4FC" />

              <!-- Drawer Handles -->
              <rect x="230" y="160" width="40" height="6" rx="3" fill="#6366F1" />
              <rect x="230" y="240" width="40" height="6" rx="3" fill="#6366F1" />
              <rect x="230" y="315" width="40" height="6" rx="3" fill="#6366F1" />

              <!-- Floating Documents -->
              <g class="animate-float" style="animation-delay: 0s">
                <rect x="80" y="80" width="50" height="60" rx="4" fill="white" opacity="0.9" />
                <line x1="90" y1="95" x2="120" y2="95" stroke="#6366F1" stroke-width="2" />
                <line x1="90" y1="105" x2="115" y2="105" stroke="#A5B4FC" stroke-width="2" />
                <line x1="90" y1="115" x2="120" y2="115" stroke="#A5B4FC" stroke-width="2" />
              </g>

              <g class="animate-float" style="animation-delay: 1s">
                <rect x="370" y="150" width="50" height="60" rx="4" fill="white" opacity="0.9" />
                <line x1="380" y1="165" x2="410" y2="165" stroke="#6366F1" stroke-width="2" />
                <line x1="380" y1="175" x2="405" y2="175" stroke="#A5B4FC" stroke-width="2" />
                <line x1="380" y1="185" x2="410" y2="185" stroke="#A5B4FC" stroke-width="2" />
              </g>

              <g class="animate-float" style="animation-delay: 2s">
                <rect x="100" y="280" width="50" height="60" rx="4" fill="white" opacity="0.9" />
                <line x1="110" y1="295" x2="140" y2="295" stroke="#6366F1" stroke-width="2" />
                <line x1="110" y1="305" x2="135" y2="305" stroke="#A5B4FC" stroke-width="2" />
                <line x1="110" y1="315" x2="140" y2="315" stroke="#A5B4FC" stroke-width="2" />
              </g>

              <!-- Lock Icon -->
              <circle cx="250" cy="380" r="20" fill="#6366F1" />
              <path
                d="M250 373 L250 367 M244 377 L250 383 L256 377"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <h2 class="text-2xl font-bold mb-4 animate-fade-in">
            Gérez vos fichiers en toute sécurité
          </h2>
          <p class="text-md text-blue-100 mb-6 animate-fade-in animation-delay-200">
            Stockage sécurisé, partage facile, accès de n'importe où
          </p>

          <!-- Feature List -->
          <div class="space-y-4 animate-fade-in animation-delay-400">
            <div class="flex items-center space-x-3">
              <div
                class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <span class="text-md">Stockage illimité et sécurisé</span>
            </div>
            <div class="flex items-center space-x-3">
              <div
                class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <span class="text-md">Partage simplifié avec votre équipe</span>
            </div>
            <div class="flex items-center space-x-3">
              <div
                class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <span class="text-md">Accès depuis tous vos appareils</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side - Login Form -->
      <div
        class="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden"
      >
        <!-- Subtle Background Pattern -->
        <div class="absolute inset-0 opacity-5">
          <div
            class="absolute inset-0"
            style="background-image: radial-gradient(circle, #6366F1 1px, transparent 1px); background-size: 20px 20px;"
          ></div>
        </div>

        <div class="relative w-full max-w-sm z-10">
          <!-- Logo and Title - Mobile/Tablet Only -->
          <div class="text-center mb-4 animate-fade-in-down">
            <div
              class="inline-flex lg:hidden items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg mb-2"
            >
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                ></path>
              </svg>
            </div>
            <h1 class="text-xl font-bold text-gray-800 mb-0.5">
              {{ isRegister ? 'Créer un Compte' : 'Connexion' }}
            </h1>
            <p class="text-gray-500 text-xs">Bienvenue sur votre espace</p>
          </div>

          <!-- Login Card - Simplified -->
          <div class="bg-white rounded-xl shadow-lg p-6 animate-fade-in-up">
            <form (ngSubmit)="isRegister ? register() : login()" class="space-y-3">
              <!-- Username Input -->
              <div>
                <label class="block text-gray-700 text-xs font-medium mb-1">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  [(ngModel)]="username"
                  name="username"
                  class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  placeholder="Votre nom d'utilisateur"
                  required
                />
              </div>

              <!-- Password Input -->
              <div>
                <label class="block text-gray-700 text-xs font-medium mb-1"> Mot de passe </label>
                <input
                  type="password"
                  [(ngModel)]="password"
                  name="password"
                  class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  placeholder="Votre mot de passe"
                  required
                />
              </div>

              <!-- Confirm Password Input -->
              <div *ngIf="isRegister" class="animate-slide-down">
                <label class="block text-gray-700 text-xs font-medium mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  placeholder="Confirmez votre mot de passe"
                  required
                />
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                [disabled]="isLoading"
                class="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-4"
              >
                <span *ngIf="!isLoading">{{
                  isRegister ? 'Créer un Compte' : 'Se Connecter'
                }}</span>
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

            <!-- Toggle Mode -->
            <div class="mt-4 text-center">
              <button
                (click)="toggleMode()"
                class="text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors hover:underline"
              >
                {{
                  isRegister ? 'Déjà un compte ? Connectez-vous' : 'Pas de compte ? Inscrivez-vous'
                }}
              </button>
            </div>
          </div>

          <!-- Footer -->
          <p class="text-center text-gray-500 text-xs mt-4 animate-fade-in">🔒 Système sécurisé</p>
        </div>
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
  styles: [
    `
      @keyframes blob {
        0%,
        100% {
          transform: translate(0, 0) scale(1);
        }
        33% {
          transform: translate(30px, -50px) scale(1.1);
        }
        66% {
          transform: translate(-20px, 20px) scale(0.9);
        }
      }

      @keyframes fade-in-down {
        0% {
          opacity: 0;
          transform: translateY(-20px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fade-in-up {
        0% {
          opacity: 0;
          transform: translateY(20px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fade-in {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }

      @keyframes slide-down {
        0% {
          opacity: 0;
          transform: translateY(-10px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-blob {
        animation: blob 7s infinite;
      }

      @keyframes float {
        0%,
        100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-20px);
        }
      }

      .animate-float {
        animation: float 3s ease-in-out infinite;
      }

      .animation-delay-200 {
        animation-delay: 0.2s;
      }

      .animation-delay-400 {
        animation-delay: 0.4s;
      }

      .animate-fade-in-down {
        animation: fade-in-down 0.6s ease-out;
      }

      .animate-fade-in-up {
        animation: fade-in-up 0.6s ease-out;
      }

      .animate-fade-in {
        animation: fade-in 0.8s ease-out;
      }

      .animate-slide-down {
        animation: slide-down 0.3s ease-out;
      }
    `,
  ],
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
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
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
