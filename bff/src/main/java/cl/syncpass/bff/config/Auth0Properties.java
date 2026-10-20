package cl.syncpass.bff.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Config Auth0 (ver bff/src/main/resources/application.yml). */
@ConfigurationProperties(prefix = "auth0")
public record Auth0Properties(
        String issuer,
        String jwkSetUri,
        String audience,
        String rolesClaim) {
}
