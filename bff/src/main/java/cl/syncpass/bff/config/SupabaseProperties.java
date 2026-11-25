package cl.syncpass.bff.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Configuración de Supabase PostgREST (ver bff/src/main/resources/application.yml). */
@ConfigurationProperties(prefix = "supabase")
public record SupabaseProperties(
        String url,
        String jdbcUrl,
        String key) {
}
