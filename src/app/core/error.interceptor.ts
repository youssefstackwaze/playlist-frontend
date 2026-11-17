import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SILENT_ERRORS } from './api.service';
import { ApiError } from './models';
import { NotificationService } from './notification.service';

/** Shows every API error as a toast, using the backend's ErrorResponse message when available. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && !req.context.get(SILENT_ERRORS)) {
        notifications.error(describe(err));
      }
      return throwError(() => err);
    }),
  );
};

function describe(err: HttpErrorResponse): string {
  if (err.status === 0 || err.status === 504) {
    return 'Serveur injoignable (en local : Spring Boot démarré sur le port 8080 ? en ligne : le serveur gratuit se réveille, réessayez dans 30 s)';
  }
  const body = err.error as Partial<ApiError> | string | null;
  if (body && typeof body === 'object' && body.message) {
    return `${err.status} – ${body.message}`;
  }
  if (typeof body === 'string' && body.includes('"message"')) {
    try {
      return `${err.status} – ${(JSON.parse(body) as ApiError).message}`;
    } catch {
      /* fall through */
    }
  }
  return `${err.status} – ${err.statusText || 'Erreur inattendue'}`;
}
