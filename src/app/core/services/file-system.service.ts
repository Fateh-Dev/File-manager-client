import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FileSystemService {
    private apiUrl = 'http://localhost:5089/api/filesystem';

    constructor(private http: HttpClient) { }

    getFolderContents(folderId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/folder/${folderId}`);
    }

    createFolder(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/folder`, data);
    }

    uploadFile(file: File, folderId: number): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderId', folderId.toString());
        return this.http.post(`${this.apiUrl}/upload`, formData);
    }

    downloadFile(fileId: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/download/${fileId}`, { responseType: 'blob' });
    }

    renameFolder(folderId: number, newName: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/folder/${folderId}/rename`, { name: newName });
    }

    deleteFolder(folderId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/folder/${folderId}`);
    }

    moveFolder(folderId: number, targetFolderId: number | null): Observable<any> {
        return this.http.put(`${this.apiUrl}/folder/${folderId}/move`, { targetFolderId });
    }

    moveFile(fileId: number, targetFolderId: number | null): Observable<any> {
        return this.http.put(`${this.apiUrl}/file/${fileId}/move`, { targetFolderId });
    }

    search(query: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/search?query=${encodeURIComponent(query)}`);
    }

    deleteFile(fileId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/file/${fileId}`);
    }

    getRecycleBin(): Observable<any> {
        return this.http.get(`${this.apiUrl}/recycle-bin`);
    }

    restoreFolder(folderId: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/folder/${folderId}/restore`, {});
    }

    restoreFile(fileId: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/file/${fileId}/restore`, {});
    }

    purgeFolder(folderId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/folder/${folderId}/purge`);
    }

    purgeFile(fileId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/file/${fileId}/purge`);
    }

    getRecentFiles(): Observable<any> {
        return this.http.get(`${this.apiUrl}/recent`);
    }

    getDownloads(): Observable<any> {
        return this.http.get(`${this.apiUrl}/downloads`);
    }
}
