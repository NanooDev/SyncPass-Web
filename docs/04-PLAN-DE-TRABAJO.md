# Plan de Trabajo y Bitácora de Desarrollo — SyncPass Web

> **Integrantes (Dupla):** Mariano Acevedo (@NanooDev) y Álvaro León (alv.leon@duocuc.cl)  
> **Proyecto:** SyncPass (Plataforma Territorial de Acreditación)  
> **Módulo:** Frontend Fullstack (React 19 + TypeScript + Vite)

---

## Hitos del Plan de Trabajo

### Fase 1: Aislamiento de Entorno y Arquitectura
- [x] Mantener `proyecto-react-fs2` intacto (respaldo para Evaluación 1 / MotoShop).
- [x] Crear el proyecto independiente `C:\dev\web\syncpass-web`.
- [x] Configurar Vite 8, React 19, TypeScript, Tailwind CSS v4 y Wouter.
- [x] Configurar herramientas de calidad (`oxlint` para linting y `vitest` para pruebas unitarias).

### Fase 2: Identidad SyncPass y Modelado de Roles
- [x] Eliminar referencias a comercio de motocicletas e incorporar diseño institucional de Vinculación con el Medio Duoc UC.
- [x] Implementar la matriz de 4 roles del sistema:
  - `coordinator` (Docente / Coordinador)
  - `volunteer` (Estudiante Voluntario)
  - `attendee` (Beneficiario Comunitario)
  - `admin` (Administrador)
- [x] Construir vistas interactivas:
  - Landing institucional (`/`)
  - Portal de acceso (`/login`)
  - Dashboard de proyectos y encuestas (`/dashboard`)
  - Panel de administración de usuarios (`/users`)

### Fase 3: Integración Cloud y Seguridad
- [x] Configurar User Pool de AWS Cognito (`us-east-1_RlB8Ft9Z2`).
- [x] Implementar flujo seguro Authorization Code Grant con PKCE (S256).
- [x] Implementar extractor de tokens y decodificador JWT.
- [x] Proporcionar selector rápido de roles para facilitar la evaluación a los docentes.

### Fase 4: Documentación y Versionamiento
- [x] Crear carpeta centralizada `docs/` para toda la documentación técnica, planes y especificaciones.
- [x] Documentar especificación del caso de negocio (`docs/CASO-SYNCPASS.md`).
- [x] Documentar bitácora de requerimientos del usuario (`docs/BITACORA-REQUERIMIENTOS.md`).
- [x] Documentar guía de solución de AWS Cognito (`docs/03-GUIA-AWS-COGNITO.md`).
- [x] Mantener repositorio Git limpio para sincronización con GitHub `NanooDev/SyncPass-Web`.
