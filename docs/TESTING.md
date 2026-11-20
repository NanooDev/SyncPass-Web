# Estrategia de Pruebas Unitarias y Cobertura (`TESTING.md`)

**Proyecto:** SyncPass (`SyncPass-Android` + `SyncPass-Web`)  
**Herramientas:** JUnit 4 + `kotlinx-coroutines-test` + **JaCoCo** (Android Kotlin) · **Vitest + React Testing Library + V8** (Web React TypeScript)

---

## 1. Pruebas Unitarias en Android (`app/src/test/java/com/example/kotlin_login/`)

Siguiendo la arquitectura en capas enseñada en clases (**Inversión de Dependencias + Fakes + `MainDispatcherRule`**), las pruebas unitarias están organizadas por capa en espejo a `src/main/`:

### Infraestructura de Test (`rules/` y `fakes/`)
* **[MainDispatcherRule.kt](../app/src/test/java/com/example/kotlin_login/rules/MainDispatcherRule.kt):** Regla JUnit 4 (`TestWatcher` + `@get:Rule`) que reemplaza `Dispatchers.Main` con `UnconfinedTestDispatcher` durante cada prueba para ejecutar `viewModelScope` sin requerir un dispositivo Android físico ni interfaz gráfica.
* **[FakeSyncPassRepository.kt](../app/src/test/java/com/example/kotlin_login/fakes/FakeSyncPassRepository.kt):** Implementación simulada de la interfaz de dominio `SyncPassRepository` para aislar exclusivamente la lógica de los ViewModels; incluye bandera `shouldThrowError` para validar escenarios de falla controlada.
* **[FakeSyncPassLocalDataSource.kt](../app/src/test/java/com/example/kotlin_login/fakes/FakeSyncPassLocalDataSource.kt):** Simula la persistencia local SQLite/Room (`SyncPassLocalDataSource`).
* **[FakeSyncPassRemoteDataSource.kt](../app/src/test/java/com/example/kotlin_login/fakes/FakeSyncPassRemoteDataSource.kt):** Simula los DTOs HTTP de Retrofit/Supabase (`SyncPassRemoteDataSource`) y fallos de red (`IOException`).

### Casos de Prueba Implementados por Capa

1. **[VoluntarioViewModelTest.kt](../app/src/test/java/com/example/kotlin_login/ui/voluntario/VoluntarioViewModelTest.kt)** *(3 `@Test`)*
   * **Test 1 (Estado inicial):** Verifica que `isSyncing == false`, `isOffline == false`, `pendingSyncCount == 0` y carga inicial desde `FakeSyncPassRepository`.
   * **Test 2 (Éxito Offline-First):** Valida que al escanear un código QR sin conexión se incrementa `pendingSyncCount` y al sincronizar vuelve a `0` mostrando el feedback de éxito.
   * **Test 3 (Error controlado):** Activa `fakeRepository.shouldThrowError = true` y verifica que `VoluntarioViewModel` detiene la carga (`isSyncing == false`) y expone el mensaje de error en `uiState` sin cerrar la aplicación.
2. **[DocenteViewModelTest.kt](../app/src/test/java/com/example/kotlin_login/ui/docente/DocenteViewModelTest.kt)** *(2 `@Test`)*
   * **Test 4 (Crear taller y actualizar UIState):** Verifica apertura/cierre de diálogo, actualización de lista y selección automática del taller creado.
   * **Test 5 (Error controlado al cargar talleres):** Simula falla en `FakeSyncPassRepository` y comprueba estado `isSyncing == false` + `statusMessage` de error.
3. **[SyncPassRepositoryImplTest.kt](../app/src/test/java/com/example/kotlin_login/data/repository/SyncPassRepositoryImplTest.kt)** *(2 `@Test`)*
   * **Test 6 (Transformación DTO $\rightarrow$ Entity $\rightarrow$ Dominio):** Inyecta `FakeSyncPassLocalDataSource` y `FakeSyncPassRemoteDataSource`, verifica tamaño de lista (`size == 1`), mapeo de `id`/`nombre` y respaldo local.
   * **Test 7 (Resiliencia Offline ante falla de red):** Simula excepción HTTP (`fakeRemoteDataSource.shouldFail = true`) y valida que el repositorio retorna los datos guardados localmente en Room sin perder información.
4. **[SyncPassUnitTests.kt](../app/src/test/java/com/example/kotlin_login/SyncPassUnitTests.kt)** *(Suite integral)*
   * Cubre adicionalmente helpers de hardware nativo (`LocationHardwareHelper` Haversine, `QrCameraHardwareHelper`, `ActaStorageHelper` CSV), `BeneficiarioViewModel`, `AdminViewModel`, `LoginViewModel` (login + registro + fallback), `HomeViewModel`, `JwtDecoder` y módulos DI (`NetworkModule`, `DatabaseModule`, `RepositoryModule`).

### Comando de Ejecución y Verificación (Android)
```powershell
.\gradlew.bat testDebugUnitTest jacocoTestReport --console=plain
```
* **Reporte HTML JaCoCo:** `app/build/reports/jacoco/jacocoTestReport/html/index.html`

---

## 2. Pruebas Unitarias en Web React (`SyncPass-Web`)

* **Framework:** Vitest + React Testing Library (`jsdom`) + `@vitest/coverage-v8`.
* **Cobertura medida:** **36 pruebas unitarias en 12 archivos (`100% passing`)**, con **74.77% de statements** / **77% de líneas** globales y **>80% por componente** (`StatusBadge`, `MetricCard`, `WorkshopSummaryBanner`, `PageShell`, `UserCard`, `Layout` 87.5%, `UsersPage` 84.76%, `RequireAuth` 83.33%).
* **Comando:**
```powershell
npx vitest run --coverage
```
