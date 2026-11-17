# Diseño UI/UX, Mockups y Matriz de Trazabilidad Visual (`MOCKUPS.md`)

**Proyecto:** SyncPass – Sistema de Acreditación Digital para Vinculación Comunitaria  
**Prototipo Interactivo de Alta Fidelidad (Figma / HTML):** [`docs/mockups/syncpass-figma-mockups.html`](./mockups/syncpass-figma-mockups.html)  
**Tema Visual:** Identidad Institucional Duoc UC (Dark Mode `#0F172A`, Azul Primario `#38BDF8`, Verde Esmeralda `#10B981`, Ámbar Offline `#F59E0B`)  

---

## 1. Presentación de Todas las Vistas de la Aplicación Móvil

La aplicación **SyncPass Android** cuenta con **7 vistas y modales principales** construidos en **Jetpack Compose (Material 3)**, cada uno gobernado por su respectivo `ViewModel` y `UiState`:

### Vista 1: Inicio de Sesión y Autenticación Federada (`LoginScreen.kt` + `LoginViewModel.kt`)
* **Propósito:** Puerta de entrada segura con soporte para credenciales directas, OAuth2 / OIDC vía **AWS Cognito Hosted UI** (`:cognito-auth`) y acceso rápido por perfil para demostración en terreno.
* **Componentes UI:**
  * Tarjeta institucional (`AuthCard`) con validación reactiva de correo y contraseña (`usernameError`, `passwordError`).
  * Botón de inicio de sesión federado con AWS Cognito (`us-east-1_RlB8Ft9Z2`).
  * Selector directo de perfiles RBAC (`Docente / Coordinador`, `Estudiante Voluntario`, `Beneficiario Comunitario`, `Administrador General`) que enruta sin pasos duplicados hacia la vista operativa correspondiente.

### Vista 2: Hub de Sesión y Despacho RBAC (`HomeScreen.kt` + `HomeViewModel.kt`)
* **Propósito:** Decodificar el token JWT (`JwtDecoder`), mostrar los claims de sesión (`username`, `roles`, `iss`, `exp`) e iniciar el servicio de escucha de notificaciones Push (`NotificationService`).
* **Componentes UI:**
  * Tarjeta de identidad verificada con correo y rol activo.
  * Accesos directos a los módulos según permisos RBAC.

### Vista 3: Coordinación y Docencia – Mantenedor de Talleres (`DocenteScreen.kt` + `DocenteViewModel.kt`)
* **Propósito:** Permitir al docente gestionar talleres territoriales en tiempo real contra **Supabase PostgreSQL (`/api/talleres`)** y la base de datos local **Room (`AppDatabase`)**.
* **Componentes UI:**
  * Cabecera del mantenedor con botones **"+ Nuevo Taller"** y **"Actualizar API"**.
  * Lista reactiva (`LazyColumn`) de talleres con insignia de estado (`En curso`, `Activo`, `Finalizado`), barra de progreso de quórum (`LinearProgressIndicator`), contador de acreditados y acción **"Eliminar"**.
  * Generador dinámico de **Pase QR del Taller (`QrCodeView`)** para proyectar o imprimir en la sede vecinal.
  * Botón **"Exportar Acta de Asistencia a Dispositivo (CSV)"** que utiliza la API nativa de almacenamiento (`ActaStorageHelper`) para guardar el reporte en el teléfono.

### Vista 4: Modal de Creación de Taller (`AlertDialog` en `DocenteScreen.kt`)
* **Propósito:** Formulario controlado por `DocenteUiState` para registrar un nuevo taller comunitario.
* **Campos:** Nombre del taller, Sede o recinto vecinal, Fecha y horario, Cupos máximos.

