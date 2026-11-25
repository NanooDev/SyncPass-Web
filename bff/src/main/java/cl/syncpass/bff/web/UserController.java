package cl.syncpass.bff.web;

import java.util.List;
import java.util.Map;

import cl.syncpass.bff.service.SupabaseGatewayService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Solo admin (el JWT debe traer el rol admin en el claim configurado). */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final SupabaseGatewayService supabase;

    public UserController(SupabaseGatewayService supabase) {
        this.supabase = supabase;
    }

    @GetMapping
    @PreAuthorize("hasRole('admin')")
    public List<UserDto> list() {
        List<Map<String, Object>> rows = supabase.select("usuario?select=id_usuario,correo,rol&order=created_at.desc");
        return rows.stream()
                .map(row -> new UserDto(
                        String.valueOf(row.getOrDefault("id_usuario", "")),
                        String.valueOf(row.getOrDefault("correo", "")),
                        mapRole(String.valueOf(row.getOrDefault("rol", "volunteer")))))
                .toList();
    }

    private String mapRole(String dbRole) {
        return switch (dbRole.toLowerCase()) {
            case "administrador", "admin" -> "admin";
            case "docente", "coordinator" -> "coordinator";
            default -> "volunteer";
        };
    }
}
