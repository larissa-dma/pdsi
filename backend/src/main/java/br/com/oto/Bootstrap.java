package br.com.oto;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class Bootstrap implements ApplicationRunner {
  private final JdbcTemplate db;
  private final PasswordEncoder encoder;
  private final String identifier, password;

  public Bootstrap(
      JdbcTemplate db,
      PasswordEncoder encoder,
      @Value("${oto.admin-identifier}") String identifier,
      @Value("${oto.admin-password}") String password) {
    this.db = db;
    this.encoder = encoder;
    this.identifier = identifier;
    this.password = password;
  }

  public void run(ApplicationArguments args) {
    if (identifier.isBlank() && password.isBlank()) return;
    if (identifier.isBlank()
        || password.length() < 12
        || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
      throw new IllegalStateException(
          "Configure ADMIN_IDENTIFIER e ADMIN_PASSWORD com 12 caracteres ou mais e até 72 bytes");
    db.update(
        "INSERT INTO usuario(nome,identificador,senha_hash,perfil) VALUES"
            + " ('Administrador',?,?,'SECRETARIA') ON CONFLICT(identificador) DO NOTHING",
        identifier,
        encoder.encode(password));
  }
}
