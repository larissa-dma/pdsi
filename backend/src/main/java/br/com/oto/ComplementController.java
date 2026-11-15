package br.com.oto;

import static org.springframework.http.HttpStatus.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/secretaria/inventario/registros/{registroId}")
public class ComplementController {
  private final JdbcTemplate db;

  public ComplementController(JdbcTemplate db) {
    this.db = db;
  }

  void exists(long id) {
    if (!Boolean.TRUE.equals(
        db.queryForObject(
            "SELECT EXISTS(SELECT 1 FROM registro_inventario WHERE id=?)", Boolean.class, id)))
      throw new ResponseStatusException(NOT_FOUND);
  }

  record Channel(
      @NotNull @Pattern(regexp = "telefone|email|site|rede_social|outro") String tipo,
      @NotBlank @Size(max = 2000) String valor,
      @Size(max = 200) String responsavel,
      boolean publico) {}

  record Activity(@NotBlank @Size(max = 30) String cnae, @Size(max = 2000) String descricao) {}

  record Cadastur(
      @Min(1) @Max(3) Integer obrigatoriedade,
      Boolean registrado,
      @Size(max = 200) String numero,
      LocalDate vencimento,
      @Size(max = 2000) String observacao) {}

  @GetMapping("/complementos")
  public Map<String, Object> get(@PathVariable long registroId) {
    exists(registroId);
    return Map.of(
        "canais",
        db.queryForList(
            "SELECT * FROM inventario_canal WHERE registro_id=? ORDER BY id", registroId),
        "atividades",
        db.queryForList(
            "SELECT * FROM inventario_atividade WHERE registro_id=? ORDER BY id", registroId),
        "cadastur",
        db.queryForList(
            "SELECT * FROM inventario_cadastur WHERE registro_id=? ORDER BY id", registroId));
  }

  @PostMapping("/canais")
  @ResponseStatus(CREATED)
  public Map<String, Object> channel(@PathVariable long registroId, @Valid @RequestBody Channel c) {
    exists(registroId);
    return db.queryForMap(
        "INSERT INTO inventario_canal(registro_id,tipo,valor,responsavel,publico) VALUES"
            + " (?,?,?,?,?) RETURNING *",
        registroId,
        c.tipo(),
        c.valor(),
        c.responsavel(),
        c.publico());
  }

  @PostMapping("/atividades")
  @ResponseStatus(CREATED)
  public Map<String, Object> activity(
      @PathVariable long registroId, @Valid @RequestBody Activity a) {
    exists(registroId);
    return db.queryForMap(
        "INSERT INTO inventario_atividade(registro_id,cnae,descricao) VALUES (?,?,?) RETURNING *",
        registroId,
        a.cnae(),
        a.descricao());
  }

  @PostMapping("/cadastur")
  @ResponseStatus(CREATED)
  public Map<String, Object> cadastur(
      @PathVariable long registroId, @Valid @RequestBody Cadastur c) {
    exists(registroId);
    return db.queryForMap(
        "INSERT INTO"
            + " inventario_cadastur(registro_id,obrigatoriedade,registrado,numero,vencimento,observacao)"
            + " VALUES (?,?,?,?,?,?) RETURNING *",
        registroId,
        c.obrigatoriedade(),
        c.registrado(),
        c.numero(),
        c.vencimento(),
        c.observacao());
  }

  @DeleteMapping("/{tipo}/{id}")
  public void remove(
      @PathVariable long registroId, @PathVariable long id, @PathVariable String tipo) {
    String table =
        switch (tipo) {
          case "canais" -> "inventario_canal";
          case "atividades" -> "inventario_atividade";
          case "cadastur" -> "inventario_cadastur";
          default -> throw new ResponseStatusException(BAD_REQUEST);
        };
    if (db.update("DELETE FROM " + table + " WHERE id=? AND registro_id=?", id, registroId) == 0)
      throw new ResponseStatusException(NOT_FOUND);
  }
}
