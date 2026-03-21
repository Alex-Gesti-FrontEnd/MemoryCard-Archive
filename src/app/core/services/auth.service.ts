import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private api = 'http://localhost:3000/api/auth';

  token = signal<string | null>(localStorage.getItem('token'));
  userEmail = signal<string | null>(null);

  async login(email: string, password: string) {
    const response: any = await firstValueFrom(
      this.http.post(`${this.api}/login`, { email, password }),
    );

    localStorage.setItem('token', response.token);
    this.token.set(response.token);

    this.userEmail.set(email);

    return response;
  }

  async register(email: string, password: string) {
    const response: any = await firstValueFrom(
      this.http.post(`${this.api}/register`, { email, password }),
    );

    return response;
  }

  logout() {
    localStorage.removeItem('token');
    this.token.set(null);
  }

  isLoggedIn() {
    return !!this.token();
  }

  getUserName() {
    if (!this.userEmail()) return '';
    return this.userEmail()!.split('@')[0];
  }
}
