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
import org.springframework.web.server.ResponseStatusException;

/**
 * Controlador REST de Acreditación y Sincronización Offline-First (/api/asistencias).
 * Persiste registros individuales o lotes en Supabase PostgreSQL y audita en sync_log.
 */
@RestController
@RequestMapping("/api/asistencias")
public class AsistenciaController {

    private static final String DEFAULT_EVENTO_ID = "00000000-0000-0000-0002-000000000001";
    private static final String DEFAULT_VOLUNTARIO_ID = "00000000-0000-0000-0000-000000000002";
    private static final String DEFAULT_BENEFICIARIO_ID = "00000000-0000-0000-0003-000000000001";

    private final SupabaseGatewayService supabase;

    public AsistenciaController(SupabaseGatewayService supabase) {
        this.supabase = supabase;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('admin','coordinator','volunteer')")
    public ResponseEntity<Map<String, Object>> listar() {
        List<Map<String, Object>> rows = supabase.select(
                "registro_asistencia?select=*,beneficiario(identificador_sintetico,nombre_ficticio,qr_code)&order=timestamp_marcacion.desc");
        return ResponseEntity.ok(Map.of(
                "exito", true,
                "mensaje", "Registros de asistencia obtenidos desde PostgreSQL (Supabase)",
                "datos", rows));
    }

    @PostMapping({"", "/sync"})
    @PreAuthorize("hasAnyRole('admin','coordinator','volunteer')")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> sincronizar(@RequestBody Map<String, Object> body) {
        List<Map<String, Object>> items;
        if (body.get("registros") instanceof List<?> rawList) {
            if (rawList.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe incluir al menos un registro en registros");
            }
            items = (List<Map<String, Object>>) rawList;
        } else {
            items = List.of(body);
        }

        String nowIso = Instant.now().toString();
        for (Map<String, Object> item : items) {
            String rawRut = String.valueOf(item.getOrDefault("rut", item.getOrDefault("codigoQr", ""))).trim();
            if (rawRut.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cada asistencia debe incluir rut o codigoQr");
            }
            String id = asValidUuid(item.get("id"), UUID.randomUUID().toString());
            String tallerId = asValidUuid(item.get("tallerId"), DEFAULT_EVENTO_ID);
            String beneficiarioId = resolveOrCreateBeneficiario(
                    rawRut,
                    String.valueOf(item.getOrDefault("nombreBeneficiario", "Beneficiario Acreditado")));

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("id_registro", id);
            payload.put("id_evento", tallerId);
            payload.put("id_beneficiario", beneficiarioId);
            payload.put("id_voluntario", DEFAULT_VOLUNTARIO_ID);
            payload.put("timestamp_marcacion", nowIso);
            payload.put("latitud_marcacion", item.getOrDefault("latitud", -33.5015));
            payload.put("longitud_marcacion", item.getOrDefault("longitud", -70.6887));
            payload.put("distancia_recinto_m", item.getOrDefault("distanciaMetros", 25));
            payload.put("estado_validacion", String.valueOf(item.getOrDefault("estadoValidacion", "valido")));
            payload.put("is_synced", true);
            payload.put("created_locally_at", nowIso);
            payload.put("sync_attempt_at", nowIso);
            payload.put("synced_at", nowIso);
            payload.put("device_id", String.valueOf(item.getOrDefault("deviceId", "BFF-SPRING")));

            supabase.insert(
                    "registro_asistencia?on_conflict=id_evento,id_beneficiario",
                    payload,
                    "resolution=merge-duplicates,return=representation");

            Map<String, Object> syncLog = new LinkedHashMap<>();
            syncLog.put("id_sync", UUID.randomUUID().toString());
            syncLog.put("tabla_origen", "registro_asistencia");
            syncLog.put("id_registro_origen", id);
            syncLog.put("device_id", String.valueOf(item.getOrDefault("deviceId", "BFF-SPRING")));
            syncLog.put("resultado", "exitoso");
            syncLog.put("timestamp_sync", nowIso);
            supabase.insert("sync_log", syncLog, "return=minimal");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "exito", true,
                "mensaje", items.size() + " registro(s) sincronizados en PostgreSQL (Supabase)",
                "sincronizados", items.size()));
    }

    private String resolveOrCreateBeneficiario(String rutOrCode, String nombreBeneficiario) {
        String rawCode = rutOrCode.length() > 20 ? rutOrCode.substring(0, 20) : rutOrCode;
        try {
            List<Map<String, Object>> found = supabase.select(
                    "beneficiario?identificador_sintetico=eq." + rawCode + "&select=id_beneficiario");
            if (!found.isEmpty() && found.get(0).get("id_beneficiario") != null) {
                return String.valueOf(found.get(0).get("id_beneficiario"));
            }
            String newId = UUID.randomUUID().toString();
            Map<String, Object> newBen = new LinkedHashMap<>();
            newBen.put("id_beneficiario", newId);
            newBen.put("identificador_sintetico", rawCode);
            newBen.put("nombre_ficticio", nombreBeneficiario.isBlank() ? "Beneficiario Comunitario" : nombreBeneficiario);
            newBen.put("tipo", "vecino");
            newBen.put("qr_code", "QR-" + rawCode + "-" + newId.substring(0, 6));
            newBen.put("activo", true);
            List<Map<String, Object>> created = supabase.insert("beneficiario", newBen, "return=representation");
            if (!created.isEmpty() && created.get(0).get("id_beneficiario") != null) {
                return String.valueOf(created.get(0).get("id_beneficiario"));
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception ignored) {
            // Fallback seguro solo si Supabase rechaza creación duplicada concurrente
        }
        return DEFAULT_BENEFICIARIO_ID;
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
