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
  searchQuery: string = '';
  showCreateFolder = false;

  constructor(
    private authService: AuthService,
    private navigationService: NavigationService,
    private router: Router
  ) {
    this.isAuthenticated = !!this.authService.getToken();
  }

  ngOnInit() {
    this.navigationService.showCreateFolder$.subscribe((show) => {
      this.showCreateFolder = show;
    });
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
    window.location.reload();
  }
}
