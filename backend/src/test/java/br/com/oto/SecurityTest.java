package br.com.oto;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
    controllers = {AccessController.class, ManagementController.class},
    properties = "oto.frontend-origin=http://localhost:5173")
@Import(SecurityConfig.class)
class SecurityTest {
  @Autowired MockMvc mvc;
  @MockitoBean JdbcTemplate db;
  @MockitoBean CurrentUser users;

  @Test
  void anonymousCannotRead() throws Exception {
    mvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
  }

  @Test
  void csrfIsPublic() throws Exception {
    mvc.perform(get("/api/csrf"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").isNotEmpty());
  }

  @Test
  @WithMockUser(roles = "HOSPEDAGEM")
  void lodgingCannotReadManagement() throws Exception {
    mvc.perform(get("/api/secretaria/painel")).andExpect(status().isForbidden());
  }

  @Test
  @WithMockUser(roles = "SECRETARIA")
  void writesRequireCsrf() throws Exception {
    mvc.perform(post("/api/secretaria/usuarios").contentType("application/json").content("{}"))
        .andExpect(status().isForbidden());
  }
}
