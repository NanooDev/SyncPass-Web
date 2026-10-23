# Guía de Integración AWS Cognito — SyncPass Web

> **Integrantes (Dupla):** Mariano Acevedo (@NanooDev) y Álvaro León (alv.leon@duocuc.cl)  
> **Servicio Cloud:** Amazon Web Services (AWS) — Amazon Cognito User Pools  
> **Estado:** Configurado y Operativo

---

## 1. Parámetros del User Pool

- **Región:** `us-east-1` (US East - N. Virginia)
- **User Pool ID:** `us-east-1_RlB8Ft9Z2`
- **App Client ID:** `2988naivr3qfmjhhm35k5lubvd`
- **Dominio Hosted UI:** `https://us-east-1rlb8ft9z2.auth.us-east-1.amazoncognito.com`
- **Flujo OAuth:** Authorization Code Grant con PKCE (Proof Key for Code Exchange / RFC 7636)
- **Scopes permitidos:** `openid`, `email`, `phone`
- **URL de Retorno Web:** `http://localhost:5173/`

---

## 2. Solución al Error "Invalid request" en AWS Cognito

### Causa del error:
Al presionar el botón de inicio de sesión con Cognito, la pantalla mostraba:
```text
Invalid request
Please check your input and try again.
```
Esto ocurría porque el enlace anterior utilizaba el parámetro `response_type=token` (*Implicit Grant*). 

En las versiones modernas de AWS Cognito, el flujo *Implicit Grant* viene **deshabilitado por defecto** por motivos de seguridad en favor del flujo recomendado por el estándar OAuth 2.1: **Authorization Code Grant con PKCE** (`response_type=code`). Al recibir `response_type=token`, Cognito rechazaba la petición de inmediato con error 400.

### Solución implementada:
1. Se actualizó el endpoint a **`response_type=code`** con desafío criptográfico **PKCE S256** generado dinámicamente en el navegador.
2. Al autorizar al usuario, Cognito devuelve un código temporal en la URL (`http://localhost:5173/?code=...`).
3. El frontend intercambia automáticamente el código por los tokens JWT (`id_token` y `access_token`) en el endpoint `/oauth2/token` de Cognito.
4. Se extraen el correo y los grupos/roles del usuario y se inicia la sesión de forma transparente.

---

## ⚙️ 3. Verificación en la Consola de AWS (1 minuto)

Para asegurar que tu App Client acepte la redirección web:

1. Entra a tu consola de **AWS Cognito** ➔ User Pool `us-east-1_RlB8Ft9Z2`.
2. Ve a la pestaña **App integration** (Integración de aplicaciones).
3. Baja hasta **App client list** y haz clic en el cliente `SyncPass` (`2988naivr3qfmjhhm35k5lubvd`).
4. En la sección **Login pages**, verifica o añade:
   - **Allowed callback URLs:**
     ```text
     http://localhost:5173/
     com.example.kotlinlogin://cognito/callback
     ```
   - **Allowed sign-out URLs:**
     ```text
     http://localhost:5173/
     com.example.kotlinlogin://cognito/callback
     ```
5. En **OAuth 2.0 grant types**, asegúrate de que esté marcado **Authorization code grant**.
6. En **OpenID Connect scopes**, asegúrate de que estén marcados **OpenID**, **Email** y **Phone**.
7. Guarda los cambios.
