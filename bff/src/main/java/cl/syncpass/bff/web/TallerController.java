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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Controlador REST de Talleres Comunitarios (/api/talleres) persistido en Supabase PostgreSQL. */
@RestController
@RequestMapping("/api/talleres")
public class TallerController {

    private static final String DEFAULT_PROYECTO_ID = "00000000-0000-0000-0001-000000000001";
    private static final String DEFAULT_COORDINADOR_ID = "00000000-0000-0000-0000-000000000002";

    private final SupabaseGatewayService supabase;

    public TallerController(SupabaseGatewayService supabase) {
        this.supabase = supabase;
    }

    private List<TallerDto> fetchAll() {
        List<Map<String, Object>> rows = supabase.select("evento_taller?select=*&order=created_at.desc");
        return rows.stream().map(this::toDto).toList();
    }

    private TallerDto toDto(Map<String, Object> row) {
        String id = String.valueOf(row.getOrDefault("id_evento", ""));
        String name = String.valueOf(row.getOrDefault("nombre_actividad", "Taller Territorial"));
        String recinto = String.valueOf(row.getOrDefault("recinto", "Sede Comunitaria"));
        Object fecha = row.get("fecha_hora_programada");
        int cap = row.get("cupos_maximos") instanceof Number n ? n.intValue() : 30;
        String estadoDb = String.valueOf(row.getOrDefault("estado", "programado"));
        String status = switch (estadoDb.toLowerCase()) {
            case "en_curso" -> "En curso";
            case "finalizado", "cancelado" -> "Finalizado";
            default -> "Activo";
        };
        return new TallerDto(
                id,
                name,
                recinto,
                fecha != null ? String.valueOf(fecha) : "Hoy, 15:00 hrs",
                0,
                cap,
                status,
                "Prof. Mariano Acevedo");
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('admin','coordinator','volunteer','attendee')")
    public ResponseEntity<Map<String, Object>> listar() {
        return ResponseEntity.ok(Map.of(
                "exito", true,
                "mensaje", "Listado de talleres obtenido desde PostgreSQL (Supabase)",
                "datos", fetchAll()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('admin','coordinator')")
    public ResponseEntity<Map<String, Object>> crear(@RequestBody TallerDto body) {
        String id = isValidUuid(body.id()) ? body.id() : UUID.randomUUID().toString();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id_evento", id);
        payload.put("id_proyecto", DEFAULT_PROYECTO_ID);
        payload.put("id_coordinador", DEFAULT_COORDINADOR_ID);
        payload.put("nombre_actividad", body.name() != null && !body.name().isBlank() ? body.name().trim() : "Nuevo Taller");
        payload.put("fecha_hora_programada", Instant.now().toString());
        payload.put("cupos_maximos", body.capacity() > 0 ? body.capacity() : 30);
        String loc = body.location() != null ? body.location().trim() : "Sede Comunitaria";
        payload.put("recinto", loc);
        payload.put("direccion", loc);
        payload.put("qr_evento", "EVT-" + id.substring(0, 8).toUpperCase());
        payload.put("estado", mapStatusToDb(body.status()));

        List<Map<String, Object>> inserted = supabase.insert("evento_taller", payload, "return=representation");
        TallerDto created = inserted.isEmpty() ? body : toDto(inserted.get(0));
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "exito", true,
                "mensaje", "Taller registrado exitosamente en PostgreSQL (Supabase)",
                "datos", created,
                "talleres", fetchAll()));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('admin','coordinator')")
    public ResponseEntity<Map<String, Object>> actualizar(@RequestBody TallerDto body) {
        if (body.id() == null || body.id().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se requiere el ID del taller");
        }
        Map<String, Object> patch = new LinkedHashMap<>();
        if (body.name() != null && !body.name().isBlank()) patch.put("nombre_actividad", body.name().trim());
        if (body.location() != null && !body.location().isBlank()) {
            patch.put("recinto", body.location().trim());
            patch.put("direccion", body.location().trim());
        }
        if (body.capacity() > 0) patch.put("cupos_maximos", body.capacity());
        if (body.status() != null) patch.put("estado", mapStatusToDb(body.status()));
        patch.put("updated_at", Instant.now().toString());

        supabase.patch("evento_taller?id_evento=eq." + body.id(), patch);
        return ResponseEntity.ok(Map.of(
                "exito", true,
                "mensaje", "Taller actualizado en PostgreSQL (Supabase)",
                "datos", body,
                "talleres", fetchAll()));
    }

    @DeleteMapping
    @PreAuthorize("hasAnyRole('admin','coordinator')")
    public ResponseEntity<Map<String, Object>> eliminar(@RequestParam("id") String id) {
        if (id == null || id.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se requiere el ID del taller");
        }
        supabase.delete("evento_taller?id_evento=eq." + id);
        return ResponseEntity.ok(Map.of(
                "exito", true,
                "mensaje", "Taller eliminado de PostgreSQL (Supabase)",
                "talleres", fetchAll()));
    }

    private boolean isValidUuid(String val) {
        if (val == null || val.isBlank()) return false;
        try {
            UUID.fromString(val);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private String mapStatusToDb(String status) {
        if (status == null) return "programado";
        return switch (status.toLowerCase()) {
            case "en curso", "en_curso" -> "en_curso";
            case "finalizado", "completado" -> "finalizado";
            case "cancelado" -> "cancelado";
            default -> "programado";
        };
    }
}
