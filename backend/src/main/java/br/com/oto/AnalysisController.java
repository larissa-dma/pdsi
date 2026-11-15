package br.com.oto;

import static org.springframework.http.HttpStatus.*;

import java.time.LocalDate;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/secretaria/analises")
public class AnalysisController {
  private final JdbcTemplate db;

  public AnalysisController(JdbcTemplate db) {
    this.db = db;
  }

  public static void period(LocalDate inicio, LocalDate fim) {
    if (inicio != null && fim != null && inicio.isAfter(fim))
      throw new ResponseStatusException(BAD_REQUEST, "Período inicial deve ser anterior ao final");
  }

  @GetMapping("/resumo")
  public Map<String, Object> summary(
      @RequestParam(required = false) LocalDate inicio,
      @RequestParam(required = false) LocalDate fim,
      @RequestParam(defaultValue = "consolidado") String tipo) {
    period(inicio, fim);
    if (!Set.of("consolidado", "expectativa").contains(tipo))
      throw new ResponseStatusException(BAD_REQUEST);
    var result = new LinkedHashMap<String, Object>();
    result.put(
        "serie",
        db.queryForList(
            "SELECT mes_referencia,round(avg(ocupacao_percentual),2) AS ocupacao,sum(fluxo_pessoas)"
                + " AS fluxo,count(*) AS observacoes FROM ocupacao_fluxo WHERE tipo_dado=? AND"
                + " (?::date IS NULL OR mes_referencia>=?) AND (?::date IS NULL OR"
                + " mes_referencia<=?) GROUP BY mes_referencia ORDER BY mes_referencia",
            tipo,
            inicio,
            inicio,
            fim,
            fim));
    result.put(
        "diarias",
        db.queryForList(
            "SELECT mes_referencia,round(avg(valor),2) AS diaria,count(*) AS observacoes FROM"
                + " diaria_media WHERE (?::date IS NULL OR mes_referencia>=?) AND (?::date IS NULL"
                + " OR mes_referencia<=?) GROUP BY mes_referencia ORDER BY mes_referencia",
            inicio,
            inicio,
            fim,
            fim));
    result.put(
        "origens",
        db.queryForList(
            "SELECT coalesce(origem_uf,'NI') AS uf,count(*) AS quantidade FROM demanda_turistica"
                + " WHERE (?::text IS NULL OR referencia>=?) AND (?::text IS NULL OR referencia<=?)"
                + " GROUP BY origem_uf ORDER BY quantidade DESC",
            inicio == null ? null : inicio.toString().substring(0, 7),
            inicio == null ? null : inicio.toString().substring(0, 7),
            fim == null ? null : fim.toString().substring(0, 7),
            fim == null ? null : fim.toString().substring(0, 7)));
    result.put(
        "fontes",
        db.queryForList(
            "SELECT f.id,f.nome,f.descricao,count(i.id) AS lotes,max(i.data_importacao) AS"
                + " ultima_carga,coalesce(sum(i.linhas_validas),0) AS linhas_validas FROM"
                + " fonte_dados f LEFT JOIN importacao i ON i.fonte_id=f.id GROUP BY f.id ORDER BY"
                + " f.nome"));
    result.put(
        "segmentos",
        db.queryForList(
            "SELECT s.nome,count(v.id) AS quantidade FROM inventario_segmento s LEFT JOIN"
                + " inventario_vinculo_segmento v ON v.segmento_id=s.id GROUP BY s.id ORDER BY"
                + " s.nome"));
    result.put(
        "externas",
        db.queryForList(
            "SELECT o.*,i.nome_arquivo AS fonte FROM observacao_externa o JOIN importacao i ON"
                + " i.id=o.lote_id WHERE (?::date IS NULL OR mes_referencia>=?) AND (?::date IS"
                + " NULL OR mes_referencia<=?) ORDER BY mes_referencia DESC,o.id DESC LIMIT 50",
            inicio,
            inicio,
            fim,
            fim));
    result.put(
        "metodologia",
        "Ocupação: média simples das observações não nulas por mês, sem ponderação por capacidade."
            + " Fluxo: soma das observações não nulas; diária: média simples. Ausência não equivale"
            + " a zero. Consolidado e expectativa são separados. Demanda usa referências mensais"
            + " AAAA-MM.");
    return result;
  }

  @GetMapping("/ocupacao")
  public List<Map<String, Object>> occupation(
      @RequestParam(required = false) LocalDate inicio,
      @RequestParam(required = false) LocalDate fim,
      @RequestParam(defaultValue = "consolidado") String tipo,
      @RequestParam(defaultValue = "0") int pagina) {
    period(inicio, fim);
    if (pagina < 0 || pagina > 1000000 || !Set.of("consolidado", "expectativa").contains(tipo))
      throw new ResponseStatusException(BAD_REQUEST);
    return db.queryForList(
        "SELECT o.*,r.nome AS estabelecimento,i.nome_arquivo AS fonte FROM ocupacao_fluxo o LEFT"
            + " JOIN registro_inventario r ON r.id=o.estabelecimento_id JOIN importacao i ON"
            + " i.id=o.lote_id WHERE o.tipo_dado=? AND (?::date IS NULL OR o.mes_referencia>=?) AND"
            + " (?::date IS NULL OR o.mes_referencia<=?) ORDER BY o.mes_referencia DESC,o.id LIMIT"
            + " 50 OFFSET ?",
        tipo,
        inicio,
        inicio,
        fim,
        fim,
        pagina * 50);
  }

  @GetMapping("/sustentabilidade")
  public List<Map<String, Object>> sustainability() {
    return db.queryForList(
        "SELECT i.id,i.nome,i.unidade,i.metodologia,o.referencia,o.valor,coalesce((SELECT"
            + " string_agg(d.numero::text || ' — ' || d.nome,', ' ORDER BY d.numero) FROM"
            + " indicador_ods io JOIN ods d ON d.id=io.ods_id WHERE io.indicador_id=i.id),'Sem"
            + " vínculo ODS') AS ods FROM indicador i LEFT JOIN LATERAL (SELECT referencia,valor"
            + " FROM observacao_indicador WHERE indicador_id=i.id ORDER BY id DESC LIMIT 1) o ON"
            + " true ORDER BY i.nome");
  }

  @GetMapping("/mapa")
  public List<Map<String, Object>> map() {
    return db.queryForList(
        "SELECT r.id,r.nome,r.endereco,r.bairro,coalesce(r.latitude,(SELECT a.latitude FROM"
            + " inventario_resposta a JOIN inventario_vinculo_segmento x ON x.id=a.vinculo_id WHERE"
            + " x.registro_id=r.id AND a.latitude IS NOT NULL ORDER BY a.id DESC LIMIT 1)) AS"
            + " latitude,coalesce(r.longitude,(SELECT a.longitude FROM inventario_resposta a JOIN"
            + " inventario_vinculo_segmento x ON x.id=a.vinculo_id WHERE x.registro_id=r.id AND"
            + " a.longitude IS NOT NULL ORDER BY a.id DESC LIMIT 1)) AS"
            + " longitude,r.situacao_conferencia,coalesce(string_agg(s.nome,', ' ORDER BY"
            + " s.nome),'Sem segmento') AS segmentos FROM registro_inventario r LEFT JOIN"
            + " inventario_vinculo_segmento v ON v.registro_id=r.id LEFT JOIN inventario_segmento s"
            + " ON s.id=v.segmento_id GROUP BY r.id ORDER BY r.nome");
  }
}
