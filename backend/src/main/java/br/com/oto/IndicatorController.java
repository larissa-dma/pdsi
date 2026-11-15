package br.com.oto;

import static org.springframework.http.HttpStatus.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/secretaria/indicadores")
public class IndicatorController {
  private final JdbcTemplate db;

  public IndicatorController(JdbcTemplate db) {
    this.db = db;
  }

  record Indicator(
      @NotBlank @Size(max = 200) String nome,
      @NotBlank @Size(max = 60) String unidade,
      @NotBlank @Size(max = 10000) String metodologia,
      @NotNull @Size(max = 17) List<@Min(1) @Max(17) Integer> ods) {}

  record Observation(
      @NotBlank @Size(max = 50) String referencia,
      @NotNull @Digits(integer = 14, fraction = 4) BigDecimal valor,
      @NotBlank @Size(max = 200) String fonte) {}

  @PostMapping
  @ResponseStatus(CREATED)
  @Transactional
  public Map<String, Object> create(@Valid @RequestBody Indicator i) {
    var result =
        db.queryForMap(
            "INSERT INTO indicador(nome,unidade,metodologia) VALUES (?,?,?) RETURNING *",
            i.nome(),
            i.unidade(),
            i.metodologia());
    for (Integer number : new HashSet<>(i.ods())) {
      Long ods =
          db.queryForObject(
              "INSERT INTO ods(numero,nome) VALUES (?,?) ON CONFLICT(numero) DO UPDATE SET"
                  + " numero=EXCLUDED.numero RETURNING id",
              Long.class,
              number,
              "ODS " + number);
      db.update(
          "INSERT INTO indicador_ods(indicador_id,ods_id,justificativa) VALUES (?,?,?)",
          result.get("id"),
          ods,
          "Associação cadastrada pela equipe; verificar metodologia");
    }
    return result;
  }

  @PostMapping("/{id}/observacoes")
  @ResponseStatus(CREATED)
  @Transactional
  public Map<String, Object> observation(@PathVariable long id, @Valid @RequestBody Observation o) {
    if (!Boolean.TRUE.equals(
        db.queryForObject("SELECT EXISTS(SELECT 1 FROM indicador WHERE id=?)", Boolean.class, id)))
      throw new ResponseStatusException(NOT_FOUND);
    Long source =
        db.queryForObject(
            "INSERT INTO fonte_dados(nome,descricao,situacao_carga) VALUES (?,?,'manual') RETURNING"
                + " id",
            Long.class,
            o.fonte(),
            "Fonte informada manualmente pela equipe");
    return db.queryForMap(
        "INSERT INTO observacao_indicador(indicador_id,fonte_id,referencia,valor) VALUES (?,?,?,?)"
            + " RETURNING *",
        id,
        source,
        o.referencia(),
        o.valor());
  }
}
