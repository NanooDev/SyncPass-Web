# SyncPass Web — Sistema de Gestión y Acreditación Comunitaria

> **Asignatura:** Desarrollo Fullstack / Vinculación con el Medio (Duoc UC)  
> **Autor:** Mariano Acevedo ([@NanooDev](https://github.com/NanooDev))  
> **Versión:** 1.0.0

---

## 📌 1. Descripción del Proyecto

**SyncPass Web** es el portal de administración, monitoreo y acreditación territorial del ecosistema **SyncPass**. Diseñado especialmente para iniciativas de **Vinculación con el Medio de Duoc UC**, permite coordinar talleres, operativos comunitarios y encuestas de satisfacción en juntas de vecinos, colegios y sedes sociales con soporte para operaciones sin conexión a internet (**Offline-First**).

---

## 🚀 2. Stack Tecnológico

- **Frontend Core:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Empaquetador y Dev Server:** [Vite 8](https://vitejs.dev/)
- **Enrutamiento SPA:** [Wouter](https://github.com/molefrog/wouter) (Enrutador ultraliviano y declarativo)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) + CSS Modules con Variables Semánticas
- **Autenticación Cloud:** [AWS Cognito](https://aws.amazon.com/cognito/) (User Pool + Hosted UI) + Fallback Local / Auth0
- **Calidad de Código y Pruebas:** [Oxlint](https://oxc.rs/) (Linter de alta velocidad) y [Vitest](https://vitest.dev/) con React Testing Library

---

## 👥 3. Matriz de Roles y Permisos (RBAC)

El sistema implementa un control de acceso basado en roles con 4 perfiles diferenciados:

| Rol | Slug | Pantallas / Capacidades |
|---|---|---|
| **Docente / Coordinador** | `coordinator` | Creación de talleres, monitoreo de cupos en tiempo real, generación de códigos QR de asistencia y descarga de reportes PDF. |
| **Estudiante Voluntario** | `volunteer` | Modo Acreditación en terreno, registro manual por RUT o escaneo de pase QR, indicador de sincronización offline con la nube. |
| **Beneficiario Comunitario** | `attendee` | Consulta de talleres inscritos, pase digital QR personal y encuesta inmediata de satisfacción (escala 1-5 estrellas). |
| **Administrador** | `admin` | Vista ejecutiva de impacto territorial, gestión de usuarios (`/users`) y asignación de roles. |

---

## ☁️ 4. Configuración de AWS Cognito

El proyecto está vinculado al User Pool configurado en Amazon Web Services:

- **Región:** `us-east-1` (N. Virginia)
- **User Pool ID:** `us-east-1_RlB8Ft9Z2`
- **App Client ID:** `2988naivr3qfmjhhm35k5lubvd`
- **Dominio Hosted UI:** `https://us-east-1rlb8ft9z2.auth.us-east-1.amazoncognito.com`
- **URL de Retorno (Web):** `http://localhost:5173/`

### ⚙️ Paso Requerido en AWS Console (1 minuto):
1. Iniciar sesión en la consola de **AWS Cognito**.
2. Entrar a User Pools ➔ Seleccionar el pool `us-east-1_RlB8Ft9Z2`.
3. Ir a la pestaña **App integration** (Integración de aplicaciones) ➔ Bajar hasta **App client list** y hacer clic en el cliente `SyncPass`.
4. En la sección **Login pages** (Páginas de inicio de sesión), hacer clic en **Edit** (Editar).
5. En **Allowed callback URLs** (URLs de redirección permitidas), añadir:
   ```text
   http://localhost:5173/
   ```
6. En **Allowed sign-out URLs** (URLs de cierre de sesión permitidas), añadir:
   ```text
   http://localhost:5173/
   ```
7. Guardar cambios.

---

## 💻 5. Puesta en Marcha Local

### Prerrequisitos:
- Node.js >= 18.x
- npm >= 9.x

### Instalación y Ejecución:
```bash
# 1. Clonar el repositorio
git clone https://github.com/NanooDev/SyncPass-Web.git
cd SyncPass-Web

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

La aplicación se abrirá en `http://localhost:5173/`.

### Comandos Disponibles:
```bash
npm run dev        # Inicia Vite en modo desarrollo
npm run build      # Compila TypeScript y genera el bundle optimizado para producción en dist/
npm run preview    # Previsualiza la compilación de producción localmente
npm test           # Ejecuta la suite de pruebas unitarias con Vitest
npm run lint       # Analiza el código con Oxlint
```

---

## 📂 6. Estructura de Directorios

```text
syncpass-web/
├── public/                 # Archivos estáticos y favicons
├── src/
│   ├── assets/             # Recursos gráficos e imágenes
│   ├── clients/            # Clientes HTTP (BFF / APIs)
│   ├── components/         # Componentes UI reutilizables
│   │   ├── layout/         # Header institucional, navegación y footer
│   │   ├── require-auth/   # HOC protector de rutas por autenticación y roles
│   │   └── user-card/      # Tarjeta visual de usuario y badge de rol
│   ├── config/             # Configuración de AWS Cognito, BFF y constantes de roles
│   ├── contexts/           # Proveedores de estado (AuthProvider, AuthContext)
│   ├── hooks/              # Custom React Hooks
│   │   ├── use-auth/       # Hook global de autenticación
│   │   ├── use-document-title/ # Hook para títulos dinámicos en el navegador
│   │   └── use-roles/      # Hook de validación de roles de usuario
│   ├── pages/              # Páginas de la aplicación (Wouter)
│   │   ├── home/           # Landing page con identidad Duoc UC
│   │   ├── login/          # Portal de inicio de sesión (Cognito + Formulario + Demo)
│   │   ├── dashboard/      # Panel de control por roles (Docente, Voluntario, Vecino)
│   │   └── users/          # Panel de administración de usuarios
│   ├── App.tsx             # Enrutador principal de la aplicación
│   ├── main.tsx            # Punto de entrada y montaje en el DOM
│   └── index.css           # Estilos base y variables CSS
├── BITACORA-REQUERIMIENTOS.md # Registro cronológico de requerimientos y planes
├── CASO-SYNCPASS.md        # Especificación completa del caso de vinculación comunitaria
└── package.json            # Metadatos del proyecto y dependencias
```

---

## 🛡️ 7. Modo de Evaluación y Demostración Rápida

Para facilitar la revisión por parte de los docentes evaluadores sin requerir credenciales en AWS:
1. Accede a la página de [Iniciar Sesión](/login).
2. En la sección **Acceso Rápido de Prueba (Evaluación)**, haz clic directamente en cualquiera de los botones:
   - 🎓 **Docente:** Visualiza gestión de proyectos, cupos y generación de QR.
   - 🤝 **Voluntario:** Visualiza acreditación en terreno, registro manual y simulación de escáner QR.
   - 🏡 **Beneficiario:** Visualiza pase digital QR y encuesta de satisfacción.
   - 🛡️ **Admin:** Accede a métricas institucionales y `/users`.
