package cl.syncpass.bff.web;

import java.util.List;
import java.util.Map;

import cl.syncpass.bff.service.SupabaseGatewayService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    SupabaseGatewayService supabase;

    @Value("${auth0.roles-claim}")
    String rolesClaim;

    @Test
    void sinTokenResponde401() throws Exception {
        mockMvc.perform(get("/api/users")).andExpect(status().isUnauthorized());
    }

    @Test
    void sinRolAdminResponde403() throws Exception {
        mockMvc.perform(get("/api/users")
                        .with(jwt().jwt(jwt -> jwt.claim(rolesClaim, List.of("volunteer")))))
                .andExpect(status().isForbidden());
    }

    @Test
    void conRolAdminConsultaSupabase() throws Exception {
        when(supabase.select(anyString())).thenReturn(List.of(
                Map.of("id_usuario", "1", "correo", "admin@duocuc.cl", "rol", "administrador"),
                Map.of("id_usuario", "2", "correo", "docente@duocuc.cl", "rol", "docente"),
                Map.of("id_usuario", "3", "correo", "voluntario@duocuc.cl", "rol", "estudiante_voluntario")));

        mockMvc.perform(get("/api/users")
                        .with(jwt().jwt(jwt -> jwt.claim(rolesClaim, List.of("admin")))
                                .authorities(new SimpleGrantedAuthority("ROLE_admin"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].email").value("admin@duocuc.cl"))
                .andExpect(jsonPath("$[0].role").value("admin"));
    }
}
