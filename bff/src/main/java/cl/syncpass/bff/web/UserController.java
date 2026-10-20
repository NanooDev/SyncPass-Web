package cl.syncpass.bff.web;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Solo admin (el JWT debe traer el rol en el claim configurado). */
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping
    @PreAuthorize("hasRole('admin')")
    public List<UserDto> list() {
        return List.of(
                new UserDto("1", "admin@sync-pass.test", "admin"),
                new UserDto("2", "coordinador@sync-pass.test", "coordinator"),
                new UserDto("3", "voluntario@sync-pass.test", "volunteer"));
    }
}
