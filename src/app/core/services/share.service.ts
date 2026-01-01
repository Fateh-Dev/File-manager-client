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

  shareItem(
    targetUserId: number,
    fileId?: number,
    folderId?: number,
    accessLevel: number = 0
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/share`, { targetUserId, fileId, folderId, accessLevel });
  }

  getSharedWithMe(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/shared-with-me`);
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  getItemPermissions(fileId?: number, folderId?: number): Observable<any[]> {
    let params = '';
    if (fileId) params = `?fileId=${fileId}`;
    else if (folderId) params = `?folderId=${folderId}`;
    return this.http.get<any[]>(`${this.apiUrl}/item-permissions${params}`);
  }

  revokeShare(permissionId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/revoke/${permissionId}`);
  }
}
