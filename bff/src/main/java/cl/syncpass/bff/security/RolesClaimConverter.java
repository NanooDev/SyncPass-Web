package cl.syncpass.bff.security;

import java.util.Collection;
import java.util.List;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

/**
 * Convierte el custom claim de roles (lo pone la Post-Login Action)
 * en authorities {@code ROLE_<slug>} para usar hasRole('admin').
 */
public class RolesClaimConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final String rolesClaim;

    public RolesClaimConverter(String rolesClaim) {
        this.rolesClaim = rolesClaim;
    }

    @Override
    @SuppressWarnings("unchecked")
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Object claim = jwt.getClaim(rolesClaim);
        Collection<GrantedAuthority> authorities = List.of();
        if (claim instanceof List<?> roles) {
            authorities = roles.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .map(GrantedAuthority.class::cast)
                    .toList();
        }
        return new JwtAuthenticationToken(jwt, authorities);
    }
}
