import { Component, inject, signal } from "@angular/core";
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { NgIcon } from "@ng-icons/core";
import { firstValueFrom } from "rxjs";
import { Api } from "../api";
import { Session, errorMessage } from "../core/session";
import { ZardButtonComponent, ZardAlertComponent } from "../shared/ui";
@Component({
  selector: "app-shell",
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    NgIcon,
    ZardButtonComponent,
    ZardAlertComponent,
  ],
  templateUrl: "./shell.html",
})
export class Shell {
  session = inject(Session);
  private api = inject(Api);
  private router = inject(Router);
  busy = signal(false);
  error = signal("");
  links = [
    { path: "inicio", label: "Inicio", icon: "lucideLayoutDashboard" },
    {
      path: "inscripcion",
      label: "Inscribir materias",
      icon: "lucideListPlus",
    },
    { path: "mis-materias", label: "Mis materias", icon: "lucideBookOpen" },
    { path: "comunidad", label: "Comunidad", icon: "lucideUsers" },
    { path: "perfil", label: "Mi perfil", icon: "lucideUserRound" },
  ];
  async logout() {
    if (this.busy()) return;
    if (!(await this.router.navigateByUrl("/panel/inicio"))) return;
    this.busy.set(true);
    this.error.set("");
    try {
      await firstValueFrom(this.api.logout());
      this.session.clear();
      this.session.message.set("");
      await this.router.navigateByUrl("/login");
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
