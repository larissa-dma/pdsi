package br.com.oto;

import static org.springframework.http.HttpStatus.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class AccountController {
  private final JdbcTemplate db;
  private final PasswordEncoder encoder;
  private final CurrentUser users;

  public AccountController(JdbcTemplate db, PasswordEncoder encoder, CurrentUser users) {
    this.db = db;
    this.encoder = encoder;
    this.users = users;
  }

  record Password(
      @NotBlank String senhaAtual, @NotBlank @Size(min = 12, max = 72) String novaSenha) {}

  record Reset(@NotBlank @Size(min = 12, max = 72) String novaSenha) {}

  record State(@NotNull Boolean ativo) {}

  void check(String value) {
    if (value.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
      throw new ResponseStatusException(BAD_REQUEST, "A senha deve ter até 72 bytes");
  }

  @PutMapping("/me/senha")
  public void password(@Valid @RequestBody Password data, Principal p, HttpServletRequest req) {
    check(data.novaSenha());
    var hash =
        db.queryForObject(
            "SELECT senha_hash FROM usuario WHERE identificador=?", String.class, p.getName());
    if (!encoder.matches(data.senhaAtual(), hash))
      throw new ResponseStatusException(BAD_REQUEST, "Senha atual incorreta");
    db.update(
        "UPDATE usuario SET senha_hash=?,versao_senha=versao_senha+1 WHERE identificador=?",
        encoder.encode(data.novaSenha()),
        p.getName());
    req.getSession().invalidate();
  }

  @GetMapping("/secretaria/usuarios")
  public List<Map<String, Object>> list(@RequestParam(defaultValue = "0") int pagina) {
    if (pagina < 0 || pagina > 1000000) throw new ResponseStatusException(BAD_REQUEST);
    return db.queryForList(
        "SELECT u.id,u.nome,u.identificador,u.perfil,u.ativo,u.estabelecimento_id,r.nome AS"
            + " estabelecimento_nome FROM usuario u LEFT JOIN registro_inventario r ON"
            + " r.id=u.estabelecimento_id ORDER BY u.id LIMIT 50 OFFSET ?",
        pagina * 50);
  }

  @PutMapping("/secretaria/usuarios/{id}/senha")
  public void reset(@PathVariable long id, @Valid @RequestBody Reset data) {
    check(data.novaSenha());
    if (db.update(
            "UPDATE usuario SET senha_hash=?,versao_senha=versao_senha+1 WHERE id=?",
            encoder.encode(data.novaSenha()),
            id)
        == 0) throw new ResponseStatusException(NOT_FOUND);
  }

  @PutMapping("/secretaria/usuarios/{id}/estado")
  @Transactional
  public void state(@PathVariable long id, @Valid @RequestBody State state, Principal p) {
    if (((Number) users.get(p).get("id")).longValue() == id && !state.ativo())
      throw new ResponseStatusException(BAD_REQUEST, "Você não pode desativar sua própria conta");
    if (db.update("UPDATE usuario SET ativo=? WHERE id=?", state.ativo(), id) == 0)
      throw new ResponseStatusException(NOT_FOUND);
  }

  @GetMapping("/secretaria/auditoria")
  public List<Map<String, Object>> audit(@RequestParam(defaultValue = "0") int pagina) {
    if (pagina < 0 || pagina > 1000000) throw new ResponseStatusException(BAD_REQUEST);
    return db.queryForList(
        "SELECT * FROM auditoria ORDER BY id DESC LIMIT 50 OFFSET ?", pagina * 50);
  }
}
