package cl.syncpass.bff.web;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

/**
 * Controlador autenticado para emisión de avisos push via ntfy.sh (/api/notificar).
 * Exige rol admin o coordinator y valida tópico, longitud y prioridad.
 */
@RestController
@RequestMapping("/api/notificar")
public class NotificarController {

    private static final String TOPIC_PREFIX = "app_vibe_";
    private static final Set<String> VALID_PRIORITIES = Set.of("1", "2", "3", "4", "5", "min", "low", "default", "high", "urgent");
    private final RestClient restClient = RestClient.builder().baseUrl("https://ntfy.sh").build();

    @GetMapping("/topic/{email}")
    @PreAuthorize("hasAnyRole('admin','coordinator')")
    public ResponseEntity<Map<String, Object>> topic(@PathVariable("email") String email) {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", deriveTopic(email)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('admin','coordinator')")
    public ResponseEntity<Map<String, Object>> notifyUser(@RequestBody Map<String, Object> body) {
        String message = String.valueOf(body.getOrDefault("message", "")).trim();
        if (message.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El mensaje es obligatorio");
        }
        if (message.length() > 500) {
            message = message.substring(0, 500);
        }

        String email = String.valueOf(body.getOrDefault("email", "")).trim();
        if (email.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo destinatario es obligatorio");
        }
        String topic = deriveTopic(email);
        String rawTitle = String.valueOf(body.getOrDefault("title", "SyncPass Alerta"))
                .replaceAll("[\\r\\n]+", " ")
                .trim();
        String title = rawTitle.isEmpty() ? "SyncPass Alerta" : rawTitle.substring(0, Math.min(100, rawTitle.length()));

        String rawPriority = String.valueOf(body.getOrDefault("priority", "4")).trim().toLowerCase();
        String priority = VALID_PRIORITIES.contains(rawPriority) ? rawPriority : "4";

        try {
            restClient.post()
                    .uri("/" + topic)
                    .header("Title", title)
                    .header("Priority", priority)
                    .body(message)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "No se pudo despachar la notificación", ex);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Notificación emitida correctamente",
                "topic", topic));
    }

    public static String deriveTopic(String email) {
        String normalized = email == null ? "" : email.trim().toLowerCase();
        if (normalized.isEmpty()) return TOPIC_PREFIX + "default";
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(normalized.getBytes(StandardCharsets.UTF_8));
            String hex = HexFormat.of().formatHex(digest);
            return TOPIC_PREFIX + hex.substring(0, 20);
        } catch (Exception e) {
            return TOPIC_PREFIX + "default";
        }
    }
}
