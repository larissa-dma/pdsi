package br.com.oto;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/secretaria")
public class ManagementController {
  private final JdbcTemplate db;

  public ManagementController(JdbcTemplate db) {
    this.db = db;
  }

  @GetMapping("/painel")
  public Map<String, Object> dashboard() {
    return db.queryForMap(
        "SELECT (SELECT count(*) FROM registro_inventario) AS registros_inventario,(SELECT count(*)"
            + " FROM formulario) AS formularios,(SELECT count(*) FROM formulario_resposta WHERE"
            + " status='enviado') AS respostas_enviadas,(SELECT count(*) FROM importacao) AS"
            + " importacoes");
  }

  @GetMapping("/pesquisas")
  public List<Map<String, Object>> surveys() {
    return db.queryForList("SELECT * FROM conjunto_pesquisa ORDER BY nome");
  }

  @GetMapping("/importacoes")
  public List<Map<String, Object>> imports(@RequestParam(defaultValue = "0") int pagina) {
    if (pagina < 0 || pagina > 1000000) throw new ResponseStatusException(BAD_REQUEST);
    return db.queryForList(
        "SELECT * FROM importacao ORDER BY data_importacao DESC,id DESC LIMIT 50 OFFSET ?",
        pagina * 50);
  }

  @GetMapping("/importacoes/{id}/erros")
  public List<Map<String, Object>> errors(
      @PathVariable long id, @RequestParam(defaultValue = "0") int pagina) {
    if (pagina < 0 || pagina > 1000000) throw new ResponseStatusException(BAD_REQUEST);
    return db.queryForList(
        "SELECT * FROM erro_importacao WHERE lote_id=? ORDER BY linha,id LIMIT 50 OFFSET ?",
        id,
        pagina * 50);
  }

  @GetMapping("/indicadores")
  public List<Map<String, Object>> indicators() {
    return db.queryForList("SELECT * FROM indicador ORDER BY nome");
  }

  @GetMapping("/indicadores/{id}/observacoes")
  public List<Map<String, Object>> observations(
      @PathVariable long id, @RequestParam(defaultValue = "0") int pagina) {
    if (pagina < 0 || pagina > 1000000) throw new ResponseStatusException(BAD_REQUEST);
    return db.queryForList(
        "SELECT * FROM observacao_indicador WHERE indicador_id=? ORDER BY referencia,id LIMIT 50"
            + " OFFSET ?",
        id,
        pagina * 50);
  }
}
