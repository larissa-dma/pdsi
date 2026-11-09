package br.com.oto;

import static org.springframework.http.HttpStatus.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/secretaria/inventario")
public class InventoryController {
  private final JdbcTemplate db;

  public InventoryController(JdbcTemplate db) {
    this.db = db;
  }

  @GetMapping("/segmentos")
  public List<Map<String, Object>> segments() {
    return db.queryForList("SELECT * FROM inventario_segmento ORDER BY nome");
  }

  @GetMapping("/campos")
  public List<Map<String, Object>> fields(@RequestParam long segmentoId) {
    return db.queryForList(
        "SELECT"
            + " id,chave_tecnica,grupo_original,campo_original,tipo_logico,obrigatorio,regra_tratamento"
            + " FROM inventario_campo WHERE segmento_id=? AND NOT auxiliar ORDER BY id",
        segmentoId);
  }

  @GetMapping("/registros")
  public List<Map<String, Object>> list(
      @RequestParam(defaultValue = "") String busca, @RequestParam(defaultValue = "0") int pagina) {
    if (pagina < 0 || pagina > 1000000 || busca.length() > 200)
      throw new ResponseStatusException(BAD_REQUEST);
    return db.queryForList(
        "SELECT * FROM registro_inventario WHERE nome ILIKE ? ORDER BY id LIMIT 50 OFFSET ?",
        "%" + busca + "%",
        pagina * 50);
  }

  @GetMapping("/registros/{id}")
  public Map<String, Object> detail(@PathVariable long id) {
    var rows = db.queryForList("SELECT * FROM registro_inventario WHERE id=?", id);
    if (rows.isEmpty()) throw new ResponseStatusException(NOT_FOUND);
    var r = rows.getFirst();
    r.put(
        "segmentos",
        db.queryForList(
            "SELECT v.id AS vinculo_id,s.id,s.codigo,s.nome FROM inventario_vinculo_segmento v JOIN"
                + " inventario_segmento s ON s.id=v.segmento_id WHERE v.registro_id=?",
            id));
    return r;
  }

  record Registro(
      @NotBlank @Size(max = 200) String nome,
      @Size(max = 255) String endereco,
      @Size(max = 120) String bairro,
      @NotNull @Pattern(regexp = "estabelecimento|profissional|equipamento_publico|indefinido")
          String tipoCadastro,
      @DecimalMin("-90") @DecimalMax("90") BigDecimal latitude,
      @DecimalMin("-180") @DecimalMax("180") BigDecimal longitude) {}

  @PostMapping("/registros")
  @ResponseStatus(CREATED)
  public Map<String, Object> create(@Valid @RequestBody Registro r) {
    if ((r.latitude() == null) != (r.longitude() == null))
      throw new ResponseStatusException(BAD_REQUEST, "Informe as duas coordenadas");
    return db.queryForMap(
        "INSERT INTO registro_inventario(nome,endereco,bairro,tipo_cadastro,latitude,longitude)"
            + " VALUES (?,?,?,?,?,?) RETURNING *",
        r.nome(),
        r.endereco(),
        r.bairro(),
        r.tipoCadastro(),
        r.latitude(),
        r.longitude());
  }

  @PutMapping("/registros/{id}/segmentos/{segmentoId}")
  public Map<String, Object> link(@PathVariable long id, @PathVariable long segmentoId) {
    return db.queryForMap(
        "INSERT INTO inventario_vinculo_segmento(registro_id,segmento_id) VALUES (?,?) ON"
            + " CONFLICT(registro_id,segmento_id) DO UPDATE SET registro_id=EXCLUDED.registro_id"
            + " RETURNING *",
        id,
        segmentoId);
  }

  @PutMapping("/registros/{id}")
  public Map<String, Object> update(@PathVariable long id, @Valid @RequestBody Registro r) {
    if ((r.latitude() == null) != (r.longitude() == null))
      throw new ResponseStatusException(BAD_REQUEST, "Informe as duas coordenadas");
    var rows =
        db.queryForList(
            "UPDATE registro_inventario SET"
                + " nome=?,endereco=?,bairro=?,tipo_cadastro=?,latitude=?,longitude=?,data_ultima_revisao=now()"
                + " WHERE id=? RETURNING *",
            r.nome(),
            r.endereco(),
            r.bairro(),
            r.tipoCadastro(),
            r.latitude(),
            r.longitude(),
            id);
    if (rows.isEmpty()) throw new ResponseStatusException(NOT_FOUND);
    return rows.getFirst();
  }

