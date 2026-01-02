import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { LoginComponent } from './components/login/login.component';
import { AuthService } from './core/services/auth.service';
import { NavigationService } from './core/services/navigation.service';
import { ShareService } from './core/services/share.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterOutlet, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  isAuthenticated = false;
  isAdmin = false;
  username: string | null = null;
  searchQuery: string = '';
  hasNewSharedItems = false;
  showSearch = true;

  constructor(
    private authService: AuthService,
    private navigationService: NavigationService,
    private shareService: ShareService,
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

    // Initial check
    this.checkAuthentication();

    // Set up periodic token validation (check every 30 seconds)
    setInterval(() => {
      this.checkAuthentication();
      if (this.isAuthenticated) {
        this.checkSharedItems();
      }
    }, 30000);

    // Listen for storage events (handles token changes from other tabs)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'auth_token') {
          this.checkAuthentication();
        }
      });
    }

    this.navigationService.hasNewSharedItems$.subscribe((hasNew) => {
      this.hasNewSharedItems = hasNew;
    });

    // Listen for route changes to clear notification if on shared-with-me
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url;
        this.showSearch = url === '/' || url === '';
        if (url === '/shared-with-me') {
          this.navigationService.setHasNewSharedItems(false);
          this.shareService.getSharedWithMe().subscribe((items) => {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('last_shared_count', items.length.toString());
            }
          });
        }
      });

    // Initial shared items check
    if (this.isAuthenticated) {
      this.checkSharedItems();
    }
  }

  checkAuthentication() {
    // Check if token exists and is valid
    if (this.authService.isAuthenticated()) {
      this.isAuthenticated = true;
      this.isAdmin = this.authService.isAdmin();
      this.username = this.authService.getUsername();
    } else {
      // Token is missing or expired, redirect to login
      this.isAuthenticated = false;
      this.isAdmin = false;
      this.username = null;
      // Clear any invalid token
      if (this.authService.getToken()) {
        this.authService.logout();
      }

      // Redirect to login if not on login page
      const currentUrl = this.router.url;
      if (currentUrl !== '/login') {
        this.router.navigate(['/login']);
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

  navigateToSharedWithMe() {
    this.router.navigate(['/shared-with-me']);
  }

  private checkSharedItems() {
    console.log('Checking shared items...');
    this.shareService.getSharedWithMe().subscribe({
      next: (items) => {
        console.log(`Found ${items.length} shared items`);
        if (typeof localStorage !== 'undefined') {
          const storedValue = localStorage.getItem('last_shared_count');
          console.log(`Stored count: ${storedValue}`);

          if (storedValue === null) {
            // If it's the first time we check, and there are items, notify
            if (items.length > 0) {
              console.log('First time check: items found, notifying');
              this.navigationService.setHasNewSharedItems(true);
            }
          } else {
            const storedCount = parseInt(storedValue);
            if (items.length > storedCount) {
              console.log(`New items found: ${items.length} > ${storedCount}`);
              this.navigationService.setHasNewSharedItems(true);
            } else {
              console.log('No new items');
            }
          }
        }
      },
      error: (err) => console.error('Failed to check shared items', err),
    });
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
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
