package br.com.oto;

import static org.springframework.http.HttpStatus.*;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/secretaria/relatorios")
public class ReportController {
  private final JdbcTemplate db;

  public ReportController(JdbcTemplate db) {
    this.db = db;
  }

  static String query(String type) {
    return switch (type) {
      case "inventario" ->
          "SELECT"
              + " id,nome,descricao,endereco,bairro,tipo_cadastro,situacao_conferencia,latitude,longitude"
              + " FROM registro_inventario ORDER BY id";
      case "ocupacao" ->
          "SELECT o.id,r.nome AS"
              + " estabelecimento,o.mes_referencia,o.ocupacao_percentual,o.fluxo_pessoas,o.tipo_dado,o.lote_id"
              + " FROM ocupacao_fluxo o LEFT JOIN registro_inventario r ON"
              + " r.id=o.estabelecimento_id WHERE (?::date IS NULL OR mes_referencia>=?) AND"
              + " (?::date IS NULL OR mes_referencia<=?) ORDER BY mes_referencia,o.id";
      case "diaria" ->
          "SELECT d.id,r.nome AS estabelecimento,d.mes_referencia,d.valor,d.lote_id FROM"
              + " diaria_media d LEFT JOIN registro_inventario r ON r.id=d.estabelecimento_id WHERE"
              + " (?::date IS NULL OR mes_referencia>=?) AND (?::date IS NULL OR mes_referencia<=?)"
              + " ORDER BY mes_referencia,d.id";
      case "demanda" -> "SELECT id,referencia,origem_uf,lote_id,dados_originais::text FROM demanda_turistica ORDER BY id";
      case "indicadores" ->
          "SELECT i.nome,i.unidade,i.metodologia,o.referencia,o.valor,o.fonte_id FROM indicador i"
              + " LEFT JOIN observacao_indicador o ON o.indicador_id=i.id ORDER BY i.id,o.id";
      case "issqn", "caged", "veiculos", "fretamento" ->
          "SELECT o.id,o.tipo,o.mes_referencia,o.medida,o.valor,o.unidade,o.recorte,i.nome_arquivo"
              + " AS fonte,o.lote_id FROM observacao_externa o JOIN importacao i ON i.id=o.lote_id"
              + " WHERE o.tipo='"
              + type
              + "' AND (?::date IS NULL OR mes_referencia>=?) AND (?::date IS NULL OR"
              + " mes_referencia<=?) ORDER BY o.mes_referencia,o.id";
      case "controle" ->
          "SELECT id,referencia,lote_id,conjunto_id,dados_originais::text FROM controle_pesquisa"
              + " ORDER BY id";
      case "formularios" ->
          "SELECT f.id AS"
              + " formulario_id,f.titulo,f.referencia,r.estabelecimento_id,r.status,r.respostas::text,r.enviado_em"
              + " FROM formulario f LEFT JOIN formulario_resposta r ON r.formulario_id=f.id ORDER"
              + " BY f.id,r.id";
      default -> throw new ResponseStatusException(BAD_REQUEST, "Conjunto de relatório inválido");
    };
  }

  List<Map<String, Object>> rows(String type, LocalDate inicio, LocalDate fim, int limit) {
    AnalysisController.period(inicio, fim);
    if ((inicio != null || fim != null)
        && !Set.of("ocupacao", "diaria", "issqn", "caged", "veiculos", "fretamento").contains(type))
      throw new ResponseStatusException(
          BAD_REQUEST, "Filtro por datas disponível para ocupação e diária");
    String sql = query(type) + " LIMIT " + limit;
    return Set.of("ocupacao", "diaria", "issqn", "caged", "veiculos", "fretamento").contains(type)
        ? db.queryForList(sql, inicio, inicio, fim, fim)
        : db.queryForList(sql);
  }

  @GetMapping("/previa")
  public List<Map<String, Object>> preview(
      @RequestParam String tipo,
      @RequestParam(required = false) LocalDate inicio,
      @RequestParam(required = false) LocalDate fim) {
    return rows(tipo, inicio, fim, 50);
  }

  @GetMapping("/historico")
  public List<Map<String, Object>> history() {
    return db.queryForList(
        "SELECT e.id,r.titulo,r.recorte,e.formato,e.status,e.data_exportacao FROM exportacao e JOIN"
            + " relatorio r ON r.id=e.relatorio_id ORDER BY e.id DESC LIMIT 50");
  }

  static String safe(String raw) {
    return raw.matches("^[\\s]*[=+@-].*") ? "'" + raw : raw;
  }

