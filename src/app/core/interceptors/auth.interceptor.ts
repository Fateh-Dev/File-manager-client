import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    
    // Skip auth check for login/register endpoints
    if (req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register')) {
        return next(req);
    }

    if (typeof localStorage !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        
        // Check if token is valid before adding it
        if (token && authService.isTokenValid(token)) {
            const cloned = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
            return next(cloned).pipe(
                catchError((error: HttpErrorResponse) => {
                    // Handle 401 Unauthorized - token expired or invalid
                    if (error.status === 401) {
                        authService.logout();
                    }
                    return throwError(() => error);
                })
            );
        } else if (token) {
            // Token exists but is invalid/expired
            authService.logout();
        }
    }
    
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Handle 401 Unauthorized
            if (error.status === 401) {
                authService.logout();
            }
            return throwError(() => error);
        })
    );
};