  record Valor(
      @Size(max = 10000) String valorTexto,
      @Min(0) Integer valorInteiro,
      BigDecimal valorDecimal,
      Boolean valorBooleano,
      LocalDate valorData,
      @Min(1000) @Max(9999) Integer valorAno,
      @Size(max = 200) List<@Size(max = 500) String> valorLista,
      @DecimalMin("-90") @DecimalMax("90") BigDecimal latitude,
      @DecimalMin("-180") @DecimalMax("180") BigDecimal longitude,
      @Size(max = 10000) String textoOriginal,
      @Size(max = 10000) String observacao) {}

  @PutMapping("/vinculos/{vinculoId}/respostas/{campoId}")
  public Map<String, Object> answer(
      @PathVariable long vinculoId, @PathVariable long campoId, @Valid @RequestBody Valor v) {
    if ((v.latitude() == null) != (v.longitude() == null))
      throw new ResponseStatusException(BAD_REQUEST, "Informe as duas coordenadas");
    var rows =
        db.queryForList(
            "SELECT c.tipo_logico FROM inventario_campo c JOIN inventario_vinculo_segmento v ON"
                + " v.segmento_id=c.segmento_id WHERE c.id=? AND v.id=?",
            campoId,
            vinculoId);
    if (rows.isEmpty())
      throw new ResponseStatusException(BAD_REQUEST, "Campo não pertence ao vínculo");
    if ("percentual".equals(rows.getFirst().get("tipo_logico"))
        && v.valorDecimal() != null
        && (v.valorDecimal().signum() < 0 || v.valorDecimal().compareTo(new BigDecimal("100")) > 0))
      throw new ResponseStatusException(BAD_REQUEST, "Percentual deve estar entre 0 e 100");
    return db.execute(
        (java.sql.Connection connection) -> {
          try (var stmt =
              connection.prepareStatement(
                  "INSERT INTO"
                      + " inventario_resposta(vinculo_id,campo_id,valor_texto,valor_inteiro,valor_decimal,valor_booleano,valor_data,valor_ano,valor_lista,latitude,longitude,texto_original,observacao)"
                      + " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(vinculo_id,campo_id) DO"
                      + " UPDATE SET"
                      + " valor_texto=EXCLUDED.valor_texto,valor_inteiro=EXCLUDED.valor_inteiro,valor_decimal=EXCLUDED.valor_decimal,valor_booleano=EXCLUDED.valor_booleano,valor_data=EXCLUDED.valor_data,valor_ano=EXCLUDED.valor_ano,valor_lista=EXCLUDED.valor_lista,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,texto_original=EXCLUDED.texto_original,observacao=EXCLUDED.observacao,situacao_validacao='pendente'"
                      + " RETURNING id,vinculo_id,campo_id")) {
            Object[] values = {
              vinculoId,
              campoId,
              v.valorTexto(),
              v.valorInteiro(),
              v.valorDecimal(),
              v.valorBooleano(),
              v.valorData(),
              v.valorAno(),
              v.valorLista() == null
                  ? null
                  : connection.createArrayOf("text", v.valorLista().toArray()),
              v.latitude(),
              v.longitude(),
              v.textoOriginal(),
              v.observacao()
            };
            for (int i = 0; i < values.length; i++) stmt.setObject(i + 1, values[i]);
            try (var result = stmt.executeQuery()) {
              result.next();
              return Map.<String, Object>of(
                  "id",
                  result.getLong(1),
                  "vinculo_id",
                  result.getLong(2),
                  "campo_id",
                  result.getLong(3));
            }
          }
        });
  }

  @GetMapping("/registros/{id}/respostas")
  public List<Map<String, Object>> answers(@PathVariable long id) {
    detail(id);
    return db
        .queryForList(
            "SELECT r.*,to_json(r.valor_lista)::text AS lista_json FROM inventario_resposta r JOIN"
                + " inventario_vinculo_segmento v ON v.id=r.vinculo_id WHERE v.registro_id=? ORDER"
                + " BY r.campo_id",
            id)
        .stream()
        .map(
            r -> {
              r.remove("valor_lista");
              Object raw = r.remove("lista_json");
              try {
                r.put(
                    "valor_lista",
                    raw == null
                        ? null
                        : new com.fasterxml.jackson.databind.ObjectMapper()
                            .readTree(raw.toString()));
              } catch (Exception e) {
                throw new IllegalStateException(e);
              }
              return r;
            })
        .toList();
  }
}
