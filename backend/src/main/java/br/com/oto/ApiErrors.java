package br.com.oto;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ApiErrors {
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
