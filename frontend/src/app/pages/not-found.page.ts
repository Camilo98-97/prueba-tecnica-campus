import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ZardButtonComponent } from "../shared/ui";
@Component({
  selector: "app-not-found",
  imports: [RouterLink, ZardButtonComponent],
  template:
    '<main class="empty-state spacious not-found"><p class="eyebrow">404 · PÁGINA NO ENCONTRADA</p><h1>Este camino no existe.</h1><p>Vuelve a tu campus para continuar.</p><a z-button routerLink="/panel/inicio">Volver al inicio</a></main>',
})
export class NotFoundPage {}