### Vista 5: Acreditación en Terreno – Modo Operativo Offline-First (`VoluntarioScreen.kt` + `VoluntarioViewModel.kt`)
* **Propósito:** Herramienta principal de terreno para estudiantes voluntarios en sedes con o sin internet.
* **Componentes UI:**
  * **Panel de Conectividad Offline-First:** Interruptor (`Switch`) para conmutar entre `Conexión a la Nube Activa` y `Modo Sin Conexión (Offline-First)`, con contador en vivo de registros almacenados en `Room/SQLite`.
  * **Botón Explícito de Sincronización:** Botón ámbar **"Sincronizar N Registro(s) Pendientes"** que envía por lote (`POST /api/asistencias`) los registros locales hacia **Supabase PostgreSQL** y actualiza su insignia a `Sincronizado`.
  * **Panel de Geocerca GPS & Sensor Óptico:** Muestra latitud, longitud y distancia en metros calculada con Haversine respecto al recinto ($35\text{ m} / 150\text{ m}$), junto al botón **"Validar GPS"** (`LocationHardwareHelper`).
  * **Escáner Óptico QR y Entrada Manual (`QrScannerView`):** Visor de cámara (`QrCameraHardwareHelper`) y campo de ingreso rápido de identificador sintético (`BEN-XXXXX`).
  * **Historial de Acreditaciones en Dispositivo:** Tarjetas con nombre ficticio, ID, método (`QR` / `MANUAL`), distancia GPS, hora exacta y badge de estado (`Sincronizado` en verde esmeralda vs. `Pendiente` en ámbar).

### Vista 6: Portal del Beneficiario – Pase QR y Encuesta (`BeneficiarioScreen.kt` + `BeneficiarioViewModel.kt`)
* **Propósito:** Permitir al vecino presentar su pase digital sin exponer datos sensibles y evaluar la calidad del taller.
* **Componentes UI:**
  * **Pase Digital QR Personal (`SYNCPASS-BENEFICIARIO-12345678-9`)** renderizado en alto contraste.
  * **Ficha de Actividad Asignada:** Nombre del taller, sede vecinal y horario.
  * **Formulario de Encuesta de Satisfacción:** Selector numérico de 1 a 5 estrellas, selector de nivel de utilidad práctica (`Bajo`, `Medio`, `Alto`, `Excelente`), campo de comentarios y botón **"Enviar Encuesta de Satisfacción"** conectado a Room local y `/api/encuestas` (Supabase).

### Vista 7: Administración General y Gobernanza RBAC (`AdminScreen.kt` + `AdminViewModel.kt`)
* **Propósito:** Supervisión institucional de indicadores, usuarios y mensajería push.
* **Componentes UI:**
  * Cuadrícula de **Métricas Institucionales de Impacto** (Talleres en BD, Usuarios Registrados, Asistencias Registradas, Tasa de Satisfacción).
  * **Listado RBAC de Usuarios** sincronizado desde `/api/usuarios` (Supabase tabla `usuario`) con indicador de cuenta `Activo` / `De baja`.
  * **Centro de Notificaciones Institucionales:** Botón **"Emitir Notificación Push"** para alertar en tiempo real a los equipos en terreno.

---

## 2. Matriz de Trazabilidad Visual: Implementado en MVP vs. Pendiente en Backlog

Siguiendo los criterios de la rúbrica de evaluación (**Sección 1.2.B**), la siguiente tabla explicita con total transparencia qué vistas y funcionalidades están **100% operativas en el entregable actual** y qué mejoras quedan planificadas en el **Backlog post-MVP**:

