package cl.syncpass.bff.service;

import java.util.List;
import java.util.Map;

import cl.syncpass.bff.config.SupabaseProperties;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

/**
 * Cliente HTTP hacia Supabase PostgREST para persistencia real en PostgreSQL.
 */
@Service
public class SupabaseGatewayService {

    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST_OF_MAPS =
            new ParameterizedTypeReference<>() {};

    private final SupabaseProperties props;
    private final RestClient restClient;

    public SupabaseGatewayService(SupabaseProperties props) {
        this.props = props;
        String baseUrl = (props.url() == null || props.url().isBlank())
                ? "https://nxbsqkpnkawbkdksmnym.supabase.co"
                : props.url();
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    private String requireKey() {
        if (props.key() == null || props.key().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "SUPABASE_KEY no configurada en el backend BFF");
        }
        return props.key();
    }

    public List<Map<String, Object>> select(String tableAndQuery) {
        String key = requireKey();
        List<Map<String, Object>> result = restClient.get()
                .uri("/rest/v1/" + tableAndQuery)
                .header("apikey", key)
                .header("Authorization", "Bearer " + key)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(LIST_OF_MAPS);
        return result == null ? List.of() : result;
    }

    public List<Map<String, Object>> insert(String tableAndQuery, Object payload, String preferHeader) {
        String key = requireKey();
        List<Map<String, Object>> result = restClient.post()
                .uri("/rest/v1/" + tableAndQuery)
                .header("apikey", key)
                .header("Authorization", "Bearer " + key)
                .header("Prefer", preferHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .body(LIST_OF_MAPS);
        return result == null ? List.of() : result;
    }

    public List<Map<String, Object>> patch(String tableAndQuery, Object payload) {
        String key = requireKey();
        List<Map<String, Object>> result = restClient.patch()
                .uri("/rest/v1/" + tableAndQuery)
                .header("apikey", key)
                .header("Authorization", "Bearer " + key)
                .header("Prefer", "return=representation")
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .body(LIST_OF_MAPS);
        return result == null ? List.of() : result;
    }

    public void delete(String tableAndQuery) {
        String key = requireKey();
        restClient.delete()
                .uri("/rest/v1/" + tableAndQuery)
                .header("apikey", key)
                .header("Authorization", "Bearer " + key)
                .retrieve()
                .toBodilessEntity();
    }
}
