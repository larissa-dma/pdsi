package br.com.oto;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

class AccountGuard extends OncePerRequestFilter {
  private final JdbcTemplate db;

  AccountGuard(JdbcTemplate db) {
    this.db = db;
  }

  protected void doFilterInternal(
      HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null
        && auth.isAuthenticated()
        && !(auth
            instanceof org.springframework.security.authentication.AnonymousAuthenticationToken)) {
      var rows =
          db.queryForList(
              "SELECT ativo,versao_senha FROM usuario WHERE identificador=?", auth.getName());
      var session = req.getSession(false);
      Object stored = session == null ? null : session.getAttribute("oto.version");
      int version = stored instanceof Number n ? n.intValue() : 0;
      if (rows.isEmpty()
          || ((Number) rows.getFirst().getOrDefault("versao_senha", 0)).intValue() != version
          || !Boolean.TRUE.equals(rows.getFirst().get("ativo"))) {
        SecurityContextHolder.clearContext();
        if (req.getSession(false) != null) req.getSession(false).invalidate();
        res.sendError(401);
        return;
      }
    }
    chain.doFilter(req, res);
    if (auth != null
        && req.getRequestURI().startsWith("/api/")
        && !req.getMethod().equals("GET")
        && res.getStatus() < 400) {
      db.update(
          "INSERT INTO auditoria(identificador,metodo,caminho) VALUES (?,?,?)",
          auth.getName(),
          req.getMethod(),
          req.getRequestURI());
    }
  }
}
