package br.com.oto;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

/** Regras de qualidade da importação (QUAL-01) que dependem do banco, com um banco falso. */
class ImportQualityTest {
  /** Banco em memória: segmento "hospedagem" (id 1), nomes já cadastrados e ocupações já gravadas. */
  static class FakeDb extends JdbcTemplate {
    final Map<String, Long> existingNames = new HashMap<>();
    final Set<String> existingOccupancy = new HashSet<>();
    final List<String> statements = new ArrayList<>();

    @Override
    public List<Map<String, Object>> queryForList(String sql, Object... args) {
      statements.add(sql);
      if (sql.contains("FROM inventario_segmento"))
        return "hospedagem".equals(args[0]) ? List.of(Map.of("id", 1L)) : List.of();
      if (sql.contains("FROM registro_inventario r JOIN inventario_vinculo_segmento")) {
        Long id = existingNames.get((String) args[0]);
        return id == null ? List.of() : List.of(Map.of("id", id));
      }
      if (sql.contains("FROM ocupacao_fluxo") || sql.contains("FROM diaria_media"))
        return existingOccupancy.contains(args[0] + ":" + args[1])
            ? List.of(Map.of("lote_id", 7L))
            : List.of();
      throw new AssertionError("Consulta inesperada: " + sql);
    }

    @Override
    public <T> T queryForObject(String sql, Class<T> type, Object... args) {
      // Todo estabelecimento consultado existe.
      return type.cast(Boolean.TRUE);
    }
  }

  final FakeDb db = new FakeDb();
  final ObjectMapper json = new ObjectMapper();
  final ImportController imports = new ImportController(db, null, json);

  Map<String, Object> inventory(String name, String segment) {
    return imports.normalize(
        "inventario", Map.of("nome", name, "segmento", segment, "endereco", "  Rua   A  "));
  }

  @Test
  void cleansNameAndAcceptsSegmentInAnyCase() {
    var row = inventory("  Hotel   Sol  ", " Hospedagem ");
    assertEquals("Hotel Sol", row.get("nome"));
    assertEquals("Rua A", row.get("endereco"));
    assertEquals(1L, row.get("segmento_id"));
  }

  @Test
  void unknownSegmentNamesTheCode() {
    var error =
        assertThrows(IllegalArgumentException.class, () -> inventory("Hotel Sol", "hotelaria"));
    assertTrue(error.getMessage().contains("hotelaria"), error.getMessage());
  }

  @Test
  void requiresName() {
    assertThrows(IllegalArgumentException.class, () -> inventory("   ", "hospedagem"));
  }

  @Test
  void rejectsNameAlreadyInSegmentIgnoringAccentsAndCase() {
    db.existingNames.put(Names.key("Pousada São João"), 42L);
    var error =
        assertThrows(
            IllegalArgumentException.class, () -> inventory("POUSADA  SAO JOAO", "hospedagem"));
    assertTrue(error.getMessage().contains("42"), error.getMessage());
  }

  @Test
  void acceptsModalityInUppercase() {
    var row =
        imports.normalize(
            "ocupacao",
            Map.of("mes_referencia", "2026-11", "tipo_dado", "CONSOLIDADO", "fluxo_pessoas", "5"));
    assertEquals("consolidado", row.get("tipo_dado"));
  }

  @Test
  void rejectsOccupancyAlreadyImportedForEstablishment() {
    db.existingOccupancy.add("1011:2026-11-01");
    var row =
        Map.of(
            "mes_referencia",
            "2026-11",
            "tipo_dado",
            "consolidado",
            "ocupacao_percentual",
            "70",
            "estabelecimento_id",
            "1011");
    var error =
        assertThrows(IllegalArgumentException.class, () -> imports.normalize("ocupacao", row));
    assertTrue(error.getMessage().contains("lote 7"), error.getMessage());
  }

  @Test
  void rejectsDailyRateAlreadyImportedForEstablishment() {
    db.existingOccupancy.add("1011:2026-11-01");
    assertThrows(
        IllegalArgumentException.class,
        () ->
            imports.normalize(
                "diaria",
                Map.of("mes_referencia", "2026-11", "valor", "250", "estabelecimento_id", "1011")));
  }

  @Test
  void municipalOccupancyWithoutEstablishmentIsNotCheckedAgainstHistory() {
    db.existingOccupancy.add("null:2026-11-01");
    assertDoesNotThrow(
        () ->
            imports.normalize(
                "ocupacao",
                Map.of("mes_referencia", "2026-11", "tipo_dado", "consolidado", "fluxo_pessoas", "1")));
  }

  @Test
  void flagsSameNameTwiceInFileEvenWithDifferentSpelling() throws Exception {
    var stage =
        Map.<String, Object>of(
            "colunas",
            json.writeValueAsString(List.of("nome", "segmento")),
            "linhas",
            json.writeValueAsString(
                List.of(
                    Map.of("nome", "Hotel Sol", "segmento", "hospedagem"),
                    Map.of("nome", "HOTEL  SÓL", "segmento", "Hospedagem"),
                    Map.of("nome", "Hotel Lua", "segmento", "hospedagem"))));
    var rows =
        imports.validateRows(
            stage,
            new ImportController.Mapping(
                "inventario", "2026-11", Map.of("nome", "nome", "segmento", "segmento")));
    assertEquals(List.of(true, false, true), rows.stream().map(r -> r.get("valida")).toList());
    assertEquals("Linha duplicada no arquivo", rows.get(1).get("erro"));
    assertEquals(3, rows.get(1).get("linha"));
  }

  @Test
  void reportsInvalidNumberInPlainLanguage() throws Exception {
    var stage =
        Map.<String, Object>of(
            "colunas",
            json.writeValueAsString(List.of("mes", "valor")),
            "linhas",
            json.writeValueAsString(List.of(Map.of("mes", "2026-11", "valor", "1.234,50"))));
    var rows =
        imports.validateRows(
            stage,
            new ImportController.Mapping(
                "diaria", "2026-11", Map.of("mes_referencia", "mes", "valor", "valor")));
    assertEquals(false, rows.getFirst().get("valida"));
    assertEquals(
        "Número inválido; use números sem separador de milhar", rows.getFirst().get("erro"));
  }
}
