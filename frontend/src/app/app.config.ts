import { ApplicationConfig, inject } from "@angular/core";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideRouter, Router, withInMemoryScrolling } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { provideIcons } from "@ng-icons/core";
import {
  lucideGraduationCap,
  lucideLayoutDashboard,
  lucideBookOpen,
  lucideListPlus,
  lucideUsers,
  lucideUserRound,
  lucideLogOut,
  lucideArrowRight,
  lucideCheck,
  lucidePlus,
  lucideX,
  lucideSearch,
  lucideArrowUpRight,
  lucideShieldCheck,
  lucideMail,
  lucideEye,
  lucideEyeOff,
  lucideCircleCheck,
  lucideClock3,
} from "@ng-icons/lucide";
import { provideZard } from "@/shared/core/provider/providezard";
import { routes } from "./app.routes";
import { Session } from "./core/session";
export const appConfig: ApplicationConfig = {
  providers: [
    provideZard(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: "top" }),
    ),
    provideIcons({
      lucideGraduationCap,
      lucideLayoutDashboard,
      lucideBookOpen,
      lucideListPlus,
      lucideUsers,
      lucideUserRound,
      lucideLogOut,
      lucideArrowRight,
      lucideCheck,
      lucidePlus,
      lucideX,
      lucideSearch,
      lucideArrowUpRight,
      lucideShieldCheck,
      lucideMail,
      lucideEye,
      lucideEyeOff,
      lucideCircleCheck,
      lucideClock3,
    }),
    provideHttpClient(
      withInterceptors([
        (request, next) => {
          const session = inject(Session);
          const router = inject(Router);
          return next(
            request.clone({ setHeaders: { "X-Campus-Request": "1" } }),
          ).pipe(
            catchError((error) => {
              if (error.status === 401 && session.profile()) {
                session.clear();
                session.message.set("Tu sesión terminó. Ingresa nuevamente.");
                void router.navigateByUrl("/login");
              }
              return throwError(() => error);
            }),
          );
        },
      ]),
    ),
  ],
};
