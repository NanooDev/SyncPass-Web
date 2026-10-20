package cl.syncpass.bff.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Orígenes permitidos para el frontend (ver application.yml). */
@ConfigurationProperties(prefix = "cors")
public record CorsProperties(List<String> allowedOrigins) {
}
