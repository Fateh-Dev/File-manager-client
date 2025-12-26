import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TemplatePayload } from '../models/template-payload.model';

@Injectable({
  providedIn: 'root',
})
export class PdfTemplateService {
  private apiUrl = 'http://localhost:5089/api/pdf-templates';

  constructor(private http: HttpClient) {}

  saveTemplate(payload: TemplatePayload): Observable<any> {
    const formData = new FormData();
    formData.append('templateName', payload.templateName);
    formData.append('fields', JSON.stringify(payload.fields));

    if (payload.imageTemplate instanceof File) {
      formData.append('imageTemplate', payload.imageTemplate);
    } else if (typeof payload.imageTemplate === 'string') {
      // If it's a base64 string or URL, handle accordingly
      formData.append('imageTemplateData', payload.imageTemplate);
    }

    return this.http.post(this.apiUrl, formData);
  }
}
