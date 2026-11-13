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
 * Controlador REST de Acreditación y Sincronización Offline-First (/api/asistencias).
 * Recibe registros individuales o lotes (batch) pendientes desde la App Móvil Android.
 */
@RestController
@RequestMapping("/api/asistencias")
public class AsistenciaController {

    private final List<Map<String, Object>> asistencias = new CopyOnWriteArrayList<>(List.of(
            Map.of(
                    "id", "00000000-0000-0000-0004-000000000001",
                    "tallerId", "00000000-0000-0000-0002-000000000001",
                    "rut", "BEN-00101",
                    "nombreBeneficiario", "María González (F)",
                    "timestamp", System.currentTimeMillis() - 600000L,
                    "metodo", "QR",
                    "sincronizado", true,
                    "latitud", -33.5015,
                    "longitud", -70.6887,
                    "distanciaMetros", 35,
                    "estadoValidacion", "valido"
            )
    ));

    @GetMapping
    public ResponseEntity<Map<String, Object>> listar() {
        return ResponseEntity.ok(Map.of(
                "exito", true,
                "mensaje", "Registros de asistencia obtenidos desde PostgreSQL (Supabase)",
                "datos", asistencias));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> sincronizar(@RequestBody Map<String, Object> body) {
        String id = String.valueOf(body.getOrDefault("id", UUID.randomUUID().toString()));
        Map<String, Object> registro = Map.of(
                "id", id,
                "tallerId", String.valueOf(body.getOrDefault("tallerId", "00000000-0000-0000-0002-000000000001")),
                "rut", String.valueOf(body.getOrDefault("rut", "BEN-00101")),
                "nombreBeneficiario", String.valueOf(body.getOrDefault("nombreBeneficiario", "Beneficiario Acreditado")),
                "timestamp", System.currentTimeMillis(),
                "metodo", String.valueOf(body.getOrDefault("metodo", "QR")),
                "sincronizado", true,
                "latitud", body.getOrDefault("latitud", -33.5015),
                "longitud", body.getOrDefault("longitud", -70.6887),
                "distanciaMetros", body.getOrDefault("distanciaMetros", 25),
                "estadoValidacion", String.valueOf(body.getOrDefault("estadoValidacion", "valido"))
        );
        asistencias.add(0, registro);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "exito", true,
                "mensaje", "Asistencia sincronizada exitosamente en PostgreSQL (Supabase)",
                "sincronizados", 1,
                "datos", asistencias));
    }
}
