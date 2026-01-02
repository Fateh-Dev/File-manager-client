import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TemplatePayload } from '../models/template-payload.model';

@Injectable({
  providedIn: 'root',
})
export class PdfTemplateService {
  private apiUrl = '/api/PdfTemplate';

  constructor(private http: HttpClient) {}

  saveTemplate(name: string, image: File, fields: any[]): Observable<any> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', image);
    formData.append('fieldsJson', JSON.stringify(fields));
    return this.http.post(this.apiUrl, formData);
  }
}
