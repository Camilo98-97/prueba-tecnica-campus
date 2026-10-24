import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { NgIcon } from "@ng-icons/core";
import { firstValueFrom } from "rxjs";
import { Api } from "../../api";
import { Session, errorMessage } from "../../core/session";
import {
  ZardButtonComponent,
  ZardInputDirective,
  ZardAlertComponent,
} from "../../shared/ui";
@Component({
  selector: "app-auth",
  imports: [
    FormsModule,
    RouterLink,
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ZardAlertComponent,
  ],
  templateUrl: "./auth.page.html",
})
export class AuthPage {
  session = inject(Session);
  private api = inject(Api);
  private router = inject(Router);
  register = !!inject(ActivatedRoute).snapshot.data["register"];
  name = "";
  email = "";
  password = "";
  confirmation = "";
  showPassword = signal(false);
  busy = signal(false);
  error = signal("");
  async submit() {
    if (this.busy()) return;
    if (this.register && this.password !== this.confirmation) {
      this.error.set("Las contraseñas no coinciden.");
      return;
    }
    this.busy.set(true);
    this.error.set("");
    this.session.message.set("");
    try {
      const profile = await firstValueFrom(
        this.register
          ? this.api.register({
              name: this.name.trim(),
              email: this.email.trim(),
              password: this.password,
            })
          : this.api.login(this.email.trim(), this.password),
      );
      this.session.accept(profile);
      this.password = "";
      this.confirmation = "";
      if (this.register)
        this.session.message.set(
          "¡Tu cuenta está lista! Ahora elige tus tres materias.",
        );
      await this.router.navigateByUrl(
        this.register ? "/panel/inscripcion" : "/panel/inicio",
      );
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
