import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    username: string = '';
    password: string = '';
    errorMessage: string = '';
    showPassword: boolean = false;

    constructor(
        private authService: AuthService,
        private router: Router
    ) {
        // Redirect if already logged in
        if (this.authService.isLoggedIn()) {
            this.router.navigate(['/admin']);
        }
    }

    login(): void {
        this.errorMessage = '';

        if (!this.username || !this.password) {
            this.errorMessage = 'Please enter both username and password';
            return;
        }

        const success = this.authService.login(this.username, this.password);

        if (success) {
            this.router.navigate(['/admin']);
        } else {
            this.errorMessage = 'Invalid username or password';
            this.password = '';
        }
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }
}
