import { Routes } from '@angular/router';
import { PdfTemplateContainerComponent } from './components/pdf-template/container/pdf-template-container.component';
import { LoginComponent } from './components/login/login.component';
import { SharedWithMeComponent } from './components/shared-with-me/shared-with-me.component';
import { FileManagerComponent } from './components/file-manager/file-manager.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', component: FileManagerComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'shared-with-me', component: SharedWithMeComponent, canActivate: [AuthGuard] },
  { path: 'pdf-template', component: PdfTemplateContainerComponent },
  {
    path: 'admin',
    loadComponent: () =>
      import('./components/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
    canActivate: [AdminGuard],
  },
  { path: '**', redirectTo: '' },
];
