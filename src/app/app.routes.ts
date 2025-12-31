import { Routes } from '@angular/router';
import { PdfTemplateContainerComponent } from './components/pdf-template/container/pdf-template-container.component';
import { FileManagerComponent } from './components/file-manager/file-manager.component';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', component: FileManagerComponent },
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
