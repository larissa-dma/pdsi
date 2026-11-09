package br.com.oto;

import static org.springframework.http.HttpStatus.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class AccessController {
  private final CurrentUser users;
  private final JdbcTemplate db;
  private final PasswordEncoder encoder;

  public AccessController(CurrentUser users, JdbcTemplate db, PasswordEncoder encoder) {
    this.users = users;
    this.db = db;
    this.encoder = encoder;
  }

  @GetMapping("/csrf")
  public Map<String, String> csrf(CsrfToken token) {
    return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
  }

  @GetMapping("/me")
  public Map<String, Object> me(Principal p) {
    return users.get(p);
  }

  record NewUser(
      @NotBlank @Size(max = 150) String nome,
      @NotBlank @Size(max = 200) String identificador,
      @NotBlank @Size(min = 12, max = 72) String senha,
      @Pattern(regexp = "SECRETARIA|HOSPEDAGEM") @NotNull String perfil,
      @Positive Long estabelecimentoId) {}

  @PostMapping("/secretaria/usuarios")
  @ResponseStatus(CREATED)
  public Map<String, Object> create(@Valid @RequestBody NewUser u) {
    if (u.senha().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
      throw new ResponseStatusException(BAD_REQUEST, "Senha deve ter até 72 bytes");
    if (u.perfil().equals("HOSPEDAGEM") && u.estabelecimentoId() == null)
      throw new ResponseStatusException(BAD_REQUEST, "Hospedagem exige estabelecimentoId");
    if (u.estabelecimentoId() != null
        && !Boolean.TRUE.equals(
            db.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM inventario_vinculo_segmento v JOIN inventario_segmento"
                    + " s ON s.id=v.segmento_id WHERE v.registro_id=? AND s.codigo='hospedagem')",
                Boolean.class,
                u.estabelecimentoId())))
      throw new ResponseStatusException(
          BAD_REQUEST, "Registro não pertence ao segmento hospedagem");
    return db.queryForMap(
        "INSERT INTO usuario(nome,identificador,senha_hash,perfil,estabelecimento_id) VALUES"
            + " (?,?,?,?,?) RETURNING id,nome,identificador,perfil,estabelecimento_id",
        u.nome(),
        u.identificador(),
        encoder.encode(u.senha()),
        u.perfil(),
        u.estabelecimentoId());
  }
}
