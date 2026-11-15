package br.com.oto;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ApiErrors {
  @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
  public org.springframework.http.ResponseEntity<Map<String, String>> domain(
      org.springframework.web.server.ResponseStatusException e) {
    return org.springframework.http.ResponseEntity.status(e.getStatusCode())
        .body(Map.of("erro", e.getReason() == null ? "Requisição não permitida" : e.getReason()));
  }

  @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
  @ResponseStatus(org.springframework.http.HttpStatus.PAYLOAD_TOO_LARGE)
  public Map<String, String> tooLarge() {
    return Map.of("erro", "Arquivo excede o limite de 10 MB");
  }

  @ExceptionHandler(org.springframework.jdbc.UncategorizedSQLException.class)
  @ResponseStatus(org.springframework.http.HttpStatus.BAD_REQUEST)
  public Map<String, String> typed() {
    return Map.of("erro", "Valor incompatível com o tipo do campo de inventário.");
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  @ResponseStatus(org.springframework.http.HttpStatus.CONFLICT)
  public Map<String, String> conflict() {
    return Map.of(
        "erro",
        "Dados duplicados ou relacionamento inválido. Confira os identificadores e valores.");
  }

  @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
  @ResponseStatus(org.springframework.http.HttpStatus.BAD_REQUEST)
  public Map<String, String> invalid() {
    return Map.of("erro", "Requisição inválida. Confira os campos obrigatórios, tipos e limites.");
  }
}
