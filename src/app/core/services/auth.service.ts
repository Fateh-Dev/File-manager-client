import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = '/api/auth';
  private tokenKey = 'auth_token';
  private currentUserSubject = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {
    // Check if running in browser
    if (typeof localStorage !== 'undefined') {
      const token = this.getToken();
      if (token && this.isTokenValid(token)) {
        this.currentUserSubject.next({ token });
      } else if (token) {
        // Token exists but is expired, remove it
        this.logout();
      }
    }
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data).pipe(
      tap((response: any) => {
        if (response.token) {
          this.setToken(response.token);
          this.currentUserSubject.next({ token: response.token });
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('pdf_template_draft');
    localStorage.removeItem('last_shared_count'); // Also clear other app-specific state
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    return this.isTokenValid(token);
  }

  private getPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      return JSON.parse(atob(base64));
    } catch (e) {
      return null;
    }
  }

  isAdmin(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const payload = this.getPayload(token);
    if (!payload) return false;

    // Check for role claim. Microsoft identity often uses a long URL for role
    const role =
      payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return role === 'Admin';
  }

  getUsername(): string | null {
    const token = this.getToken();
    if (!token) return null;

    const payload = this.getPayload(token);
    if (!payload) return null;

    return (
      payload.unique_name ||
      payload.name ||
      payload.sub ||
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
      null
    );
  }

  isTokenValid(token: string): boolean {
    try {
      const payload = this.getPayload(token);
      if (!payload) return false;

      // Check expiration
      if (payload.exp) {
        const expirationDate = new Date(payload.exp * 1000);
        const now = new Date();

        // Add 5 second buffer to account for clock skew
        if (expirationDate.getTime() <= now.getTime() + 5000) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  checkAuthAndRedirect(): void {
    if (!this.isAuthenticated()) {
      this.logout();
    }
  }

  get currentUser$() {
    return this.currentUserSubject.asObservable();
  }
  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, { currentPassword, newPassword });
  }
}