| Vista / Módulo | Funcionalidad en Mockup | Estado en Entregable Actual (Prueba 3 / MVP) | Estado en Backlog Futuro (Post-MVP) |
| :--- | :--- | :--- | :--- |
| **1. Login & Cognito (`LoginScreen`)** | Inicio de sesión con credenciales, OAuth2 AWS Cognito y selector RBAC directo | ✅ **100% Implementado:** Navegación directa al rol seleccionado y soporte OAuth2 Cognito (`:cognito-auth`). | 🔄 **Backlog:** Recuperación de contraseña por SMS/OTP directo en pantalla nativa y biometría (Huella/FaceID). |
| **2. Coordinación (`DocenteScreen`)** | Mantenedor de talleres (Listar, Crear, Eliminar), QR de taller y exportación de acta | ✅ **100% Implementado:** Conectado en vivo a **Supabase PostgreSQL (`/api/talleres`)** + caché Room + exportación real de archivo `.csv` en almacenamiento interno (`ActaStorageHelper`). | 🔄 **Backlog:** Generación de acta firmada digitalmente en formato PDF con membrete gráfico institucional. |
| **3. Terreno (`VoluntarioScreen`)** | Modo Offline-First, botón Sincronizar, validación GPS Haversine y lectura QR | ✅ **100% Implementado:** Almacenamiento local en `AppDatabase` (`Room`), cálculo Haversine real con `LocationManager` (`150m`) y sincronización batch hacia Supabase (`/api/asistencias` + `sync_log`). | 🔄 **Backlog:** Sincronización automática silenciosa en segundo plano mediante `WorkManager` al detectar cambio de red Wi-Fi. |
| **4. Beneficiario (`BeneficiarioScreen`)** | Pase QR sintético y encuesta de satisfacción (1–5 estrellas + utilidad + comentarios) | ✅ **100% Implementado:** Generación de QR sintético y envío de encuesta hacia `AppDatabase` local y tabla `encuesta_valoracion` en **Supabase (`/api/encuestas`)**. | 🔄 **Backlog:** Descarga de diploma o certificado de participación comunitaria en el teléfono del vecino. |
| **5. Gobernanza (`AdminScreen`)** | Dashboard de métricas globales, listado RBAC de usuarios y envío de alertas Push | ✅ **100% Implementado:** Consulta real de `/api/usuarios` y `/api/talleres` en Supabase + emisión de notificaciones Push vía `NtfySender` / `/api/notificar`. | 🔄 **Backlog:** Gráficos históricos comparativos por semestre y exportación masiva a PowerBI / Looker Studio. |
| **6. Portal Web (`SyncPass-Web`)** | Dashboard Web administrativo, mantenedor de talleres/usuarios y vista de beneficiario | ✅ **100% Implementado:** Desplegado en producción en Vercel (`https://sync-pass-web-rho.vercel.app`) conectado a la misma base de datos Supabase PostgreSQL. | 🔄 **Backlog:** Mapa interactivo de calor (Heatmap) con polígonos de todas las juntas de vecinos de la región. |

---

## 3. Diseño UI/UX y Trazabilidad Visual — Aplicación Web React (`SyncPass-Web`)

| Vista / Ruta Web (`Wouter`) | Componentes y Diseño UI/UX (`Tailwind` + `Atomic Design`) | Implementado en el Entregable Actual (MVP) | Pendiente en el Backlog (Futuras Iteraciones) |
| :--- | :--- | :--- | :--- |
| **1. Portada (`/` – `HomePage.tsx`)** | Hero editorial con propuesta de valor comunitaria, indicadores operativos de sede y tarjeta interactiva 3D con código QR real (`canvas`) y feedback sonoro (`Web Audio API`). | ✅ **100% Implementado:** Renderizado de QR real escaneable por celulares, modo claro/oscuro persistente y navegación directa. | 🔄 **Backlog:** Galería fotográfica de jornadas anteriores por sede Duoc UC. |
| **2. Acceso y Registro (`/login` – `LoginPage.tsx`)** | Pestañas segmentadas (`Iniciar sesión` y `Crear cuenta`), validación obligatoria de correo y contraseña ($\ge 6$ caracteres), selector de rol e integración OAuth2 PKCE con **Amazon Cognito**. | ✅ **100% Implementado:** Login obligatorio (sin atajos sin credenciales), registro conectado a `/api/usuarios` en Supabase y redirección por rol. | 🔄 **Backlog:** Recuperación de contraseña mediante código OTP enviado por correo. |
| **3. Panel de Talleres en Sede (`/dashboard` – `DashboardPage.tsx`)** | Protegido por `RequireAuth`. Adapta su interfaz según el perfil activo (**Docente**, **Voluntario**, **Beneficiario**, **Admin**), con buscador y filtro de talleres en vivo, visor de cámara/QR, switch **Modo Offline** y encuesta. | ✅ **100% Implementado:** CRUD completo de talleres (`/api/talleres`), registro de asistencia QR y manual (`/api/asistencias`), sincronización por lotes (`/api/asistencias/sync`) y encuesta (`/api/encuestas`) en **Supabase PostgreSQL**. | 🔄 **Backlog:** Exportación directa en formato PDF institucional con timbre digital. |
| **4. Gestión de Equipo RBAC (`/users` – `UsersPage.tsx`)** | Protegido por `RequireAuth` para rol `admin`. Directorio de usuarios con estados (`Activo` / `Pausado`), creación modal, baja lógica y eliminación. | ✅ **100% Implementado:** Conectado a `/api/usuarios` en Supabase PostgreSQL con validación de token/rol y estados de carga skeleton. | 🔄 **Backlog:** Importación masiva de nóminas de alumnos voluntarios desde archivo Excel (`.xlsx`). |
