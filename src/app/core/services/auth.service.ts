import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private api = 'https://memorycard-archive.onrender.com/api/auth';

  token = signal<string | null>(localStorage.getItem('token'));
  userEmail = signal<string | null>(localStorage.getItem('email'));

  userName = computed(() => {
    const email = this.userEmail();
    return email ? email.split('@')[0] : null;
  });

  isLoggedIn = computed(() => !!this.token());

  async login(email: string, password: string) {
    const response: any = await firstValueFrom(
      this.http.post(`${this.api}/login`, { email, password }),
    );

    localStorage.setItem('token', response.token);
    localStorage.setItem('email', email);

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
    localStorage.removeItem('email');
    this.token.set(null);
    this.userEmail.set(null);
  }
}