  static String csv(String raw) {
    return "\"" + safe(raw).replace("\"", "\"\"") + "\"";
  }

  @GetMapping("/exportar")
  public ResponseEntity<byte[]> export(
      @RequestParam String tipo,
      @RequestParam String formato,
      @RequestParam(required = false) LocalDate inicio,
      @RequestParam(required = false) LocalDate fim)
      throws IOException {
    if (!Set.of("csv", "xlsx", "pdf").contains(formato))
      throw new ResponseStatusException(BAD_REQUEST, "Use CSV, XLSX ou PDF");
    var data = rows(tipo, inicio, fim, 10001);
    if (data.size() > 10000)
      throw new ResponseStatusException(
          BAD_REQUEST, "Mais de 10.000 linhas; reduza o período para exportar");
    if (data.isEmpty())
      throw new ResponseStatusException(BAD_REQUEST, "Nenhum dado disponível para esse recorte");
    var columns = new ArrayList<>(data.getFirst().keySet());
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    String mime;
    if (formato.equals("csv")) {
      StringBuilder text = new StringBuilder("\uFEFF");
      text.append(String.join(";", columns.stream().map(ReportController::csv).toList()))
          .append("\r\n");
      for (var row : data)
        text.append(
                String.join(
                    ";", columns.stream().map(c -> csv(Objects.toString(row.get(c), ""))).toList()))
            .append("\r\n");
      out.write(text.toString().getBytes(StandardCharsets.UTF_8));
      mime = "text/csv;charset=UTF-8";
    } else if (formato.equals("xlsx")) {
      try (var workbook = new XSSFWorkbook()) {
        var sheet = workbook.createSheet("OTO");
        var header = sheet.createRow(0);
        for (int c = 0; c < columns.size(); c++) header.createCell(c).setCellValue(columns.get(c));
        for (int i = 0; i < data.size(); i++) {
          var row = sheet.createRow(i + 1);
          for (int c = 0; c < columns.size(); c++) {
            Object value = data.get(i).get(columns.get(c));
            if (value instanceof Number number)
              row.createCell(c).setCellValue(number.doubleValue());
            else row.createCell(c).setCellValue(Objects.toString(value, ""));
          }
        }
        sheet.createFreezePane(0, 1);
        for (int c = 0; c < columns.size(); c++) sheet.setColumnWidth(c, 6500);
        workbook.write(out);
      }
      mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else {
      try (var doc = new PDDocument()) {
        var font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        List<String> lines = new ArrayList<>();
        lines.add("OTO - " + tipo + " | " + java.time.LocalDate.now());
        lines.add("Dados do banco conectado. Verifique origem e metodologia antes de divulgar.");
        lines.add(
            "Recorte: "
                + Objects.toString(inicio, "início disponível")
                + " a "
                + Objects.toString(fim, "fim disponível"));
        int i = 0;
        for (var row : data) {
          lines.add("Registro " + (++i));
          for (String key : columns) {
            String raw = key + ": " + Objects.toString(row.get(key), "não informado");
            for (int start = 0; start < raw.length(); start += 90)
              lines.add(raw.substring(start, Math.min(start + 90, raw.length())));
          }
        }
        for (int start = 0; start < lines.size(); start += 48) {
          var page = new PDPage(PDRectangle.A4);
          doc.addPage(page);
          try (var content = new PDPageContentStream(doc, page)) {
            content.beginText();
            content.setFont(font, 10);
            content.setLeading(15);
            content.newLineAtOffset(40, 800);
            for (String line : lines.subList(start, Math.min(start + 48, lines.size()))) {
              StringBuilder printable = new StringBuilder();
              for (char c : line.toCharArray()) {
                try {
                  font.encode(String.valueOf(c));
                  printable.append(c);
                } catch (Exception ex) {
                  printable.append(' ');
                }
              }
              content.showText(printable.toString());
              content.newLine();
            }
            content.endText();
          }
        }
        doc.save(out);
      }
      mime = "application/pdf";
    }
    Long report =
        db.queryForObject(
            "INSERT INTO relatorio(titulo,recorte,versao_metodologica) VALUES (?,?,?) RETURNING id",
            Long.class,
            "OTO — " + tipo,
            Objects.toString(inicio, "") + " / " + Objects.toString(fim, ""),
            "Exportação de registros; sem inferência metodológica");
    db.update(
        "INSERT INTO exportacao(relatorio_id,formato,status) VALUES (?,?,'concluida')",
        report,
        formato);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=oto-" + tipo + "." + formato)
        .contentType(MediaType.parseMediaType(mime))
        .body(out.toByteArray());
  }
}
