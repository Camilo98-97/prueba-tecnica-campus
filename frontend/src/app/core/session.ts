import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Api, Profile } from '../api';

@Injectable({ providedIn: 'root' })
export class Session {
  private api = inject(Api);
  profile = signal<Profile | null>(null);
  message = signal('');
  private initialized = false;
  private pending?: Promise<void>;
  async ensure(): Promise<void> {
    if (this.initialized) return;
    if (this.pending) return this.pending;
    this.pending = (async () => {
      try { this.accept(await firstValueFrom(this.api.me())); }
      catch (error) {
        if (error instanceof HttpErrorResponse && error.status === 401) this.clear();
        else this.message.set(errorMessage(error));
      } finally { this.pending = undefined; }
    })();
    return this.pending;
  }
  accept(profile: Profile) { this.profile.set(profile); this.initialized = true; }
  clear() { this.profile.set(null); this.initialized = true; }
}

export function errorMessage(error: unknown): string {
  const response = error as HttpErrorResponse;
  return response.error?.detail || (response.error?.errors ? Object.values(response.error.errors).flat().join(' ') :
    response.status === 0 || response.status >= 500 ? 'No pudimos conectar con el servicio. Intenta nuevamente en unos momentos.' :
      response.status === 401 ? 'Correo o contraseña incorrectos.' : 'No fue posible completar la solicitud. Revisa los datos e inténtalo de nuevo.');
}
