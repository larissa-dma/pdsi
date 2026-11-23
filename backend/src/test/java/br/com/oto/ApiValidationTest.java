package br.com.oto;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** Validações da API de inventário, análises e contas, sem banco real. */
@WebMvcTest(
    controllers = {InventoryController.class, AnalysisController.class, AccountController.class},
    properties = "oto.frontend-origin=http://localhost:5173")
@Import(SecurityConfig.class)
@WithMockUser(roles = "SECRETARIA")
class ApiValidationTest {
  @Autowired MockMvc mvc;
  @MockitoBean JdbcTemplate db;
  @MockitoBean CurrentUser users;

  @BeforeEach
  void activeAccount() {
    when(db.queryForList(
            eq("SELECT ativo,versao_senha FROM usuario WHERE identificador=?"), any(Object.class)))
        .thenReturn(List.of(Map.of("ativo", true)));
  }

  static Object[] flat(Object[] arguments) {
    List<Object> out = new ArrayList<>();
    for (Object a : arguments)
      if (a instanceof Object[] many) out.addAll(Arrays.asList(many));
      else out.add(a);
    return out.toArray();
  }

  void post(String path, String body, int status) throws Exception {
    mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path)
                .with(csrf())
                .contentType("application/json")
                .content(body))
        .andExpect(status().is(status));
  }

  void put(String path, String body, int status) throws Exception {
    mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(path)
                .with(csrf())
                .contentType("application/json")
                .content(body))
        .andExpect(status().is(status));
  }

  // ---- Inventário ----

  @Test
  void createSavesCleanedName() throws Exception {
    AtomicReference<Object[]> saved = new AtomicReference<>();
    when(db.queryForMap(contains("INSERT INTO"), any(Object[].class)))
        .thenAnswer(
            inv -> {
              saved.set(flat(Arrays.copyOfRange(inv.getArguments(), 1, inv.getArguments().length)));
              return Map.of("id", 1L);
            });
    post(
        "/api/secretaria/inventario/registros",
        "{\"nome\":\"  Hotel   Sol \",\"endereco\":\" Rua  A, 10 \",\"tipoCadastro\":\"estabelecimento\"}",
        201);
    assertEquals("Hotel Sol", saved.get()[0]);
    assertEquals("Rua A, 10", saved.get()[1]);
  }

  @Test
  void createRequiresName() throws Exception {
    post("/api/secretaria/inventario/registros", "{\"tipoCadastro\":\"estabelecimento\"}", 400);
    post(
        "/api/secretaria/inventario/registros",
        "{\"nome\":\"   \",\"tipoCadastro\":\"estabelecimento\"}",
        400);
  }

  @Test
  void createRejectsUnknownRecordType() throws Exception {
    post(
        "/api/secretaria/inventario/registros",
        "{\"nome\":\"Hotel\",\"tipoCadastro\":\"hotel\"}",
        400);
  }

  @Test
  void createRejectsCoordinatesOutOfRange() throws Exception {
    post(
        "/api/secretaria/inventario/registros",
        "{\"nome\":\"Hotel\",\"tipoCadastro\":\"estabelecimento\",\"latitude\":95,\"longitude\":-48}",
        400);
  }

  @Test
  void createRequiresBothCoordinates() throws Exception {
    post(
        "/api/secretaria/inventario/registros",
        "{\"nome\":\"Hotel\",\"tipoCadastro\":\"estabelecimento\",\"latitude\":-20.7}",
        400);
  }

  @Test
  void linkRejectsDuplicateNameInSegment() throws Exception {
    when(db.queryForList(
            eq("SELECT nome FROM registro_inventario WHERE id=?"), eq(String.class), any(Object[].class)))
        .thenReturn(List.of("Hotel Sol"));
    when(db.queryForList(contains("v.segmento_id=? AND"), any(Object[].class)))
        .thenReturn(List.of(Map.of("id", 5L)));
    mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(
                    "/api/secretaria/inventario/registros/9/segmentos/1")
                .with(csrf()))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.erro").value(org.hamcrest.Matchers.containsString("cadastro 5")));
  }

  @Test
  void linkUnknownRecordIsNotFound() throws Exception {
    mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(
                    "/api/secretaria/inventario/registros/9/segmentos/1")
                .with(csrf()))
        .andExpect(status().isNotFound());
  }

  @Test
  void renameRejectsDuplicateNameInSegment() throws Exception {
    when(db.queryForList(contains("SELECT segmento_id FROM"), eq(Long.class), any(Object[].class)))
        .thenReturn(List.of(1L));
    when(db.queryForList(contains("v.segmento_id=? AND"), any(Object[].class)))
        .thenReturn(List.of(Map.of("id", 5L)));
    put(
        "/api/secretaria/inventario/registros/9",
        "{\"nome\":\"HOTEL SÓL\",\"tipoCadastro\":\"estabelecimento\"}",
        409);
  }

  // ---- Análises (dashboard) ----

  @Test
  void analysisRejectsInvertedPeriod() throws Exception {
    mvc.perform(get("/api/secretaria/analises/resumo?inicio=2026-12-01&fim=2026-01-01"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void analysisRejectsUnknownModality() throws Exception {
    mvc.perform(get("/api/secretaria/analises/resumo?tipo=realizado"))
        .andExpect(status().isBadRequest());
    mvc.perform(get("/api/secretaria/analises/ocupacao?tipo=realizado"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void analysisRejectsNegativePage() throws Exception {
    mvc.perform(get("/api/secretaria/analises/ocupacao?pagina=-1"))
        .andExpect(status().isBadRequest());
  }

  // ---- Contas ----

  @Test
  void resetRequiresTwelveCharacters() throws Exception {
    put("/api/secretaria/usuarios/2/senha", "{\"novaSenha\":\"curta\"}", 400);
  }

  @Test
  void resetRejectsMoreThan72Bytes() throws Exception {
    // 40 caracteres "ç" ocupam 80 bytes em UTF-8.
    put("/api/secretaria/usuarios/2/senha", "{\"novaSenha\":\"" + "ç".repeat(40) + "\"}", 400);
  }

  @Test
  void cannotDeactivateOwnAccount() throws Exception {
    when(users.get(any())).thenReturn(Map.of("id", 2L));
    put("/api/secretaria/usuarios/2/estado", "{\"ativo\":false}", 400);
  }
}
