import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NgIcon } from "@ng-icons/core";
import { firstValueFrom } from "rxjs";
import { Api, Student } from "../api";
import { Session, errorMessage } from "../core/session";
import {
  ZardButtonComponent,
  ZardInputDirective,
  ZardCardComponent,
  ZardBadgeComponent,
  ZardAlertComponent,
} from "../shared/ui";
@Component({
  selector: "app-community",
  imports: [
    FormsModule,
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ZardCardComponent,
    ZardBadgeComponent,
    ZardAlertComponent,
  ],
  template: `
    <div class="page-heading">
      <div>
        <p class="eyebrow">APRENDER EN COMPAÑÍA</p>
        <h1>Comunidad<span class="accent-dot">.</span></h1>
        <p class="muted">
          Conoce a quienes están construyendo su camino en Campus.
        </p>
      </div>
      <button z-button zType="outline" [zDisabled]="loading()" (click)="load()">
        Actualizar
      </button>
    </div>
    @if (error()) {
      <z-alert zType="destructive" [zDescription]="error()" />
    }
    <section z-card class="content-card">
      <div class="catalog-toolbar">
        <div>
          <h2>
            Directorio de estudiantes <span>{{ students().length }}</span>
          </h2>
          <p class="muted">
            Solo nombres y materias. Los datos de contacto son privados.
          </p>
        </div>
        <div class="search-input">
          <ng-icon name="lucideSearch" /><input
            z-input
            type="search"
            aria-label="Buscar estudiante"
            placeholder="Buscar por nombre…"
            [ngModel]="search()"
            (ngModelChange)="search.set($event)"
          />
        </div>
      </div>
      @if (loading()) {
        <div class="loading-state" role="status">Cargando la comunidad…</div>
      } @else if (!error()) {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Materias inscritas</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (student of filtered(); track student.id) {
                <tr>
                  <td>
                    <div class="student-cell">
                      <span class="avatar">{{ student.name.charAt(0) }}</span
                      ><strong>{{ student.name }}</strong>
                      @if (student.id === session.profile()?.id) {
                        <z-badge zType="outline">Tú</z-badge>
                      }
                    </div>
                  </td>
                  <td>
                    <div class="chips">
                      @for (course of student.courses; track course) {
                        <span>{{ course }}</span>
                      } @empty {
                        <span class="muted">Sin materias inscritas</span>
                      }
                    </div>
                  </td>
                  <td>
                    <z-badge
                      [zType]="student.courses.length ? 'secondary' : 'outline'"
                      >{{
                        student.courses.length ? "Matriculado" : "Pendiente"
                      }}</z-badge
                    >
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3">
                    <div class="empty-state">
                      <ng-icon name="lucideSearch" />
                      <h3>No encontramos estudiantes</h3>
                      <p>Prueba con otro nombre.</p>
                      <button z-button zType="outline" (click)="search.set('')">
                        Limpiar búsqueda
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class CommunityPage {
  session = inject(Session);
  private api = inject(Api);
  students = signal<Student[]>([]);
  search = signal("");
  loading = signal(true);
  error = signal("");
  filtered = computed(() =>
    this.students().filter((s) =>
      s.name.toLocaleLowerCase().includes(this.search().toLocaleLowerCase()),
    ),
  );
  constructor() {
    void this.load();
  }
  async load() {
    this.loading.set(true);
    this.error.set("");
    try {
      this.students.set(await firstValueFrom(this.api.students()));
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
