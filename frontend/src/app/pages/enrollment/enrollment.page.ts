import {
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { NgIcon } from "@ng-icons/core";
import { firstValueFrom, forkJoin } from "rxjs";
import { Api, Course } from "../../api";
import { Session, errorMessage } from "../../core/session";
import {
  ZardButtonComponent,
  ZardInputDirective,
  ZardCardComponent,
  ZardBadgeComponent,
  ZardAlertComponent,
  ZardProgressComponent,
} from "../../shared/ui";
@Component({
  selector: "app-enrollment",
  imports: [
    FormsModule,
    RouterLink,
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ZardCardComponent,
    ZardBadgeComponent,
    ZardAlertComponent,
    ZardProgressComponent,
  ],
  templateUrl: "./enrollment.page.html",
})
export class EnrollmentPage {
  session = inject(Session);
  private api = inject(Api);
  private router = inject(Router);
  courses = signal<Course[]>([]);
  selected = signal<number[]>([]);
  saved = signal<number[]>([]);
  search = signal("");
  busy = signal(false);
  loading = signal(true);
  error = signal("");
  selectedCourses = computed(() =>
    this.courses().filter((c) => this.selected().includes(c.id)),
  );
  filtered = computed(() =>
    this.courses().filter((c) =>
      (c.name + " " + c.professorName)
        .toLocaleLowerCase()
        .includes(this.search().toLocaleLowerCase()),
    ),
  );
  dirty = computed(
    () =>
      [...this.selected()].sort().join() !== [...this.saved()].sort().join(),
  );
  valid = computed(
    () =>
      this.selectedCourses().length === 3 &&
      new Set(this.selectedCourses().map((c) => c.professorId)).size === 3,
  );
  constructor() {
    void this.load();
  }
  async load() {
    this.loading.set(true);
    this.error.set("");
    try {
      const { courses, profile } = await firstValueFrom(
        forkJoin({ courses: this.api.courses(), profile: this.api.me() }),
      );
      this.courses.set(courses);
      this.session.accept(profile);
      this.saved.set(profile.courses.map((c) => c.id));
      this.selected.set([...this.saved()]);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
  reason(course: Course): string {
    if (this.selected().includes(course.id)) return "";
    if (
      this.selectedCourses().some((c) => c.professorId === course.professorId)
    )
      return "Ya elegiste una materia de este profesor";
    return this.selected().length >= 3
      ? "Ya seleccionaste tus tres materias"
      : "";
  }
  toggle(course: Course) {
    if (this.busy() || this.reason(course)) return;
    this.selected.update((ids) =>
      ids.includes(course.id)
        ? ids.filter((id) => id !== course.id)
        : [...ids, course.id],
    );
  }
  remove(id: number) {
    if (!this.busy())
      this.selected.update((ids) => ids.filter((value) => value !== id));
  }
  reset() {
    this.selected.set([...this.saved()]);
    this.error.set("");
  }
  async save() {
    if (!this.valid() || this.busy() || !this.dirty()) return;
    this.busy.set(true);
    this.error.set("");
    try {
      const profile = await firstValueFrom(this.api.enroll(this.selected()));
      this.session.accept(profile);
      this.saved.set(profile.courses.map((c) => c.id));
      this.session.message.set(
        "Tu matrícula se guardó correctamente. ¡Todo listo para aprender!",
      );
      this.busy.set(false);
      await this.router.navigateByUrl("/panel/mis-materias");
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
  canLeave(): boolean {
    return (
      !this.session.profile() ||
      (!this.busy() &&
        (!this.dirty() ||
          window.confirm(
            "Tienes materias seleccionadas sin guardar. ¿Quieres salir y descartar los cambios?",
          )))
    );
  }
  @HostListener("window:beforeunload", ["$event"])
  beforeUnload(event: BeforeUnloadEvent) {
    if (this.dirty() || this.busy()) event.preventDefault();
  }
}
