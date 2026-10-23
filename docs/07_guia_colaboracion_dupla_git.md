# Guía de Colaboración en Dupla y Estrategia Git (Frontend Web)

> **Asignatura:** DSY1105 - Desarrollo Móvil / Fullstack  
> **Institución:** Duoc UC  
> **Proyecto:** SyncPass Web (React 19 + TypeScript + AWS Cognito PKCE)  
> **Equipo de Trabajo (Dupla):**
> - **Mariano Acevedo** (GitHub: `NanooDev`, Email: `marianoacevedo1809@gmail.com`)
> - **Álvaro León** (Email Institucional: `alv.leon@duocuc.cl`)

---

## 1. Justificación Académica y Requisito Docente

El profesor solicitó que ambos integrantes registren commits en el repositorio para evidenciar trabajo en equipo, asignación clara de roles y uso profesional de Git.

---

## 2. Matriz de Repartición de Responsabilidades en Web

| Módulo / Funcionalidad | Integrante Responsable | Rol Colaborador |
| :--- | :--- | :--- |
| **Arquitectura React 19, TypeScript & Vite** | Mariano Acevedo | Álvaro León |
| **Autenticación AWS Cognito con PKCE** | Mariano Acevedo | Álvaro León |
| **Control de Acceso Basado en Roles (RBAC)** | Mariano Acevedo | Álvaro León |
| **Dashboard Territorial y Modo Offline Simulado** | Álvaro León | Mariano Acevedo |
| **Formulario de Encuesta Rápida Comunitaria** | Álvaro León | Mariano Acevedo |
| **Pruebas Unitarias Vitest & Testing Library** | Álvaro León | Mariano Acevedo |

---

## 3. Comandos de Trabajo para Álvaro León

Para registrar cambios a nombre de Álvaro con su correo institucional de Duoc:

```bash
git config --local user.name "Alvaro Leon"
git config --local user.email "alv.leon@duocuc.cl"

git checkout -b feature/alvaro-web-dashboard
git add src/pages/dashboard/DashboardPage.tsx
git commit -m "feat(dashboard): adaptar interfaz territorial y encuesta comunitaria sin emojis"
git push -u origin feature/alvaro-web-dashboard
```

O utilizando autoría explícita si se realiza desde la misma sesión:
```bash
git commit --author="Alvaro Leon <alv.leon@duocuc.cl>" -m "feat(dashboard): adaptar interfaz territorial y encuesta comunitaria sin emojis"
```
