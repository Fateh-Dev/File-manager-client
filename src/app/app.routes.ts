import { Routes } from '@angular/router';
import { PdfTemplateContainerComponent } from './components/pdf-template/container/pdf-template-container.component';
import { FileManagerComponent } from './components/file-manager/file-manager.component';

export const routes: Routes = [
  { path: '', component: FileManagerComponent },
  { path: 'pdf-template', component: PdfTemplateContainerComponent },
  { path: '**', redirectTo: '' },
];
