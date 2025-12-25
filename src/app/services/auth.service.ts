import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly AUTH_KEY = 'admin_auth';
    private readonly DEFAULT_USERNAME = 'admin';
    private readonly DEFAULT_PASSWORD = 'admin123';

    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    constructor(private storageService: StorageService) {
        this.checkAuthentication();
    }

    private checkAuthentication(): void {
        const authData = this.storageService.getItem<{ loggedIn: boolean; timestamp: number }>(this.AUTH_KEY);

        if (authData && authData.loggedIn) {
            // Check if session is less than 24 hours old
            const hoursSinceLogin = (Date.now() - authData.timestamp) / (1000 * 60 * 60);
            if (hoursSinceLogin < 24) {
                this.isAuthenticatedSubject.next(true);
            } else {
                this.logout();
            }
        }
    }

    login(username: string, password: string): boolean {
        if (username === this.DEFAULT_USERNAME && password === this.DEFAULT_PASSWORD) {
            const authData = {
                loggedIn: true,
                timestamp: Date.now()
            };
            this.storageService.setItem(this.AUTH_KEY, authData);
            this.isAuthenticatedSubject.next(true);
            return true;
        }
        return false;
    }

    logout(): void {
        this.storageService.removeItem(this.AUTH_KEY);
        this.isAuthenticatedSubject.next(false);
    }

    isLoggedIn(): boolean {
        return this.isAuthenticatedSubject.value;
    }
}
