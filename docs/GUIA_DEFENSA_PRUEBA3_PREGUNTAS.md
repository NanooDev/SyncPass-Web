# Guía de Defensa Individual – Prueba 3 (40% de la Nota Final)

**Modalidad:** Interrogación oral / técnica individual frente al docente.  
**Criterio de Aprobación:** Responder de forma correcta y fundamentada **2 de 3 preguntas** sobre el código, la arquitectura o las decisiones técnicas del proyecto **SyncPass**.

---

## Bloque 1: Arquitectura en Capas (MVVM) e Inversión de Dependencias (`di/`)

### Pregunta 1: *"¿Cómo está organizada la arquitectura de su aplicación móvil y qué responsabilidad tiene cada capa?"*
**Respuesta exacta:**
> "Nuestra aplicación **SyncPass** implementa **MVVM (Model - View - ViewModel)** combinado con **Clean Architecture** en 4 capas desacopladas:
> 1. **Capa de Vista (`ui/*Screen.kt`, `ui/components/*`):** Son funciones `@Composable` de Jetpack Compose (`DocenteScreen`, `VoluntarioScreen`, `BeneficiarioScreen`, `AdminScreen`). Solo dibujan la interfaz observando un `StateFlow<UiState>` inmutable y llaman a funciones `onAlgo()` del ViewModel. **No contienen lógica de negocio ni acceso a datos.**
> 2. **Capa de ViewModel y Estado (`ui/*ViewModel.kt`, `ui/*UiState.kt`):** Es el controlador de estado de cada vista (equivalente a los `useState`/`useEffect` tipados en React). Maneja la lógica de presentación y validación (como evaluar la geocerca GPS), ejecuta corrutinas en `viewModelScope` y se comunica únicamente con la interfaz del repositorio en el dominio.
> 3. **Capa de Dominio (`domain/model`, `domain/repository/SyncPassRepository.kt`):** Contiene las entidades puras de negocio (`TallerEvento`, `AsistenciaRegistro`, `EncuestaSatisfaccion`) y la **interfaz `SyncPassRepository`**. No depende de Retrofit ni de Room.
> 4. **Capa de Datos (`data/repository`, `data/datasource`, `data/local`, `data/remote`):** `SyncPassRepositoryImpl` implementa la interfaz del dominio y coordina dos fuentes de datos (`SyncPassLocalDataSource` para **Room/SQLite** local y `SyncPassRemoteDataSource` para **Retrofit/OkHttp** hacia **Supabase PostgreSQL**)."

---

### Pregunta 2: *"¿Por qué la interfaz `SyncPassRepository` vive en el paquete `domain` y la clase `SyncPassRepositoryImpl` vive en `data`? ¿Para qué sirve el paquete `di/`?"*
**Respuesta exacta:**
> "Por el principio de **Inversión de Dependencias (D de SOLID)**.
> Si el `ViewModel` hiciera `new SyncPassRepositoryImpl()`, el dominio quedaría amarrado a las librerías de acceso a datos (`Retrofit`, `Room`) y además crearía múltiples instancias en memoria cada vez que se abre una pantalla, gastando más memoria RAM y batería del teléfono.
> Al dejar la interfaz `SyncPassRepository` en `domain/repository` y cablearla en el paquete `di/` (`NetworkModule`, `DatabaseModule`, `RepositoryModule`) mediante instancias únicas (`@Singleton`), el `ViewModel` solo conoce el contrato de la interfaz, y clientes costosos como `OkHttpClient`, `Retrofit` y `AppDatabase` se instancian **una sola vez en memoria** durante todo el ciclo de vida de la app."

---

### Pregunta 3: *"¿Por qué agregaron `LocalDataSource` y `RemoteDataSource` entre el Repositorio y Room/Retrofit?"*
**Respuesta exacta:**
> "Para desacoplar el repositorio de las tecnologías concretas:
> * `SyncPassApiService` tiene anotaciones propias de Retrofit (`@GET`, `@POST`, `@Body`) y DTOs con `@SerializedName`.
> * `SyncPassDao` tiene anotaciones propias de Room (`@Query`, `@Insert`) y entidades `@Entity`.
> Los **DataSources** (`SyncPassLocalDataSource` y `SyncPassRemoteDataSource`) actúan como una capa de abstracción: de esa capa hacia afuera, el repositorio y el dominio no tienen idea de si los datos vienen de Retrofit, de Room o de un archivo JSON plano."

---

## Bloque 2: Funcionamiento de la Sincronización Offline-First

