package br.com.oto;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.junit.jupiter.api.Test;

class ImportValidationTest {
  final ImportController imports = new ImportController(null, null, new ObjectMapper());

  @Test
  void preservesMissingOccupancyAndZeroFlow() {
    var row =
        imports.normalize(
            "ocupacao",
            Map.of("mes_referencia", "2026-11", "tipo_dado", "consolidado", "fluxo_pessoas", "0"));
    assertNull(row.get("ocupacao_percentual"));
    assertEquals(0, row.get("fluxo_pessoas"));
    assertEquals("2026-11-01", row.get("mes_referencia"));
  }

  @Test
  void rejectsPercentAboveHundred() {
    assertThrows(
        IllegalArgumentException.class,
        () ->
            imports.normalize(
                "ocupacao",
                Map.of(
                    "mes_referencia",
                    "2026-11",
                    "tipo_dado",
                    "consolidado",
                    "ocupacao_percentual",
                    "101")));
  }

  @Test
  void rejectsFractionalPeople() {
    assertThrows(
        IllegalArgumentException.class,
        () ->
            imports.normalize(
                "ocupacao",
                Map.of(
                    "mes_referencia",
                    "2026-11",
                    "tipo_dado",
                    "consolidado",
                    "fluxo_pessoas",
                    "1.5")));
  }

  @Test
  void requiresFirstDayOfMonth() {
    assertThrows(
        IllegalArgumentException.class,
        () -> ImportController.month(Map.of("mes_referencia", "2026-11-15")));
  }

  @Test
  void rejectsDuplicateHeaders() {
    assertThrows(
        IllegalArgumentException.class,
        () -> ImportController.validateHeaders(List.of("nome", "nome")));
  }

  @Test
  void rejectsEmptyHeader() {
    assertThrows(
        IllegalArgumentException.class,
        () -> ImportController.validateHeaders(List.of("nome", "")));
  }

  @Test
  void rejectsUnknownModality() {
    assertThrows(
        IllegalArgumentException.class,
        () ->
            imports.normalize(
                "ocupacao",
                Map.of(
                    "mes_referencia", "2026-11", "tipo_dado", "realizado", "fluxo_pessoas", "1")));
  }

  @Test
  void missingPriceIsNotZero() {
    assertThrows(
        IllegalArgumentException.class,
        () -> imports.normalize("diaria", Map.of("mes_referencia", "2026-11")));
  }

  @Test
  void csvNeutralizesFormula() {
    assertEquals("\"'=SUM(1,2)\"", ReportController.csv("=SUM(1,2)"));
    assertEquals("\"a\"\"b\"", ReportController.csv("a\"b"));
  }

  @Test
  void reportRejectsUnknownDataset() {
    assertThrows(
        org.springframework.web.server.ResponseStatusException.class,
        () -> ReportController.query("usuario; DROP TABLE usuario"));
  }
}
