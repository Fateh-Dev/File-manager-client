import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfTemplateEditorComponent } from '../editor/pdf-template-editor.component';
import { PdfTemplateService } from '../../../core/services/pdf-template.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { TemplatePayload } from '../../../core/models/template-payload.model';

@Component({
  selector: 'app-pdf-template-container',
  standalone: true,
  imports: [CommonModule, PdfTemplateEditorComponent],
  template: `
    <div class="p-0 h-full overflow-hidden flex flex-col">
      <app-pdf-template-editor (templateSaved)="onSave($event)"></app-pdf-template-editor>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfTemplateContainerComponent implements OnInit {
  constructor(
    private pdfService: PdfTemplateService,
    private navigationService: NavigationService
  ) {}

  ngOnInit(): void {
    this.navigationService.setShowCreateFolder(false);
  }

  onSave(res: any): void {
    console.log('Template saved successfully:', res);
  }
}
