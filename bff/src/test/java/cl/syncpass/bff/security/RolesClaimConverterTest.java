package cl.syncpass.bff.security;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RolesClaimConverterTest {

    private static final String CLAIM = "https://sync-pass/roles";

    private static Jwt jwtWithRoles(Object roles) {
        return Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject("user")
                .claim(CLAIM, roles)
                .build();
    }

    @Test
    void convierteRolesEnAuthorities() {
        var auth = new RolesClaimConverter(CLAIM)
                .convert(jwtWithRoles(List.of("admin", "volunteer")));

        var roles = auth.getAuthorities().stream()
                .map(Object::toString)
                .toList();
        assertTrue(roles.contains("ROLE_admin"));
        assertTrue(roles.contains("ROLE_volunteer"));
    }

    @Test
    void sinClaimNoDaAuthorities() {
        var auth = new RolesClaimConverter(CLAIM)
                .convert(Jwt.withTokenValue("token")
                        .header("alg", "none")
                        .subject("user")
                        .build());
        assertEquals(0, auth.getAuthorities().size());
    }
}
