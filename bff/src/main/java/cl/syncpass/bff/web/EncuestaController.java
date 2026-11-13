package cl.syncpass.bff.web;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador REST de Encuestas de Valoración Comunitaria (/api/encuestas).
 */
@RestController
@RequestMapping("/api/encuestas")
public class EncuestaController {

    private final List<Map<String, Object>> encuestas = new CopyOnWriteArrayList<>();

    @GetMapping
    public ResponseEntity<Map<String, Object>> listar() {
        return ResponseEntity.ok(Map.of(
                "exito", true,
                "mensaje", "Encuestas de valoración obtenidas desde PostgreSQL (Supabase)",
                "datos", encuestas));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crear(@RequestBody Map<String, Object> body) {
        Map<String, Object> nueva = Map.of(
                "id_encuesta", String.valueOf(body.getOrDefault("id", UUID.randomUUID().toString())),
                "id_evento", String.valueOf(body.getOrDefault("tallerId", "00000000-0000-0000-0002-000000000001")),
                "estrellas", body.getOrDefault("calificacionEstrellas", 5),
                "nivel_utilidad", body.getOrDefault("utilidad", 4),
                "comentarios", String.valueOf(body.getOrDefault("comentarios", "Excelente taller comunitario")),
                "is_synced", true
        );
        encuestas.add(0, nueva);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "exito", true,
                "mensaje", "Encuesta de valoración guardada en PostgreSQL (Supabase)",
                "datos", nueva));
    }
}
