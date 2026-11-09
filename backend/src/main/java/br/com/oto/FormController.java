package br.com.oto;

import static org.springframework.http.HttpStatus.*;

import com.fasterxml.jackson.databind.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class FormController {
  private final JdbcTemplate db;
  private final CurrentUser users;
  private final ObjectMapper json;

  public FormController(JdbcTemplate db, CurrentUser users, ObjectMapper json) {
    this.db = db;
    this.users = users;
    this.json = json;
  }

  record Pergunta(
      @NotBlank @Pattern(regexp = "[a-z][a-z0-9_]{0,49}") String chave,
      @NotBlank @Size(max = 300) String titulo,
      @NotNull @Pattern(regexp = "texto|inteiro|percentual|decimal|booleano") String tipo,
      boolean obrigatoria) {}

  record Formulario(
      @NotBlank @Size(max = 200) String titulo,
      @NotBlank @Size(max = 50) String referencia,
      @NotNull @FutureOrPresent LocalDate prazo,
      @NotEmpty @Size(max = 100) List<@Valid Pergunta> perguntas) {}

  record Resposta(@NotNull Map<String, JsonNode> respostas) {}

  String encode(Object v) {
    try {
      return json.writeValueAsString(v);
    } catch (Exception ex) {
      throw new ResponseStatusException(BAD_REQUEST);
    }
  }

  JsonNode decode(Object v) {
    try {
      return json.readTree(v.toString());
    } catch (Exception ex) {
      throw new IllegalStateException(ex);
    }
  }

  Map<String, Object> normalize(Map<String, Object> r) {
    for (String key : List.of("perguntas", "respostas")) {
      if (r.get(key) != null) r.put(key, decode(r.get(key)));
    }
    return r;
  }

  @PostMapping("/secretaria/formularios")
  @ResponseStatus(CREATED)
  public Map<String, Object> create(@Valid @RequestBody Formulario f) {
    if (f.perguntas().stream().map(Pergunta::chave).distinct().count() != f.perguntas().size())
      throw new ResponseStatusException(BAD_REQUEST, "Chaves de perguntas repetidas");
    return normalize(
        db.queryForMap(
            "INSERT INTO formulario(titulo,referencia,prazo,perguntas) VALUES (?,?,?,?::jsonb)"
                + " RETURNING *",
            f.titulo(),
            f.referencia(),
            f.prazo(),
            encode(f.perguntas())));
  }

  @GetMapping("/secretaria/formularios")
  public List<Map<String, Object>> all(@RequestParam(defaultValue = "0") int pagina) {
    if (pagina < 0 || pagina > 1000000) throw new ResponseStatusException(BAD_REQUEST);
    return db
        .queryForList("SELECT * FROM formulario ORDER BY id DESC LIMIT 50 OFFSET ?", pagina * 50)
        .stream()
        .map(this::normalize)
        .toList();
  }

  @GetMapping("/secretaria/formularios/{id}/respostas")
  public List<Map<String, Object>> submitted(
      @PathVariable long id, @RequestParam(defaultValue = "0") int pagina) {
    if (pagina < 0 || pagina > 1000000) throw new ResponseStatusException(BAD_REQUEST);
    return db
        .queryForList(
            "SELECT * FROM formulario_resposta WHERE formulario_id=? ORDER BY id LIMIT 50 OFFSET ?",
            id,
            pagina * 50)
        .stream()
        .map(this::normalize)
        .toList();
  }

  @GetMapping("/formularios")
  public List<Map<String, Object>> mine(Principal p, @RequestParam(defaultValue = "0") int pagina) {
    long establishment = users.establishment(p);
    if (pagina < 0 || pagina > 1000000) throw new ResponseStatusException(BAD_REQUEST);
    return db
        .queryForList(
            "SELECT f.*,coalesce(r.status,'pendente') AS status,r.respostas,r.enviado_em FROM"
                + " formulario f LEFT JOIN formulario_resposta r ON r.formulario_id=f.id AND"
                + " r.estabelecimento_id=? ORDER BY f.id DESC LIMIT 50 OFFSET ?",
            establishment,
            pagina * 50)
        .stream()
        .map(this::normalize)
        .toList();
  }

  Map<String, Object> form(long id) {
    var rows = db.queryForList("SELECT * FROM formulario WHERE id=?", id);
    if (rows.isEmpty()) throw new ResponseStatusException(NOT_FOUND);
    return rows.getFirst();
  }

  @GetMapping("/formularios/{id}")
  public Map<String, Object> detail(@PathVariable long id, Principal p) {
    long establishment = users.establishment(p);
    var f = normalize(form(id));
    f.put(
        "minhaResposta",
        db
            .queryForList(
                "SELECT * FROM formulario_resposta WHERE formulario_id=? AND estabelecimento_id=?",
                id,
                establishment)
            .stream()
            .map(this::normalize)
            .toList());
    return f;
  }

  @PutMapping("/formularios/{id}/resposta")
  @Transactional
  public Map<String, Object> save(
      @PathVariable long id, @Valid @RequestBody Resposta answer, Principal p) {
    long establishment = users.establishment(p);
    var f = form(id);
    checkDeadline(f);
    validate(decode(f.get("perguntas")), answer.respostas(), false);
    var rows =
        db.queryForList(
            "INSERT INTO formulario_resposta(formulario_id,estabelecimento_id,respostas) VALUES"
                + " (?,?,?::jsonb) ON CONFLICT(formulario_id,estabelecimento_id) DO UPDATE SET"
                + " respostas=EXCLUDED.respostas,atualizado_em=now() WHERE"
                + " formulario_resposta.status='rascunho' RETURNING *",
            id,
            establishment,
            encode(answer.respostas()));
    if (rows.isEmpty()) throw new ResponseStatusException(CONFLICT, "Resposta já enviada");
    return normalize(rows.getFirst());
  }

  @PostMapping("/formularios/{id}/enviar")
  @Transactional
  public Map<String, Object> submit(@PathVariable long id, Principal p) {
    long establishment = users.establishment(p);
    var f = form(id);
    checkDeadline(f);
    var rows =
        db.queryForList(
            "SELECT * FROM formulario_resposta WHERE formulario_id=? AND estabelecimento_id=? FOR"
                + " UPDATE",
            id,
            establishment);
    if (rows.isEmpty())
      throw new ResponseStatusException(BAD_REQUEST, "Salve as respostas antes de enviar");
    var r = rows.getFirst();
    if ("enviado".equals(r.get("status")))
      throw new ResponseStatusException(CONFLICT, "Resposta já enviada");
    var values =
        json.convertValue(
            decode(r.get("respostas")),
            new com.fasterxml.jackson.core.type.TypeReference<Map<String, JsonNode>>() {});
    validate(decode(f.get("perguntas")), values, true);
    return normalize(
        db.queryForMap(
            "UPDATE formulario_resposta SET status='enviado',enviado_em=now(),atualizado_em=now()"
                + " WHERE id=? RETURNING *",
            r.get("id")));
  }

  void checkDeadline(Map<String, Object> f) {
    var today =
        db.queryForObject(
            "SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date", LocalDate.class);
    if (((java.sql.Date) f.get("prazo")).toLocalDate().isBefore(today))
      throw new ResponseStatusException(CONFLICT, "Prazo encerrado");
  }

  static void validate(JsonNode questions, Map<String, JsonNode> answers, boolean submitting) {
    Set<String> allowed = new HashSet<>();
    for (JsonNode q : questions) {
      String key = q.get("chave").asText();
      allowed.add(key);
      JsonNode v = answers.get(key);
      if (v == null || v.isNull() || (v.isTextual() && v.asText().isBlank())) {
        if (submitting && q.get("obrigatoria").asBoolean())
          throw new ResponseStatusException(BAD_REQUEST, "Pergunta obrigatória: " + key);
        continue;
      }
      boolean valid =
          switch (q.get("tipo").asText()) {
            case "texto" -> v.isTextual() && v.asText().length() <= 10000;
            case "booleano" -> v.isBoolean();
            case "inteiro" -> v.isIntegralNumber() && v.canConvertToInt() && v.intValue() >= 0;
            case "decimal" -> v.isNumber() && v.decimalValue().compareTo(BigDecimal.ZERO) >= 0;
            case "percentual" ->
                v.isNumber()
                    && v.decimalValue().compareTo(BigDecimal.ZERO) >= 0
                    && v.decimalValue().compareTo(new BigDecimal("100")) <= 0;
            default -> false;
          };
      if (!valid) throw new ResponseStatusException(BAD_REQUEST, "Valor inválido: " + key);
    }
    if (!allowed.containsAll(answers.keySet()))
      throw new ResponseStatusException(BAD_REQUEST, "Pergunta desconhecida");
  }
}
