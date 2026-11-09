package br.com.oto;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.*;
import java.util.Map;
import org.junit.jupiter.api.Test;

class FormValidationTest {
  final ObjectMapper json = new ObjectMapper();

  JsonNode questions() throws Exception {
    return json.readTree(
        "[{\"chave\":\"ocupacao\",\"tipo\":\"percentual\",\"obrigatoria\":true},{\"chave\":\"acessivel\",\"tipo\":\"booleano\",\"obrigatoria\":true}]");
  }

  @Test
  void preservesZeroAndFalse() throws Exception {
    assertDoesNotThrow(
        () ->
            FormController.validate(
                questions(),
                Map.of("ocupacao", json.valueToTree(0), "acessivel", json.valueToTree(false)),
                true));
  }

  @Test
  void draftAllowsMissingRequired() throws Exception {
    assertDoesNotThrow(() -> FormController.validate(questions(), Map.of(), false));
  }

  @Test
  void submissionRequiresAnswers() throws Exception {
    assertThrows(
        org.springframework.web.server.ResponseStatusException.class,
        () -> FormController.validate(questions(), Map.of(), true));
  }

  @Test
  void rejectsOutOfRange() throws Exception {
    assertThrows(
        org.springframework.web.server.ResponseStatusException.class,
        () ->
            FormController.validate(questions(), Map.of("ocupacao", json.valueToTree(101)), false));
  }

  @Test
  void rejectsUnknownQuestion() throws Exception {
    assertThrows(
        org.springframework.web.server.ResponseStatusException.class,
        () -> FormController.validate(questions(), Map.of("outra", json.valueToTree(1)), false));
  }

  @Test
  void rejectsStringAsNumber() throws Exception {
    assertThrows(
        org.springframework.web.server.ResponseStatusException.class,
        () ->
            FormController.validate(
                questions(), Map.of("ocupacao", json.valueToTree("75")), false));
  }
}
