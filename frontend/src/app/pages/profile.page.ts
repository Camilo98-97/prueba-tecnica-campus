import {
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { NgIcon } from "@ng-icons/core";
import { firstValueFrom } from "rxjs";
import { Api } from "../api";
import { Session, errorMessage } from "../core/session";
import {
  ZardButtonComponent,
  ZardInputDirective,
  ZardCardComponent,
  ZardAlertComponent,
} from "../shared/ui";
@Component({
  selector: "app-profile",
  imports: [
    FormsModule,
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ZardCardComponent,
    ZardAlertComponent,
  ],
  template: `
    <div class="page-heading">
      <div>
        <p class="eyebrow">TU CUENTA EN CAMPUS</p>
        <h1>Mi perfil<span class="accent-dot">.</span></h1>
        <p class="muted">Mantén tu información actualizada.</p>
      </div>
    </div>
    @if (error()) {
      <z-alert zType="destructive" [zDescription]="error()" />
    }
    @if (notice()) {
      <z-alert class="success-alert" zRole="status" [zDescription]="notice()" />
    }
    <div class="profile-layout">
      <section z-card class="content-card">
        <div class="section-heading">
          <div>
            <h2>Información personal</h2>
            <p class="muted">Cambiar tus datos no modifica tu matrícula.</p>
          </div>
          <span class="avatar large">{{
            session.profile()?.name?.charAt(0)
          }}</span>
        </div>
        <form #form="ngForm" (ngSubmit)="save()" class="stack-form">
          <label for="profile-name">Nombre completo</label
          ><input
            z-input
            id="profile-name"
            name="name"
            [(ngModel)]="name"
            #nameField="ngModel"
            required
            minlength="2"
            maxlength="100"
            autocomplete="name"
            [disabled]="busy()"
          />
          @if (nameField.touched && nameField.invalid) {
            <small class="field-error">Escribe al menos dos caracteres.</small>
          }
          <label for="profile-email">Correo electrónico</label
          ><input
            z-input
            id="profile-email"
            name="email"
            [(ngModel)]="email"
            #emailField="ngModel"
            type="email"
            required
            email
            maxlength="254"
            autocomplete="email"
            [disabled]="busy()"
          />
          @if (emailField.touched && emailField.invalid) {
            <small class="field-error">Escribe un correo válido.</small>
          }
          <p class="muted">
            Usarás este correo para iniciar sesión. No se muestra a otros
            estudiantes.
          </p>
          <div class="form-actions">
            <button
              z-button
              type="submit"
              [zLoading]="busy()"
              [zDisabled]="
                busy() || !!form.invalid || !dirty() || name.trim().length < 2
              "
            >
              Guardar perfil</button
            ><button
              z-button
              type="button"
              zType="ghost"
              [zDisabled]="busy() || !dirty()"
              (click)="reset()"
            >
              Descartar cambios
            </button>
          </div>
        </form>
      </section>
      <aside class="tip-card">
        <ng-icon name="lucideShieldCheck" />
        <div>
          <h3>Tu privacidad importa.</h3>
          <p>
            La comunidad puede consultar tu nombre y tus materias. Tu correo y
            tus datos de acceso son privados.
          </p>
        </div>
      </aside>
    </div>
    <section class="danger-zone">
      <div>
        <h2>Eliminar mi cuenta</h2>
        <p>
          Se eliminarán tu perfil y todas tus inscripciones. Esta acción no se
          puede deshacer.
        </p>
      </div>
      <button
        z-button
        zType="outline"
        class="danger-text"
        [zDisabled]="busy()"
        (click)="openDelete()"
      >
        Eliminar cuenta
      </button>
    </section>
    <dialog
      #deleteDialog
      class="confirm-dialog"
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      (cancel)="onCancel($event)"
    >
      <span class="icon-tile danger-text"
        ><ng-icon name="lucideUserRound"
      /></span>
      <h2 id="delete-title">¿Eliminar tu cuenta?</h2>
      <p id="delete-description">
        Se borrarán tu perfil y todas tus materias inscritas. No podrás
        recuperar esta información.
      </p>
      @if (error()) {
        <z-alert zType="destructive" [zDescription]="error()" />
      }
      <div class="form-actions">
        <button
          z-button
          zType="outline"
          autofocus
          [zDisabled]="busy()"
          (click)="closeDelete()"
        >
          Conservar mi cuenta</button
        ><button
          z-button
          zType="destructive"
          [zLoading]="busy()"
          [zDisabled]="busy()"
          (click)="remove()"
        >
          Sí, eliminar cuenta
        </button>
      </div>
    </dialog>
  `,
})
export class ProfilePage {
  session = inject(Session);
  private api = inject(Api);
  private router = inject(Router);
  name = this.session.profile()!.name;
  email = this.session.profile()!.email;
  busy = signal(false);
  error = signal("");
  notice = signal("");
  dialog = viewChild<ElementRef<HTMLDialogElement>>("deleteDialog");
  dirty() {
    return (
      this.name !== this.session.profile()?.name ||
      this.email !== this.session.profile()?.email
    );
  }
  reset() {
    this.name = this.session.profile()!.name;
    this.email = this.session.profile()!.email;
    this.notice.set("");
  }
  async save() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set("");
    this.notice.set("");
    try {
      const profile = await firstValueFrom(
        this.api.update({ name: this.name.trim(), email: this.email.trim() }),
      );
      this.session.accept(profile);
      this.reset();
      this.notice.set("Tu perfil se actualizó correctamente.");
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
  openDelete() {
    this.error.set("");
    this.dialog()?.nativeElement.showModal();
  }
  closeDelete() {
    this.dialog()?.nativeElement.close();
  }
  onCancel(event: Event) {
    if (this.busy()) event.preventDefault();
  }
  async remove() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set("");
    try {
      await firstValueFrom(this.api.remove());
      this.closeDelete();
      this.session.clear();
      this.session.message.set("Tu cuenta se eliminó correctamente.");
      await this.router.navigateByUrl("/login");
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
  canLeave() {
    return (
      !this.session.profile() ||
      (!this.busy() &&
        (!this.dirty() ||
          window.confirm(
            "Tienes cambios de perfil sin guardar. ¿Quieres descartarlos?",
          )))
    );
  }
  @HostListener("window:beforeunload", ["$event"])
  beforeUnload(event: BeforeUnloadEvent) {
    if (this.dirty() || this.busy()) event.preventDefault();
  }
}
