import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = 'http://localhost:5089/api/admin';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`,
      },
    });
  }

  activateUser(id: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/users/${id}/activate`,
      {},
      {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      }
    );
  }

  lockUser(id: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/users/${id}/lock`,
      {},
      {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      }
    );
  }
  updateStorageLimit(id: number, newLimit: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/users/${id}/storage`,
      { newLimit },
      {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      }
    );
  }

  resetUserPassword(id: number, newPassword: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/users/${id}/reset-password`,
      { newPassword },
      {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      }
    );
  }
}
