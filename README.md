# SyncPass Web — Sistema de Gestión y Acreditación Comunitaria

> **Asignatura:** Desarrollo Fullstack / Vinculación con el Medio (Duoc UC)  
> **Autor:** Mariano Acevedo ([@NanooDev](https://github.com/NanooDev))  
> **Versión:** 1.0.0

---

## 📌 1. Descripción del Proyecto

**SyncPass Web** es el portal de administración, monitoreo y acreditación territorial del ecosistema **SyncPass**. Diseñado especialmente para iniciativas de **Vinculación con el Medio de Duoc UC**, permite coordinar talleres, operativos comunitarios y encuestas de satisfacción en juntas de vecinos, colegios y sedes sociales con soporte para operaciones sin conexión a internet (**Offline-First**).

---

## 📚 2. Documentación del Proyecto (`docs/`)

Toda la documentación técnica y bitácoras de desarrollo se encuentran centralizadas en la carpeta [`docs/`](./docs/):

- 📖 [**`docs/CASO-SYNCPASS.md`**](./docs/CASO-SYNCPASS.md): Especificación del caso territorial Duoc UC, problemática y modelo de solución.
- 📋 [**`docs/BITACORA-REQUERIMIENTOS.md`**](./docs/BITACORA-REQUERIMIENTOS.md): Registro cronológico de requerimientos y decisiones técnicas.
- ☁️ [**`docs/03-GUIA-AWS-COGNITO.md`**](./docs/03-GUIA-AWS-COGNITO.md): Guía de configuración y resolución del error *Invalid request* (flujo OAuth PKCE).
- 🗓️ [**`docs/04-PLAN-DE-TRABAJO.md`**](./docs/04-PLAN-DE-TRABAJO.md): Estado de las fases del proyecto y checklist de entrega.

---

## 🚀 3. Stack Tecnológico

- **Frontend Core:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Empaquetador y Dev Server:** [Vite 8](https://vitejs.dev/)
- **Enrutamiento SPA:** [Wouter](https://github.com/molefrog/wouter) (Enrutador ultraliviano y declarativo)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) + CSS Modules con Variables Semánticas
- **Autenticación Cloud:** [AWS Cognito](https://aws.amazon.com/cognito/) (User Pool + Hosted UI con PKCE RFC 7636) + Fallback Local / Auth0
- **Calidad de Código y Pruebas:** [Oxlint](https://oxc.rs/) (Linter de alta velocidad) y [Vitest](https://vitest.dev/) con React Testing Library

---

## 👥 4. Matriz de Roles y Permisos (RBAC)

El sistema implementa un control de acceso basado en roles con 4 perfiles diferenciados:

| Rol | Slug | Pantallas / Capacidades |
|---|---|---|
| **Docente / Coordinador** | `coordinator` | Creación de talleres, monitoreo de cupos en tiempo real, generación de códigos QR de asistencia y descarga de reportes PDF. |
| **Estudiante Voluntario** | `volunteer` | Modo Acreditación en terreno, registro manual por RUT o escaneo de pase QR, indicador de sincronización offline con la nube. |
| **Beneficiario Comunitario** | `attendee` | Consulta de talleres inscritos, pase digital QR personal y encuesta inmediata de satisfacción (escala 1-5 estrellas). |
| **Administrador** | `admin` | Vista ejecutiva de impacto territorial, gestión de usuarios (`/users`) y asignación de roles. |

---

## ☁️ 5. Configuración de AWS Cognito

- **Región:** `us-east-1` (N. Virginia)
- **User Pool ID:** `us-east-1_RlB8Ft9Z2`
- **App Client ID:** `2988naivr3qfmjhhm35k5lubvd`
- **Dominio Hosted UI:** `https://us-east-1rlb8ft9z2.auth.us-east-1.amazoncognito.com`
- **Flujo de Autenticación:** Authorization Code Grant con PKCE (S256)
- **URL de Retorno (Web):** `http://localhost:5173/`

---

## 💻 6. Puesta en Marcha Local

### Prerrequisitos:
- Node.js >= 18.x
- npm >= 9.x

### Instalación y Ejecución:
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev
```

La aplicación se abrirá en `http://localhost:5173/`.

### Comandos de Calidad:
```bash
npm run dev        # Inicia Vite en modo desarrollo
npm run build      # Compila TypeScript y genera el bundle optimizado para producción en dist/
npm run preview    # Previsualiza la compilación de producción localmente
npm test           # Ejecuta las 14 pruebas unitarias con Vitest
npm run lint       # Analiza el código con Oxlint (0 errores, 0 warnings)
```

---

## 📂 7. Estructura de Directorios

```text
syncpass-web/
├── docs/                   # Documentación técnica, bitácora y planes
│   ├── CASO-SYNCPASS.md
│   ├── BITACORA-REQUERIMIENTOS.md
│   ├── 03-GUIA-AWS-COGNITO.md
│   └── 04-PLAN-DE-TRABAJO.md
├── public/                 # Archivos estáticos y favicons
├── src/
│   ├── assets/             # Recursos gráficos e imágenes
│   ├── clients/            # Clientes HTTP (BFF / APIs)
│   ├── components/         # Componentes UI reutilizables (layout, require-auth, user-card)
│   ├── config/             # Configuración Cognito, PKCE y roles
│   ├── contexts/           # Proveedores de estado (AuthProvider, auth-context)
│   ├── hooks/              # Custom React Hooks (useAuth, useRoles, useDocumentTitle)
│   ├── pages/              # Páginas de la aplicación (home, login, dashboard, users)
│   ├── App.tsx             # Enrutador principal de la aplicación
│   ├── main.tsx            # Punto de entrada y montaje en el DOM
│   └── index.css           # Estilos base y variables CSS
├── README.md               # Este documento
└── package.json            # Metadatos del proyecto y dependencias
```

---

## 🛡️ 8. Modo de Evaluación y Demostración Rápida

Para facilitar la revisión por parte de los docentes evaluadores sin requerir credenciales en AWS:
1. Accede a la página de [Iniciar Sesión](/login).
2. En la sección **Acceso Rápido de Prueba (Evaluación)**, haz clic directamente en cualquiera de los botones:
   - 🎓 **Docente:** Visualiza gestión de proyectos, cupos y generación de QR.
   - 🤝 **Voluntario:** Visualiza acreditación en terreno, registro manual y simulación de escáner QR.
   - 🏡 **Beneficiario:** Visualiza pase digital QR y encuesta de satisfacción.
   - 🛡️ **Admin:** Accede a métricas institucionales y `/users`.
