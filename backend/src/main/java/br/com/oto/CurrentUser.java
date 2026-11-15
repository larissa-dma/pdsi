package br.com.oto;

import static org.springframework.http.HttpStatus.*;

import java.security.Principal;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CurrentUser {
  private final JdbcTemplate db;

  public CurrentUser(JdbcTemplate db) {
    this.db = db;
  }

  public Map<String, Object> get(Principal p) {
    var rows =
        db.queryForList(
            "SELECT u.id,u.nome,u.identificador,u.perfil,u.estabelecimento_id,r.nome AS"
                + " estabelecimento_nome FROM usuario u LEFT JOIN registro_inventario r ON"
                + " r.id=u.estabelecimento_id WHERE u.identificador=? AND u.ativo=true",
            p.getName());
    if (rows.isEmpty()) throw new ResponseStatusException(UNAUTHORIZED);
    return rows.getFirst();
  }

  public long establishment(Principal p) {
    var id = get(p).get("estabelecimento_id");
    if (id == null) throw new ResponseStatusException(FORBIDDEN, "Conta sem hospedagem vinculada");
    return ((Number) id).longValue();
  }
}
