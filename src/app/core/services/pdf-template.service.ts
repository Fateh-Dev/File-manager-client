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
    // Send as JSON payload since image is already uploaded and we only have the GUID
    return this.http.post(this.apiUrl, payload);
  }
}
