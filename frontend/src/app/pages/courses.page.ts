import { Component, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgIcon } from "@ng-icons/core";
import { firstValueFrom, forkJoin } from "rxjs";
import { Api, ClassGroup } from "../api";
import { Session, errorMessage } from "../core/session";
import {
  ZardButtonComponent,
  ZardCardComponent,
  ZardBadgeComponent,
  ZardAlertComponent,
} from "../shared/ui";
@Component({
  selector: "app-courses",
  imports: [
    RouterLink,
    NgIcon,
    ZardButtonComponent,
    ZardCardComponent,
    ZardBadgeComponent,
    ZardAlertComponent,
  ],
  template: `
    <div class="page-heading">
      <div>
        <p class="eyebrow">TU PLAN DE APRENDIZAJE</p>
        <h1>Mis materias<span class="accent-dot">.</span></h1>
        <p class="muted">
          Tu matrícula confirmada y las personas que te acompañan.
        </p>
      </div>
      <a z-button zType="outline" routerLink="/panel/inscripcion"
        >{{ groups().length ? "Modificar matrícula" : "Inscribir materias"
        }}<ng-icon name="lucideArrowUpRight"
      /></a>
    </div>
    @if (session.message()) {
      <z-alert
        class="success-alert"
        zRole="status"
        [zDescription]="session.message()"
      />
    }
    @if (error()) {
      <z-alert zType="destructive" [zDescription]="error()" /><button
        z-button
        zType="outline"
        (click)="load()"
      >
        Reintentar
      </button>
    }
    @if (loading()) {
      <div class="loading-state" role="status">Consultando tu matrícula…</div>
    } @else if (!error() && !groups().length) {
      <section z-card class="empty-state spacious">
        <span class="icon-tile"><ng-icon name="lucideBookOpen" /></span>
        <h2>Tu semestre está por comenzar.</h2>
        <p>
          Aún no has inscrito materias. Explora el catálogo,<br />elige tres y
          confirma tu selección.
        </p>
        <a z-button routerLink="/panel/inscripcion"
          >Elegir mis materias <ng-icon name="lucideArrowRight"
        /></a>
      </section>
    } @else if (!error()) {
      <div class="enrollment-confirmation">
        <span><ng-icon name="lucideCircleCheck" /> Matrícula confirmada</span
        ><span
          >{{ groups().length }} materias <span class="separator-dot">·</span>
          {{ session.profile()!.totalCredits }} créditos
          <span class="separator-dot">·</span> 3 profesores</span
        ><button z-button zType="ghost" zSize="sm" (click)="load()">
          Actualizar
        </button>
      </div>
      <div class="registered-grid">
        @for (group of groups(); track group.id) {
          <article z-card class="registered-card">
            <div class="course-top">
              <span class="subject-icon"><ng-icon name="lucideBookOpen" /></span
              ><z-badge zType="secondary">Inscrita</z-badge>
            </div>
            <h2>{{ group.name }}</h2>
            <p class="professor">
              <ng-icon name="lucideUserRound" /> {{ group.professorName }}
            </p>
            <div class="registered-meta">
              <span>{{ group.credits }} créditos</span
              ><span>{{ group.classmates.length }} compañero(s)</span>
            </div>
            <details class="classmates">
              <summary>
                <ng-icon name="lucideUsers" /> Ver compañeros <span>+</span>
              </summary>
              <p class="muted">Solo se muestran los nombres de tu grupo.</p>
              <ul>
                @for (student of group.classmates; track $index) {
                  <li>
                    <span class="avatar">{{ student.name.charAt(0) }}</span
                    >{{ student.name }}
                  </li>
                } @empty {
                  <li class="muted">
                    Aún no hay otros estudiantes inscritos en esta materia.
                  </li>
                }
              </ul>
            </details>
          </article>
        }
      </div>
    }
  `,
})
export class CoursesPage {
  session = inject(Session);
  private api = inject(Api);
  groups = signal<ClassGroup[]>([]);
  loading = signal(true);
  error = signal("");
  constructor() {
    void this.load();
  }
  async load() {
    this.loading.set(true);
    this.error.set("");
    try {
      const result = await firstValueFrom(
        forkJoin({ profile: this.api.me(), groups: this.api.classes() }),
      );
      this.session.accept(result.profile);
      this.groups.set(result.groups);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
