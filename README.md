# Campus · Registro de estudiantes

Aplicación de la prueba técnica: **Angular 21 + API REST ASP.NET Core 10 + MySQL 8.0**.

## Carpetas

```text
frontend/                 Angular standalone, Router, Tailwind CSS y componentes ZardUI
backend/
  Students.Api/           API REST, autenticación, modelo EF Core y reglas
  Students.Tests/         Pruebas de integración con SQLite en memoria
  database/schema.sql     Script MySQL con esquema y catálogo inicial
  Campus.slnx             Solución .NET
docs/                     Informe técnico y guía de validación
```

## Base de datos

**MySQL 8.0.16 o posterior**, utilizando el proveedor oficial `MySql.EntityFrameworkCore` para .NET 10. MySQL almacena los datos y Workbench permite administrar el servidor y ejecutar el script. Se utilizan claves foráneas, transacciones, restricciones e índices únicos. SQLite se utiliza únicamente en las pruebas, no como base de datos de entrega.

## Requisitos

- Node.js 24 (>=24.0) y npm; Angular 21 es compatible con este equipo.
- SDK .NET 10.
- MySQL Server 8.0.16 o posterior; MySQL Workbench es opcional.

En este equipo se descargó un SDK local en `.dotnet/`. Si `dotnet` no está en PATH, desde la raíz puedes usar `& .\.dotnet\dotnet.exe` en su lugar. Esa carpeta no forma parte del código entregable.

## Ejecutar

### 1. Base de datos

En este equipo se detectó **MySQL Server 8.0.46**, servicio `MySQL80`, activo en `localhost:3306`. Abre tu conexión local de Workbench con el usuario y la contraseña configurados durante la instalación.

La API en entorno Development crea una base **nueva** llamada `CampusStudents`, sus tablas y el catálogo de 10 materias y 5 profesores. No crea estudiantes ficticios. `EnsureCreated` solo sirve para inicializar: no actualiza esquemas existentes.

Alternativamente, en Workbench selecciona **File > Open SQL Script**, abre `backend/database/schema.sql` y ejecuta el script completo. Crea la base si no existe; las tablas se ejecutan una sola vez sobre una base vacía. Si ya ejecutaste el script, la API reutiliza el esquema. Actualiza el panel Schemas para ver `CampusStudents`.

Para iniciar con otro usuario, host o puerto, usa los parámetros del lanzador:

```powershell
.\tools\start-backend.ps1 -Server localhost -Port 3306 -User root
```

El lanzador solicita la contraseña de forma oculta y configura `ConnectionStrings__School` únicamente para el proceso; no la escribe en archivos ni la imprime. No envíes la contraseña por el chat. En producción configura esa variable mediante gestión de secretos, un usuario dedicado y TLS con validación de certificado (`SslMode=VerifyFull`). El usuario de desarrollo debe poder crear la base y sus tablas, o estas deben estar creadas previamente por un administrador.

### 2. Backend (primera terminal, desde la raíz)

```powershell
.\tools\start-backend.ps1
```

