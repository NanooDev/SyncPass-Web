# Directrices de Agente IA, Registro de Prompts y Plan de Ejecución (`AGENT.md`)

**Proyecto:** SyncPass – Aplicación Móvil Nativa (Kotlin) & Cloud (Supabase / AWS / Spring Boot)  
**Propósito de este documento:** Establecer el contexto arquitectónico portátil entre sesiones de IA, documentar el uso estratégico y controlado de Inteligencia Artificial (evitando alucinaciones y código acoplado) y mantener el **Plan de Trabajo con Checklist verificable** exigido en la evaluación de Prueba 3.

---

## 1. Reglas de Ingeniería para el Agente IA (System Guidelines)

1. **Separación Estricta de Capas (MVVM + Clean Architecture):**
   * **Prohibido** colocar llamadas HTTP (`Retrofit`/`OkHttp`), consultas SQL (`Room`) o lógica de negocio dentro de funciones `@Composable` (`*Screen.kt`).
   * Toda vista (`DocenteScreen`, `VoluntarioScreen`, `BeneficiarioScreen`, `AdminScreen`, `LoginScreen`, `HomeScreen`) debe observar un único `StateFlow<*UiState>` expuesto por su `*ViewModel` y emitir eventos mediante funciones `onAlgo(...)`.
2. **Inversión de Dependencias (Principio SOLID - DIP):**
   * Los `ViewModels` solo pueden depender de la interfaz `SyncPassRepository` ubicada en el paquete `domain/repository`.
   * La implementación `SyncPassRepositoryImpl` (`data/repository`) coordina `SyncPassLocalDataSource` y `SyncPassRemoteDataSource` (`data/datasource`), los cuales encapsulan a `SyncPassDao` (`Room`) y `SyncPassApiService` (`Retrofit`).
   * La instanciación de clientes pesados (`OkHttpClient`, `Retrofit`, `AppDatabase`, `SyncPassRepository`) se realiza una sola vez (`@Singleton`) dentro del paquete `di/` (`NetworkModule`, `DatabaseModule`, `RepositoryModule`).
3. **Diseño Offline-First Real:**
   * Toda operación de terreno (acreditación QR/manual, creación de taller, encuesta de satisfacción) debe guardarse primero en el almacenamiento local (`AppDatabase`) con el atributo `sincronizado` (`true` si se envió a la nube, `false` si se operó sin red).
   * El botón explícito **"Sincronizar Registros Pendientes"** debe enviar los registros con `sincronizado == false` hacia los endpoints `/api/asistencias` y `/api/encuestas` en **Supabase PostgreSQL**, registrar la operación en `sync_log` y marcar los registros locales como `sincronizado = true`.
4. **Seguridad y Secretos:**
   * Jamás exponer claves privadas (`sb_secret_...` de Supabase) en el código fuente versionado ni llamar a servicios de terceros directamente desde el navegador cuando exista riesgo de CORS o fuga de credenciales; utilizar siempre el BFF (`/api/*`) con variables de entorno en el servidor.

---

## 2. Plan Maestro de Ingeniería y Checklist de Avance

- [x] **Fase 1: Base de Datos Relacional e Infraestructura Cloud (Supabase + BFF)**
  - [x] Ejecutar script DDL relacional (`docs/syncpass-ddl.sql`) en PostgreSQL de Supabase (`nxbsqkpnkawbkdksmnym.supabase.co`) con 9 tablas (`usuario`, `docente`, `estudiante_voluntario`, `beneficiario`, `proyecto_comunitario`, `evento_taller`, `registro_asistencia`, `encuesta_valoracion`, `sync_log`).
  - [x] Conectar endpoints REST `/api/talleres`, `/api/usuarios`, `/api/asistencias`, `/api/encuestas` y `/api/health` a Supabase PostgREST y actualizar controladores Spring Boot (`bff`).
  - [x] Configurar variables de entorno seguras (`SUPABASE_URL`, `SUPABASE_KEY`) en producción (Vercel) y verificar persistencia real `GET`/`POST`/`DELETE`.
- [x] **Fase 2: Refactorización Arquitectónica MVVM + Clean Architecture en Android**
  - [x] Definir modelos de dominio (`SyncPassModels.kt`) e interfaz `SyncPassRepository` en `domain/repository/`.
  - [x] Implementar persistencia local `data/local/` (`TallerEntity`, `AsistenciaEntity`, `EncuestaEntity`, `SyncPassDao`, `AppDatabase`).
  - [x] Implementar capa remota `data/remote/` (`SyncPassApiService` con Retrofit y DTOs con `@SerializedName`).
  - [x] Implementar fuentes de datos `data/datasource/` (`SyncPassLocalDataSource` y `SyncPassRemoteDataSource`) y repositorio `SyncPassRepositoryImpl`.
  - [x] Configurar módulos de Inversión de Dependencias en `di/` (`NetworkModule`, `DatabaseModule`, `RepositoryModule`).
  - [x] Separar `UiState` y `ViewModel` en todas las vistas (`VoluntarioViewModel`, `DocenteViewModel`, `BeneficiarioViewModel`, `AdminViewModel`, `LoginViewModel`, `HomeViewModel`).
