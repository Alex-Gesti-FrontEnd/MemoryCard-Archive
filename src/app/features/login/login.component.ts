import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  loginEmail = '';
  loginPassword = '';

  registerEmail = '';
  registerPassword = '';

  async onLogin(event: Event) {
    event.preventDefault();

    try {
      await this.authService.login(this.loginEmail, this.loginPassword);

      this.router.navigate(['/']);
    } catch (error: any) {
      alert('Login failed');
    }
  }

  async onRegister(event: Event) {
    event.preventDefault();

    try {
      await this.authService.register(this.registerEmail, this.registerPassword);

      alert('User created! Now login.');
    } catch (error: any) {
      alert('Registration failed');
    }
  }
}