Si PowerShell bloquea la ejecución de scripts, usa esta alternativa temporal, que no cambia la política del sistema:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\start-backend.ps1
```

El comando usa automáticamente el SDK local `.dotnet/` si existe; de lo contrario utiliza `dotnet` del PATH. Por defecto conecta como `root` en `localhost:3306`. Introduce la misma contraseña de tu conexión de Workbench. API: http://localhost:5080. Documento OpenAPI, en Development: http://localhost:5080/openapi/v1.json. `/health` comprueba que el proceso responde; no comprueba la conexión MySQL.

### 3. Frontend (segunda terminal)

```powershell
cd frontend
npm ci
npm start
```

Abre http://localhost:4200. El proxy de Angular dirige `/api` al puerto 5080; las cookies quedan en el mismo origen. El flujo es: crear una cuenta o iniciar sesión, inscribir tres materias y consultar la matrícula guardada en **Mis materias**. Para ver compañeros, registra otra cuenta con alguna materia compartida.

Las vistas principales tienen rutas independientes:

| Ruta | Vista |
|---|---|
| `/login` | Inicio de sesión |
| `/registro` | Creación de cuenta |
| `/panel/inicio` | Estado y próximos pasos |
| `/panel/inscripcion` | Selección y confirmación de materias |
| `/panel/mis-materias` | Matrícula guardada y compañeros por clase |
| `/panel/comunidad` | Directorio de estudiantes |
| `/panel/perfil` | Datos personales y eliminación de cuenta |

La interfaz utiliza componentes incorporados mediante el CLI oficial de ZardUI. El código queda dentro de `frontend/src/app/shared/`, por lo que puede personalizarse junto con el resto del proyecto. ZardUI se distribuye bajo licencia MIT; la copia de la licencia está en `frontend/LICENSE_ZARDUI.md`.

## Pruebas y compilación

```powershell
dotnet test backend/Campus.slnx
dotnet build backend/Campus.slnx --configuration Release
cd frontend
npm run build
```

Las pruebas arrancan la API real con `WebApplicationFactory`, base SQLite relacional en memoria y cookies. Comprueban la creación de una cuenta sin matrícula, la inscripción posterior, reglas, consultas, transacciones, autenticación y privacidad. No sustituyen una prueba con MySQL.

`tools/check-ui.cjs` contiene una prueba adicional de navegador con respuestas API simuladas. Requiere Playwright accesible desde Node.js y Microsoft Edge instalado, además del frontend en el puerto 4200. Revisa rutas protegidas, registro, estado sin matrícula, reglas de selección, reintentos, persistencia al recargar, compañeros, búsqueda, perfil, cierre y vencimiento de sesión y ancho móvil. Sus capturas están en `docs/screenshots/` y usan datos ficticios.

Para regenerar el script desde el modelo EF Core, desde la raíz (sin conectarse al servidor SQL):

```powershell
dotnet run --project backend/Students.Api -- --script "$PWD\backend\database\schema.sql"
```

## API REST

Todas las operaciones que modifican datos requieren `X-Campus-Request: 1`. Las rutas protegidas requieren la cookie `campus.session` que se obtiene al registrar o iniciar sesión.

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/courses` | Catálogo público |
| POST | `/api/auth/register` | Crear estudiante y sesión |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/students/me` | Consultar mi registro |
| PUT | `/api/students/me` | Actualizar nombre y correo |
| PUT | `/api/students/me/enrollment` | Crear o reemplazar mi matrícula |
| DELETE | `/api/students/me` | Eliminar mi cuenta y sus inscripciones |
| GET | `/api/students` | Registros públicos: nombre y materias |
| GET | `/api/students/me/classes` | Mis clases y nombres de compañeros |

Registro de ejemplo:

```json
{
  "name": "Ana Pérez",
  "email": "ana@example.com",
  "password": "UnaClaveSegura123!"
}
```

Después del registro, la matrícula se confirma con:

```json
{
  "courseIds": [1, 3, 5]
}
```

Una actualización de perfil usa `name` y `email`; el login usa `email` y `password`.

## Decisiones de alcance

- “Solo podrá seleccionar 3 materias” se interpreta como **exactamente tres**, con **9 créditos** al confirmar. La interfaz permite selección parcial mientras se edita, pero no guardarla.
- El programa es único; sus diez materias y cinco profesores son un catálogo fijo.
- Cada estudiante administra su propio registro. Puede consultar los demás registros, pero no modificarlos ni ver sus correos.
- Los compañeros se calculan a partir de las matrículas guardadas, excluyendo al estudiante que consulta. Cada compañero contiene únicamente `name`.
- Contraseñas con hash de ASP.NET Core Identity. Cookie HttpOnly, SameSite Strict y Secure fuera de Development. Cabecera obligatoria y ausencia de CORS para rechazar mutaciones desde otro origen.
- Registro e inscripción son pasos independientes. La cuenta puede existir sin matrícula y el perfil se puede editar sin alterar materias. La inscripción completa se guarda en una transacción serializable. Un índice único `(StudentId, ProfessorId)` refuerza la regla de profesores en la base de datos.
- La cantidad de tres materias se valida en la API; escrituras SQL manuales pueden omitir esa regla. Toda modificación de matrícula debe pasar por la API.
- Sin recuperación de contraseñas, verificación de correo, administración de catálogo ni despliegue público, pues no se solicitan en la prueba.

## Despliegue

Publica el backend con `dotnet publish`, y los archivos de `frontend/dist/campus/browser` con un servidor web. Sirve frontend y `/api` bajo el mismo origen con HTTPS, un proxy inverso, `AllowedHosts` configurado y claves de Data Protection persistentes. Inicializa la base con el script; `Database:Initialize` está desactivado fuera de Development. Para evolución del esquema, agrega migraciones EF Core; el script inicial y `EnsureCreated` no son un sistema de migraciones.
