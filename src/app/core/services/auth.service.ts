import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:5089/api/auth';
    private tokenKey = 'auth_token';
    private currentUserSubject = new BehaviorSubject<any>(null);

    constructor(private http: HttpClient) {
        // Check if running in browser
        if (typeof localStorage !== 'undefined') {
            const token = this.getToken();
            if (token) {
                this.currentUserSubject.next({ token });
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
        this.currentUserSubject.next(null);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    setToken(token: string) {
        localStorage.setItem(this.tokenKey, token);
    }

    get currentUser$() {
        return this.currentUserSubject.asObservable();
    }
}
