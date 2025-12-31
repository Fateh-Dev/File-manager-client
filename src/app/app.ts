import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { LoginComponent } from './components/login/login.component';
import { AuthService } from './core/services/auth.service';
import { NavigationService } from './core/services/navigation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, LoginComponent, RouterOutlet, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  isAuthenticated = false;
  isAdmin = false;
  searchQuery: string = '';
  showCreateFolder = false;

  constructor(
    private authService: AuthService,
    private navigationService: NavigationService,
    private router: Router
  ) {
    // Check authentication status on initialization (including page refresh)
    this.checkAuthentication();
  }

  ngOnInit() {
    // Subscribe to auth state changes
    this.authService.currentUser$.subscribe(() => {
      this.checkAuthentication();
    });

    // Set up periodic token validation (check every 30 seconds)
    setInterval(() => {
      this.checkAuthentication();
    }, 30000);

    // Listen for storage events (handles token changes from other tabs)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'auth_token') {
          this.checkAuthentication();
        }
      });
    }

    this.navigationService.showCreateFolder$.subscribe((show) => {
      // Use microtask to avoid ExpressionChangedAfterItHasBeenCheckedError
      Promise.resolve().then(() => {
        this.showCreateFolder = show;
      });
    });
  }

  checkAuthentication() {
    // Check if token exists and is valid
    if (this.authService.isAuthenticated()) {
      this.isAuthenticated = true;
      this.isAdmin = this.authService.isAdmin();
    } else {
      // Token is missing or expired, redirect to login
      this.isAuthenticated = false;
      this.isAdmin = false;
      // Clear any invalid token
      if (this.authService.getToken()) {
        this.authService.logout();
      }
    }
  }

  // Sidebar controls
  navigateToHome() {
    this.router.navigate(['/']).then(() => {
      this.navigationService.emitSidebarAction('home');
    });
  }

  navigateToPdfEditor() {
    this.router.navigate(['/pdf-template']);
  }

  navigateToAdmin() {
    this.router.navigate(['/admin']);
  }

  loadRecentFiles() {
    this.router.navigate(['/']).then(() => {
      this.navigationService.emitSidebarAction('recent');
    });
  }

  loadDownloads() {
    this.router.navigate(['/']).then(() => {
      this.navigationService.emitSidebarAction('downloads');
    });
  }

  loadRecycleBin() {
    this.router.navigate(['/']).then(() => {
      this.navigationService.emitSidebarAction('recycle');
    });
  }

  // Header controls
  createFolder() {
    this.navigationService.emitCreateFolder();
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    // Debounce or only on enter? Original code did it on enter.
  }

  onSearchEnter() {
    this.navigationService.emitSearch(this.searchQuery);
  }

  clearSearch() {
    this.searchQuery = '';
    this.navigationService.emitSearch('');
  }

  logout() {
    this.authService.logout();
  }
}
