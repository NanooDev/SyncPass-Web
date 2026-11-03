package cl.syncpass.bff.web;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Controlador REST de Talleres Comunitarios (/api/talleres) compartido por Web y Android. */
@RestController
@RequestMapping("/api/talleres")
public class TallerController {

    private final List<TallerDto> talleres = new CopyOnWriteArrayList<>(List.of(
            new TallerDto("T-101", "Alfabetización Digital para Adultos Mayores",
                    "Junta de Vecinos N°14 Villa El Roble", "Hoy, 15:00 hrs", 28, 40, "En curso",
                    "Prof. Mariano Acevedo"),
            new TallerDto("T-102", "Taller de Huertos Comunitarios Sostenibles",
                    "Sede Vecinal Los Pinos", "Mañana, 10:30 hrs", 15, 25, "Activo",
                    "Prof. Mariano Acevedo"),
            new TallerDto("T-103", "Primeros Auxilios y Prevención Barrial",
                    "Colegio Polivalente San Bernardo", "24 Oct, 16:00 hrs", 35, 35, "Finalizado",
                    "Prof. Álvaro León")));

    @GetMapping
    public ResponseEntity<Map<String, Object>> listar() {
        return ResponseEntity.ok(Map.of(
                "exito", true,
                "mensaje", "Listado de talleres obtenido desde el backend",
                "datos", talleres));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crear(@RequestBody TallerDto body) {
        String id = (body.id() != null && !body.id().isBlank()) ? body.id() : "T-" + (System.currentTimeMillis() % 10000);
        TallerDto nuevo = new TallerDto(
                id,
                body.name(),
                body.location(),
                body.date(),
                body.attendeesCount(),
                body.capacity() > 0 ? body.capacity() : 30,
                body.status() != null ? body.status() : "Activo",
                body.coordinatorName() != null ? body.coordinatorName() : "Prof. Mariano Acevedo");
        talleres.add(0, nuevo);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "exito", true,
                "mensaje", "Taller registrado exitosamente en la base de datos",
                "datos", nuevo,
                "talleres", talleres));
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> actualizar(@RequestBody TallerDto body) {
        for (int i = 0; i < talleres.size(); i++) {
            if (talleres.get(i).id().equals(body.id())) {
                talleres.set(i, body);
                break;
            }
        }
        return ResponseEntity.ok(Map.of(
                "exito", true,
                "mensaje", "Taller actualizado en la base de datos",
                "datos", body,
                "talleres", talleres));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> eliminar(@RequestParam("id") String id) {
        talleres.removeIf(t -> t.id().equals(id));
        return ResponseEntity.ok(Map.of(
                "exito", true,
                "mensaje", "Taller eliminado de la base de datos",
                "talleres", talleres));
    }
}
