# Informe técnico — Registro de estudiantes

## Objetivo

Construir una aplicación web que permita registrar estudiantes en un programa de créditos, administrar su matrícula y conocer los compañeros de sus clases.

## Arquitectura

El frontend Angular usa rutas protegidas y componentes ZardUI con Tailwind CSS. Separa registro e ingreso, inicio del estudiante, inscripción, matrícula guardada, comunidad y perfil. La matrícula guardada muestra los compañeros dentro de cada materia. Consume la API REST por HTTP mediante un servicio tipado.

ASP.NET Core implementa los endpoints, validaciones y autenticación por cookies. Entity Framework Core consulta MySQL y guarda estudiantes e inscripciones. El frontend no decide por sí solo la validez de una matrícula: la API vuelve a comprobar todas las reglas.

## Modelo de datos

| Entidad | Campos principales | Relaciones / restricciones |
|---|---|---|
| Students | Id, Name, Email, PasswordHash | Correo único normalizado |
| Professors | Id, Name | Cinco registros iniciales |
| Courses | Id, Name, Credits, ProfessorId | Diez registros; tres créditos; dos materias por profesor |
| Enrollments | StudentId, CourseId, ProfessorId | PK estudiante/materia; índice único estudiante/profesor; FK compuesta al catálogo |

La clave foránea compuesta garantiza que el profesor de una inscripción sea realmente el profesor de la materia. La eliminación de un estudiante elimina sus inscripciones mediante cascada. El catálogo no expone operaciones de modificación.

## Correspondencia con los requisitos

| Requisito | Implementación |
|---|---|
| CRUD y registro en línea | Cuenta independiente, consulta, actualización y eliminación del perfil propio |
| Programa de créditos | Selección y resumen de nueve créditos por matrícula |
| Diez materias | Catálogo inicial en modelo EF y script SQL |
| Tres créditos por materia | Restricción SQL y catálogo |
| Seleccionar tres materias | Validación de tres identificadores diferentes y existentes |
| Cinco profesores, dos materias cada uno | Datos iniciales del catálogo |
| No repetir profesor | Validación API, bloqueo visual e índice SQL único |
| Consultar registros de otros estudiantes | Directorio autenticado con nombres y materias |
| Solo nombres de compañeros por clase | Consulta filtrada por materias propias y DTO sin otros datos personales |

## Seguridad y manejo de errores

La contraseña no se almacena en texto plano. Las operaciones privadas derivan el estudiante de su sesión, sin aceptar un identificador de otro estudiante para editar o eliminar. Las respuestas de error utilizan Problem Details y códigos HTTP 400, 401, 403, 404 y 409 según corresponda. La interfaz muestra errores, estados de carga, confirmación de eliminación y avisos de éxito.

Las mutaciones requieren una cabecera que el navegador no puede enviar desde otro origen sin preflight CORS; la API no habilita CORS. Las cookies son HttpOnly y SameSite Strict. Producción debe usar HTTPS, gestión de secretos y claves persistentes. Un producto público además necesitaría límites de intentos de ingreso, recuperación de cuentas y verificación de correo.

## Casos de aceptación manual

1. Crear la cuenta de Ana: debe iniciar sesión con cero materias y cero créditos.
2. Abrir Mis materias: debe aparecer el estado vacío con acceso al catálogo.
3. Seleccionar Matemáticas: Estadística debe quedar bloqueada por compartir profesor.
4. Seleccionar Matemáticas, Programación y Física y confirmar: debe quedar con nueve créditos.
5. Intentar enviar `[1,2,3]` directamente a la API: debe responder 400 y conservar la matrícula anterior.
6. Cerrar sesión y crear a Luis; después inscribir Matemáticas, Bases de datos y Electrónica.
7. Volver a ingresar como Ana: en Matemáticas debe aparecer solamente el nombre de Luis.
8. Abrir Comunidad: deben verse nombres y materias, sin correos.
9. Editar nombre y correo de Ana: debe conservar las tres materias tras recargar.
10. Eliminar la cuenta con confirmación: debe cerrarse la sesión y desaparecer el registro y sus inscripciones.
11. Acceder a una ruta del panel sin sesión: debe redirigir al login y la API debe responder 401.

## Resultados de validación (24 de octubre de 2026)

- Backend compilado en Release; 11 casos de integración aprobados, 0 fallos.
- Frontend compilado para producción con carga diferida por vista; paquete inicial aproximado de 340 kB, transferencia estimada de 88 kB.
- Auditoría npm: 0 vulnerabilidades. Restauración NuGet sin alertas conocidas.
- Prueba de navegador Edge aprobada con respuestas API simuladas: rutas protegidas, cuenta sin matrícula, selección, bloqueo por profesor, reintento de guardado, nueve créditos, compañeros, persistencia al recargar, búsqueda, perfil independiente, inicio/cierre y vencimiento de sesión y ausencia de desbordamiento horizontal a 390 px.
- Capturas de escritorio y móvil revisadas en `docs/screenshots/`. Muestran cuentas ficticias; no prueban conexión con MySQL.
- Script SQL generado directamente del modelo compilado de EF Core. MySQL 8.0.46 está activo en localhost:3306. El script aún no se ejecutó con las credenciales del usuario. La persistencia relacional se validó con SQLite en memoria; queda pendiente la comprobación de extremo a extremo con MySQL real.

## Archivos entregables

El código está separado en `frontend/` y `backend/`. `frontend/src/app/shared/` contiene los componentes ZardUI incorporados al código del proyecto. `backend/database/schema.sql` contiene el esquema y catálogo MySQL. `README.md` documenta requisitos, ejecución, API y límites del alcance. Este informe resume el diseño y la validación; no se han enviado archivos a terceros ni desplegado un sitio público.
