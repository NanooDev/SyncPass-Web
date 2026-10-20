# Sync Pass BFF (Spring Boot + Java 21 + Gradle)

## Requisitos

- Java 21 (`brew install openjdk@21`)
- El wrapper (`./gradlew`) descarga el Gradle correcto solo.

## Comandos (desde `bff/`)

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
./gradlew build   # compila + tests
./gradlew test    # solo tests
./gradlew bootRun # levanta en http://localhost:8080
```

## Endpoint

- `GET /api/users` → solo rol `admin` (JWT con claim `https://sync-pass/roles`).
  - Sin token → `401`. Con token sin admin → `403`. Con admin → `200` + lista mock.

## Config (todo sobreescribible por env)

Ver `src/main/resources/application.yml`: `AUTH0_ISSUER`, `AUTH0_JWK_SET_URI`,
`AUTH0_AUDIENCE` (default `https://sync-pass-api`), `AUTH0_ROLES_CLAIM`, puerto `8080`.
