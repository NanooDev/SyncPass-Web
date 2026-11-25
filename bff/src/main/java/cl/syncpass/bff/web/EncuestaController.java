package cl.syncpass.bff.web;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import cl.syncpass.bff.service.SupabaseGatewayService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Controlador REST de Encuestas de Valoración Comunitaria (/api/encuestas). */
@RestController
@RequestMapping("/api/encuestas")
public class EncuestaController {

    private static final String DEFAULT_EVENTO_ID = "00000000-0000-0000-0002-000000000001";
    private static final String DEFAULT_BENEFICIARIO_ID = "00000000-0000-0000-0003-000000000001";

    private final SupabaseGatewayService supabase;

    public EncuestaController(SupabaseGatewayService supabase) {
        this.supabase = supabase;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('admin','coordinator')")
    public ResponseEntity<Map<String, Object>> listar() {
        List<Map<String, Object>> rows = supabase.select(
                "encuesta_valoracion?select=*&order=created_locally_at.desc");
        return ResponseEntity.ok(Map.of(
                "exito", true,
                "mensaje", "Encuestas de valoración obtenidas desde PostgreSQL (Supabase)",
                "datos", rows));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('admin','coordinator','volunteer','attendee')")
    public ResponseEntity<Map<String, Object>> crear(@RequestBody Map<String, Object> body) {
        String id = UUID.randomUUID().toString();
        String nowIso = Instant.now().toString();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id_encuesta", id);
        payload.put("id_evento", asValidUuid(body.get("tallerId"), DEFAULT_EVENTO_ID));
        payload.put("id_beneficiario", asValidUuid(body.get("beneficiarioId"), DEFAULT_BENEFICIARIO_ID));
        payload.put("estrellas", body.getOrDefault("calificacionEstrellas", 5));
        payload.put("nivel_utilidad", body.getOrDefault("utilidad", 4));
        payload.put("comentarios", String.valueOf(body.getOrDefault("comentarios", "Excelente taller comunitario")));
        payload.put("is_synced", true);
        payload.put("created_locally_at", nowIso);
        payload.put("synced_at", nowIso);
        payload.put("device_id", String.valueOf(body.getOrDefault("deviceId", "BFF-SPRING")));

        supabase.insert(
                "encuesta_valoracion?on_conflict=id_evento,id_beneficiario",
                payload,
                "resolution=merge-duplicates,return=representation");

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "exito", true,
                "mensaje", "Encuesta de valoración guardada en PostgreSQL (Supabase)",
                "datos", payload));
    }

    private String asValidUuid(Object raw, String fallback) {
        if (raw == null) return fallback;
        try {
            return UUID.fromString(String.valueOf(raw)).toString();
        } catch (IllegalArgumentException e) {
            return fallback;
        }
    }
}
