import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateShareLinkDto {
  fileId?: number;
  folderId?: number;
  expirationDate?: string;
}

export interface SharedLinkInfo {
  type: 'file' | 'folder';
  name: string;
  size?: number;
  extension?: string;
  uploadDate?: string;
  subFolders?: any[];
  files?: any[];
}

@Injectable({
  providedIn: 'root',
})
export class ShareService {
  private apiUrl = 'http://localhost:5089/api/sharing';

  constructor(private http: HttpClient) {}

  createShareLink(dto: CreateShareLinkDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/links`, dto);
  }

  getSharedInfo(token: string): Observable<SharedLinkInfo> {
    return this.http.get<SharedLinkInfo>(`${this.apiUrl}/info/${token}`);
  }

  getDownloadUrl(token: string): string {
    return `${this.apiUrl}/download/${token}`;
  }

  getMyLinks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-links`);
  }

  revokeLink(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/links/${id}`);
  }
}
