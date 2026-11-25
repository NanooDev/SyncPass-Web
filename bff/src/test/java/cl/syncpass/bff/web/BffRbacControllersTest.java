package cl.syncpass.bff.web;

import java.util.List;
import java.util.Map;

import cl.syncpass.bff.service.SupabaseGatewayService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class BffRbacControllersTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    SupabaseGatewayService supabase;

    @Test
    void endpointsProtegidosRechazanSinToken() throws Exception {
        mockMvc.perform(get("/api/talleres")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/asistencias")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/encuestas")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/notificar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"a@duocuc.cl\",\"message\":\"hola\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void voluntarioNoPuedeCrearTalleresNiEmitirPush() throws Exception {
        mockMvc.perform(post("/api/talleres")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_volunteer")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Taller Test\",\"location\":\"Sede\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/notificar")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_volunteer")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"a@duocuc.cl\",\"message\":\"hola\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void voluntarioPuedeSincronizarLoteAsistenciasEnSupabase() throws Exception {
        when(supabase.insert(anyString(), any(), anyString())).thenReturn(List.of(Map.of("id_registro", "r1")));

        mockMvc.perform(post("/api/asistencias/sync")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_volunteer")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"registros\":[{\"rut\":\"BEN-1\",\"nombreBeneficiario\":\"Ana\"}]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.exito").value(true))
                .andExpect(jsonPath("$.sincronizados").value(1));
    }
}
