import { inject } from "@angular/core";
import {
  CanActivateFn,
  CanDeactivateFn,
  Router,
  Routes,
} from "@angular/router";
import { Session } from "./core/session";
const authenticated: CanActivateFn = async () => {
  const session = inject(Session);
  const router = inject(Router);
  await session.ensure();
  return session.profile() ? true : router.parseUrl("/login");
};
const guest: CanActivateFn = async () => {
  const session = inject(Session);
  const router = inject(Router);
  await session.ensure();
  return session.profile() ? router.parseUrl("/panel/inicio") : true;
};
const unsaved: CanDeactivateFn<{ canLeave(): boolean }> = (component) =>
  component.canLeave();
export const routes: Routes = [
  {
    path: "login",
    title: "Iniciar sesión · Campus",
    canActivate: [guest],
    loadComponent: () =>
      import("./pages/auth/auth.page").then((m) => m.AuthPage),
    data: { register: false },
  },
  {
    path: "registro",
    title: "Crear cuenta · Campus",
    canActivate: [guest],
    loadComponent: () =>
      import("./pages/auth/auth.page").then((m) => m.AuthPage),
    data: { register: true },
  },
  {
    path: "panel",
    canActivate: [authenticated],
    canActivateChild: [authenticated],
    loadComponent: () => import("./layout/shell").then((m) => m.Shell),
    children: [
      {
        path: "inicio",
        title: "Inicio · Campus",
        loadComponent: () =>
          import("./pages/dashboard.page").then((m) => m.DashboardPage),
      },
      {
        path: "inscripcion",
        title: "Inscribir materias · Campus",
        canDeactivate: [unsaved],
        loadComponent: () =>
          import("./pages/enrollment/enrollment.page").then(
            (m) => m.EnrollmentPage,
          ),
      },
      {
        path: "mis-materias",
        title: "Mis materias · Campus",
        loadComponent: () =>
          import("./pages/courses.page").then((m) => m.CoursesPage),
      },
      {
        path: "comunidad",
        title: "Comunidad · Campus",
        loadComponent: () =>
          import("./pages/community.page").then((m) => m.CommunityPage),
      },
      {
        path: "perfil",
        title: "Mi perfil · Campus",
        canDeactivate: [unsaved],
        loadComponent: () =>
          import("./pages/profile.page").then((m) => m.ProfilePage),
      },
      { path: "", pathMatch: "full", redirectTo: "inicio" },
    ],
  },
  { path: "", pathMatch: "full", redirectTo: "panel/inicio" },
  {
    path: "**",
    loadComponent: () =>
      import("./pages/not-found.page").then((m) => m.NotFoundPage),
    title: "Página no encontrada · Campus",
  },
];