- [x] **Fase 3: Integración de Hardware Nativo (3 APIs de Android)**
  - [x] **API Nativa #1 – Geolocalización GPS (`LocationHardwareHelper`):** Captura de coordenadas con `LocationManager` y cálculo trigonométrico de Haversine para validar geocerca a 150 metros del recinto.
  - [x] **API Nativa #2 – Cámara y Escáner QR (`QrCameraHardwareHelper`):** Verificación de sensor óptico trasero con `CameraManager` y decodificación de pases QR institucionales.
  - [x] **API Nativa #3 – Almacenamiento de Archivos (`ActaStorageHelper`):** Exportación local de actas de asistencia en formato `.csv` dentro del almacenamiento del dispositivo.
- [x] **Fase 4: Calidad de Software, Pruebas Unitarias y Cobertura JaCoCo (>30%)**
  - [x] Configurar plugin `jacoco` y tarea `jacocoTestReport` en `app/build.gradle.kts`.
  - [x] Implementar suite de pruebas unitarias (`SyncPassUnitTests.kt`) cubriendo ViewModels, Repositorio Offline-First, DataSources, Hardware Helpers, Decodificador JWT y Módulos DI.
  - [x] Verificar ejecución exitosa de `./gradlew testDebugUnitTest jacocoTestReport` superando holgadamente el 30% de cobertura mínima exigida.
- [x] **Fase 5: Documentación Arquitectónica C4, Alcance, Mockups y Evidencia de Video Hito 2**
  - [x] Redactar `docs/ARQUITECTURA.md` con diagramas Mermaid C4 (Niveles C1 Contexto, C2 Contenedores y C3 Componentes MVVM).
  - [x] Redactar `docs/ALCANCE.md` con RF, RNF, Casos de Uso detallados y diagrama de secuencia Offline-First.
  - [x] Redactar `docs/MOCKUPS.md` con presentación de las 7 vistas y matriz de trazabilidad (Implementado vs. Backlog).
  - [x] Generar video demostrativo oficial `Videoequipo1.mp4` ($\le 90\text{ s}$, resolución $720 \times 1280$, $< 50\text{ MB}$) e instructivo de carga mediante `AzCopy`.

---

## 3. Registro de Prompts y Decisiones Técnicas con IA (Auditoría de Uso Controlado)

| Iteración | Prompt / Solicitud de Ingeniería realizada al Agente IA | Validación Humana y Decisión Arquitectónica Aplicada |
| :--- | :--- | :--- |
| **Prompt 1 (Levantamiento y Modelo de Datos)** | *"Analiza el caso de Vinculación con el Medio de Duoc UC (SyncPass) y diseña un esquema relacional PostgreSQL para Supabase que soporte operación Offline-First en Android, validación de geocerca GPS, protección de datos personales mediante códigos sintéticos y auditoría de sincronizaciones."* | Se verificó que la tabla `beneficiario` no almacenara RUTs reales (cumpliendo la restricción ética del caso) y se incorporaron las columnas `is_synced`, `created_locally_at`, `synced_at` y `device_id` en `registro_asistencia` y `encuesta_valoracion`, además de la tabla `sync_log`. |
| **Prompt 2 (Desacoplamiento MVVM y DIP)** | *"Refactoriza la aplicación Android para que ninguna pantalla `@Composable` tenga estado de negocio ni llamadas directas a repositorios. Aplica el patrón enseñado en clases: `Screen -> ViewModel (UiState) -> SyncPassRepository (interfaz en domain) -> SyncPassRepositoryImpl -> LocalDataSource (Room) & RemoteDataSource (Retrofit)` con inyección en `di/`."* | Se revisó que `VoluntarioViewModel`, `DocenteViewModel`, `BeneficiarioViewModel` y `AdminViewModel` importen únicamente `com.example.kotlin_login.domain.repository.SyncPassRepository`, eliminando cualquier acoplamiento de la capa de dominio con `Retrofit` o `Room`. |
| **Prompt 3 (Sincronización Offline-First y Geocerca GPS)** | *"Implementa el flujo completo de acreditación en terreno en `VoluntarioViewModel`: cálculo de distancia Haversine contra las coordenadas de la sede (-33.5012, -70.6890, radio 150m), guardado local en `AppDatabase` cuando `isOffline = true`, y sincronización por lote hacia `/api/asistencias` en Supabase al presionar el botón Sincronizar."* | Se probó que al escanear un QR en modo Offline el contador `pendingSyncCount` se incremente y el registro quede con badge `Pendiente`; al pulsar sincronizar, se envía el lote JSON a Supabase, se inserta en `sync_log` y el badge cambia a `Sincronizado`. |
| **Prompt 4 (Pruebas Unitarias y Cobertura JaCoCo)** | *"Configura JaCoCo en `app/build.gradle.kts` e implementa pruebas unitarias en JUnit 4 + `kotlinx-coroutines-test` con un `FakeSyncPassApiService` para validar todos los ViewModels, el repositorio Offline-First y los helpers de hardware superando el 30% de cobertura."* | Se excluyeron las clases generadas por Android (`R`, `BuildConfig`) y las funciones visuales declarativas puras (`*Screen.kt`), enfocando la medición de cobertura en las capas de lógica de negocio (`ui/*ViewModel`, `domain/*`, `data/*`, `core/*`, `di/*`). |
