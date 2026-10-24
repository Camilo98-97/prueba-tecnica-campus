import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgIcon } from "@ng-icons/core";
import { Session } from "../core/session";
import {
  ZardButtonComponent,
  ZardCardComponent,
  ZardBadgeComponent,
  ZardProgressComponent,
} from "../shared/ui";
@Component({
  selector: "app-dashboard",
  imports: [
    RouterLink,
    NgIcon,
    ZardButtonComponent,
    ZardCardComponent,
    ZardBadgeComponent,
    ZardProgressComponent,
  ],
  template: `
    <div class="page-heading">
      <div>
        <p class="eyebrow">TU ESPACIO, TUS POSIBILIDADES</p>
        <h1>
          Hola, {{ session.profile()!.name.split(" ")[0]
          }}<span class="accent-dot">.</span>
        </h1>
        <p class="muted">Un nuevo día para dar el siguiente paso.</p>
      </div>
      <z-badge zType="outline">Programa de créditos</z-badge>
    </div>
    <section class="welcome-banner">
      <div>
        <span class="banner-label">TU PRÓXIMO SEMESTRE</span>
        <h2>
          {{ enrolled ? "Ya tienes un nuevo camino." : "Diseña lo que viene." }}
        </h2>
        <p>
          {{
            enrolled
              ? "Tu matrícula está confirmada. Explora tus materias y conoce a quienes compartirán tus clases."
              : "Explora el catálogo y elige tres materias que despierten tu curiosidad. Tu siguiente capítulo empieza contigo."
          }}
        </p>
        <a
          z-button
          [routerLink]="enrolled ? '/panel/mis-materias' : '/panel/inscripcion'"
          class="banner-button"
          >{{ enrolled ? "Ver mis materias" : "Inscribir mis materias"
          }}<ng-icon name="lucideArrowRight"
        /></a>
      </div>
      <div class="banner-art" aria-hidden="true">
        <span class="orbit orbit-one"></span
        ><span class="orbit orbit-two"></span
        ><ng-icon name="lucideGraduationCap" /><span class="art-star">✳</span>
      </div>
    </section>
    <div class="stats-grid">
      <z-card class="stat"
        ><span><ng-icon name="lucideBookOpen" /> Materias inscritas</span
        ><strong
          >{{ session.profile()!.courses.length }}<small>/ 3</small></strong
        >
        <p>
          {{
            enrolled
              ? "Tu selección está guardada"
              : "Tu matrícula está pendiente"
          }}
        </p></z-card
      ><z-card class="stat"
        ><span><ng-icon name="lucideGraduationCap" /> Créditos académicos</span
        ><strong>{{ session.profile()!.totalCredits }}<small>/ 9</small></strong
        ><z-progress
          [value]="(session.profile()!.totalCredits / 9) * 100"
          aria-label="Créditos inscritos" /></z-card
      ><z-card class="stat"
        ><span><ng-icon name="lucideCircleCheck" /> Estado de matrícula</span
        ><strong class="status-value">{{
          enrolled ? "Confirmada" : "Por completar"
        }}</strong>
        <p>
          {{
            enrolled
              ? "Todo listo para aprender"
              : "Selecciona y confirma tus materias"
          }}
        </p></z-card
      >
    </div>
    <div class="dashboard-bottom">
      <section z-card class="content-card">
        <div class="section-heading">
          <div>
            <h2>Tu ruta en Campus</h2>
            <p class="muted">Todo lo que necesitas, paso a paso.</p>
          </div>
        </div>
        <ol class="steps-list">
          <li class="done">
            <span><ng-icon name="lucideCheck" /></span>
            <div>
              <strong>Crea tu cuenta</strong>
              <p>Tu perfil ya forma parte de Campus.</p>
            </div>
            <z-badge zType="secondary">Listo</z-badge>
          </li>
          <li [class.done]="enrolled">
            <span>{{ enrolled ? "✓" : "2" }}</span>
            <div>
              <strong>Construye tu matrícula</strong>
              <p>3 materias, 3 profesores y 9 créditos.</p>
            </div>
            <a routerLink="/panel/inscripcion" aria-label="Ir a inscripción"
              ><ng-icon name="lucideArrowUpRight"
            /></a>
          </li>
          <li [class.done]="enrolled">
            <span>3</span>
            <div>
              <strong>Conoce a tu grupo</strong>
              <p>Encuentra a tus compañeros en Mis materias.</p>
            </div>
            <a routerLink="/panel/mis-materias" aria-label="Ir a mis materias"
              ><ng-icon name="lucideArrowUpRight"
            /></a>
          </li>
        </ol>
      </section>
      <section z-card class="community-callout">
        <span class="icon-tile"><ng-icon name="lucideUsers" /></span>
        <h2>Aprender se disfruta<br />en comunidad.</h2>
        <p class="muted">
          Descubre quiénes forman parte de Campus y qué están aprendiendo.
        </p>
        <a z-button zType="outline" routerLink="/panel/comunidad"
          >Explorar comunidad <ng-icon name="lucideArrowRight"
        /></a>
      </section>
    </div>
  `,
})
export class DashboardPage {
  session = inject(Session);
  get enrolled() {
    return this.session.profile()!.courses.length === 3;
  }
}
