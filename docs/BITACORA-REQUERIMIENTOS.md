# Bitácora de Requerimientos y Planes de Implementación

> **Proyecto:** SyncPass (Plataforma Web Fullstack)  
> **Integrantes (Dupla):** Mariano Acevedo (@NanooDev) y Álvaro León (alv.leon@duocuc.cl)  
> **Institución:** Duoc UC  
> **Fecha de Inicio:** Octubre 2026

---

## 1. Registro de Solicitudes y Requerimientos del Usuario

### Requerimiento 1: Aislamiento y Protección del Proyecto Anterior (MotoShop)
- **Solicitud del usuario:**
  > *"Quiero que primero no se esté ocupando lo de `proyecto-react-fs2` porque ahí tengo lo de MotoShop, entonces quiero hacer como la misma estructura solo que ahora tenga relación con SyncPass. No quiero tocar lo de MotoShop porque es la prueba 1 de Fullstack."*
- **Decisión y Acción:**
  - Se mantuvo el repositorio `C:\dev\web\html-duoc\clase-08\proyecto-react-fs2` completamente intacto.
  - Se creó un nuevo directorio de trabajo independiente en `C:\dev\web\syncpass-web` para alojar exclusivamente el frontend web de SyncPass.

---

### Requerimiento 2: Creación de Repositorio Dedicado para Fullstack
- **Solicitud del usuario:**
  > *"Se supone que ya tengo un repo de SyncPass para móvil (`SyncPass-Android`), pero ahora por lo que yo entiendo es mejor hacer otro repo de SyncPass para Fullstack... quiero que me ayudes a hacerla."*
- **Decisión y Acción:**
  - Se estructuró el proyecto `SyncPass-Web` como repositorio Git independiente, desacoplado del repositorio Android.
  - Se configuró el `.gitignore` para omitir `node_modules`, archivos de entorno privados y bundles de distribución (`dist/`).
  - Se prepararon las instrucciones de subida a GitHub bajo la cuenta `NanooDev/SyncPass-Web`.

---

### Requerimiento 3: Integración con AWS Cognito y Autenticación
- **Solicitud del usuario:**
  > *"Sincronicé lo de AWS Cognito para tener un login como auth... dime si funciona con AWS o tengo que meterme a AWS para que funcione."*
- **Decisión y Acción:**
  - Se integró la configuración del User Pool de Mariano:
    - User Pool ID: `us-east-1_RlB8Ft9Z2`
    - Client ID: `2988naivr3qfmjhhm35k5lubvd`
    - Dominio Cognito: `https://us-east-1rlb8ft9z2.auth.us-east-1.amazoncognito.com`
  - Se explicó al usuario que para que Cognito redirija al navegador web local, debe agregar la URL de retorno `http://localhost:5173/` en la sección *Allowed callback URLs* del App Client en la consola de AWS.
  - Se implementó un sistema de autenticación híbrido:
    1. Redirección oficial al Hosted UI de AWS Cognito (extracción automática de token JWT en el hash de la URL).
    2. Formulario de credenciales local con persistencia en `localStorage`.
    3. Selector de prueba de 1 clic para los 4 roles del sistema (`coordinator`, `volunteer`, `attendee`, `admin`).

---

### Requerimiento 4: Contenido Temático SyncPass (Cero Motos)
- **Solicitud del usuario:**
  > *"Quiero que SyncPass en Fullstack no sea esa cuestión de motos claramente, quiero que sea como un login bueno y que la página tenga relación con SyncPass básica pero que tenga casi las mismas cosas que tiene el `proyecto-react-fs2`."*
- **Decisión y Acción:**
  - Se eliminó toda referencia a repuestos o comercio de motocicletas.
  - Se implementó la identidad visual institucional de Duoc UC (Vinculación con el Medio).
  - Se construyeron módulos y paneles temáticos:
    - **Docente / Coordinador:** Visualización de talleres comunitarios (*Alfabetización Digital*, *Huertos Urbanos*, *Primeros Auxilios*), cupos y códigos QR.
    - **Estudiante Voluntario:** Modo de acreditación en terreno, indicador online/offline y escáner simulado de pases digitales.
    - **Beneficiario Comunitario:** Visualización del pase digital QR personal y módulo interactivo de encuesta de satisfacción de 30 segundos.
    - **Administrador:** Panel de métricas globales y administración de usuarios por rol.

---

### Requerimiento 5: Plan Previo y Documentación Formal
- **Solicitud del usuario:**
  > *"Quiero que crees un plan primero y que me lo digas para aprobártelo o no y luego ejecutarlo... dejando en el nuevo repo que se va a crear todo documentado y un documento con las cosas que te voy pidiendo y los planes que se van realizando."*
- **Decisión y Acción:**
  - Se presentó el plan de 3 fases en el chat y se esperó la confirmación expresa del usuario antes de crear archivos.
  - Se generó el presente documento (`BITACORA-REQUERIMIENTOS.md`) y el archivo de especificación del caso (`CASO-SYNCPASS.md`), además del `README.md` técnico.

---

## 2. Resumen de Ejecución Técnica

| Hito | Estado | Observación |
|---|---|---|
| Creación de directorio `C:\dev\web\syncpass-web` | Completado | Aislado de `proyecto-react-fs2` |
| Inicialización de Git | Completado | `git init` ejecutado |
| Instalación de dependencias | Completado | React 19, TypeScript, Vite, Tailwind CSS v4, Wouter |
| Configuración AWS Cognito | Completado | Parámetros cargados en `src/config/auth.ts` |
| Autenticación Contextual y Hooks | Completado | `AuthProvider`, `useAuth`, `useRoles`, `RequireAuth` |
| Creación de Vistas y Rutas | Completado | `/`, `/login`, `/dashboard`, `/users` |
| Pruebas Unitarias (Vitest) | Completado | 14 de 14 tests superados exitosamente |
| Análisis de Calidad (Oxlint) | Completado | 0 errores y 0 advertencias |
| Compilación de Producción (Vite) | Completado | Build generado en `dist/` en < 300ms |
| Documentación del Repositorio | Completado | `README.md`, `BITACORA-REQUERIMIENTOS.md`, `CASO-SYNCPASS.md` |
