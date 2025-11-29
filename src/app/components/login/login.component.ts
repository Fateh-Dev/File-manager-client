import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Logo and Title -->
        <div class="text-center mb-6 animate-fade-in">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-lg shadow-md mb-3">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
            </svg>
          </div>
          <h1 class="text-xl font-bold text-gray-800 mb-1">
            File Manager
          </h1>
          <p class="text-gray-500 text-sm">Sign in to access your files</p>
        </div>

        <!-- Login Card -->
        <div class="bg-white rounded-lg shadow-md p-6 animate-fade-in">
          <h2 class="text-lg font-bold text-gray-800 mb-4 text-center">
            {{ isRegister ? 'Create Account' : 'Welcome Back' }}
          </h2>
          
          <form (ngSubmit)="isRegister ? register() : login()" class="space-y-4">
            <div>
              <label class="block text-gray-700 text-xs font-semibold mb-1.5">
                Username
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <input 
                  type="text" 
                  [(ngModel)]="username" 
                  name="username"
                  class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="Enter your username"
                  required>
              </div>
            </div>
            
            <div>
              <label class="block text-gray-700 text-xs font-semibold mb-1.5">
                Password
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <input 
                  type="password" 
                  [(ngModel)]="password" 
                  name="password"
                  class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="Enter your password"
                  required>
              </div>
            </div>
            
            <div *ngIf="errorMessage" class="bg-red-50 border-l-4 border-red-500 text-red-700 p-2.5 rounded-md animate-fade-in">
              <div class="flex items-center">
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-xs font-medium">{{ errorMessage }}</span>
              </div>
            </div>
            
            <button 
              type="submit"
              [disabled]="isLoading"
              class="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              <span *ngIf="!isLoading">{{ isRegister ? 'Create Account' : 'Sign In' }}</span>
              <span *ngIf="isLoading" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            </button>
          </form>
          
          <div class="mt-4 text-center">
            <button 
              (click)="toggleMode()"
              class="text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors">
              {{ isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up" }}
            </button>
          </div>
        </div>

        <!-- Footer -->
        <p class="text-center text-gray-400 text-sm mt-6">
          Secure file management system
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
    username = '';
    password = '';
    isRegister = false;
    errorMessage = '';
    isLoading = false;

    constructor(private authService: AuthService) { }

    login() {
        this.errorMessage = '';
        this.isLoading = true;
        this.authService.login({ username: this.username, password: this.password }).subscribe({
            next: () => {
                this.isLoading = false;
                window.location.reload();
            },
            error: (err) => {
                this.errorMessage = 'Login failed. Please check your credentials.';
                this.isLoading = false;
            }
        });
    }

    register() {
        this.errorMessage = '';
        this.isLoading = true;
        this.authService.register({ username: this.username, password: this.password }).subscribe({
            next: () => {
                this.isLoading = false;
                this.isRegister = false;
                this.errorMessage = '';
                alert('Registration successful! Please login.');
            },
            error: (err) => {
                this.errorMessage = 'Registration failed. Username may already exist.';
                this.isLoading = false;
            }
        });
    }

    toggleMode() {
        this.isRegister = !this.isRegister;
        this.errorMessage = '';
    }
}