### Pregunta 4: *"Explíqueme paso a paso en el código cómo funciona el modo Offline-First y qué ocurre exactamente cuando presionan el botón 'Sincronizar Registros Pendientes'."*
**Respuesta exacta:**
> "El flujo completo ocurre en 4 pasos:
> 1. **Captura en terreno (`VoluntarioViewModel.onCodeScanned`):** Cuando el voluntario escanea un código QR con el interruptor `isOffline = true`, el ViewModel valida el código con `QrCameraHardwareHelper`, calcula la distancia GPS con `LocationHardwareHelper` y llama a `repository.registrarAsistencia(..., isOffline = true)`.
> 2. **Guardado local (`SyncPassRepositoryImpl` -> `SyncPassLocalDataSource`):** Se crea un `AsistenciaEntity` con `sincronizado = false` (`0` en SQLite/Room) y se guarda en la tabla local `registro_asistencia_local` mediante `SyncPassDao.upsertAsistencia()`. En la pantalla aparece con insignia ámbar **Pendiente** y aumenta el contador `pendingSyncCount`.
> 3. **Sincronización por lote (`VoluntarioViewModel.onSyncPendingClick`):** Cuando vuelve el internet y el voluntario presiona el botón **'Sincronizar N Registros Pendientes'**, se invoca `repository.syncPendingAsistencias()`.
> 4. **Envío HTTP y marcado local:** El repositorio consulta `localDataSource.getPendingAsistencias()` (`SELECT * FROM registro_asistencia_local WHERE sincronizado = 0`), los transforma a `AsistenciaRemoteDto` y los envía por `POST /api/asistencias` mediante `Retrofit`. El backend inserta las filas en la tabla `registro_asistencia` de **Supabase PostgreSQL**, registra la auditoría en la tabla `sync_log`, y finalmente el teléfono ejecuta `localDataSource.markAsistenciasSynced(ids)` (`UPDATE ... SET sincronizado = 1`), cambiando todas las insignias a verde **Sincronizado**."

---

## Bloque 3: Integración de Hardware Nativo, Autenticación y Testing

### Pregunta 5: *"¿Cuáles son las APIs nativas de hardware de Android que integraron y dónde están en el código?"*
**Respuesta exacta:**
> "Integramos **3 APIs nativas de Android** dentro del paquete `core/hardware/` (superando el mínimo de 2):
> 1. **Geolocalización GPS (`LocationHardwareHelper.kt`):** Utiliza `android.location.LocationManager` (`GPS_PROVIDER` / `NETWORK_PROVIDER`) para obtener latitud y longitud del teléfono y aplica la fórmula trigonométrica de **Haversine** para medir la distancia exacta en metros hasta la sede vecinal (radio máximo de geocerca de $150\text{ m}$).
> 2. **Cámara y Escaneo Óptico QR (`QrCameraHardwareHelper.kt` + `QrScannerView`):** Utiliza `android.hardware.camera2.CameraManager` para verificar el sensor óptico trasero (`LENS_FACING_BACK`) y procesar los códigos QR institucionales (`SYNCPASS-BENEFICIARIO-...`).
> 3. **Almacenamiento de Archivos (`ActaStorageHelper.kt`):** Utiliza la API de almacenamiento interno (`context.filesDir` / `File`) para exportar un archivo real `.csv` (`acta_asistencia_<id>.csv`) cuando el docente descarga el acta del taller."

---

### Pregunta 6: *"¿Cómo funciona la autenticación y los roles (RBAC), y cómo verificaron la cobertura de pruebas unitarias (>30%)?"*
**Respuesta exacta:**
> * **Autenticación y RBAC:** Integramos un módulo dedicado `:cognito-auth` con OAuth2 / OIDC contra **AWS Cognito** (`us-east-1_RlB8Ft9Z2`) y decodificación de tokens JWT en `JwtDecoder.kt`. Según el claim de rol (`coordinator`, `volunteer`, `attendee`, `admin`) mapeado en `UserRole.kt`, `AppNavHost.kt` redirige directamente a `DocenteScreen`, `VoluntarioScreen`, `BeneficiarioScreen` o `AdminScreen`.
> * **Testing y Cobertura JaCoCo:** En `app/build.gradle.kts` configuramos el plugin **JaCoCo** y escribimos la suite `SyncPassUnitTests.kt` usando `JUnit 4` y `kotlinx-coroutines-test` con un `FakeSyncPassApiService`, probando todos los ViewModels, el repositorio Offline-First, los DataSources, la geocerca Haversine y el decodificador JWT, superando ampliamente el 30% de cobertura exigido."
