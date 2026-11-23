package br.com.oto;

import static org.springframework.http.HttpStatus.*;

import com.fasterxml.jackson.databind.*;
import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import org.apache.commons.csv.*;
import org.apache.poi.ss.usermodel.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/secretaria/importacoes")
public class ImportController {
  private final JdbcTemplate db;
  private final CurrentUser users;
  private final ObjectMapper json;
  static final Set<String> TYPES =
      Set.of(
          "inventario",
          "ocupacao",
          "diaria",
          "demanda",
          "controle",
          "issqn",
          "caged",
          "veiculos",
          "fretamento");

  public ImportController(JdbcTemplate db, CurrentUser users, ObjectMapper json) {
    this.db = db;
    this.users = users;
    this.json = json;
  }

  record Mapping(String tipo, String referencia, Map<String, String> campos) {}

  record Commit(boolean somenteValidas) {}

  String encode(Object o) {
    try {
      return json.writeValueAsString(o);
    } catch (Exception ex) {
      throw new IllegalStateException(ex);
    }
  }

  JsonNode decode(Object o) {
    try {
      return json.readTree(o.toString());
    } catch (Exception ex) {
      throw new IllegalStateException(ex);
    }
  }

  @GetMapping("/{id}/linhas")
  public List<Map<String, Object>> originals(
      @PathVariable long id, @RequestParam(defaultValue = "0") int pagina) {
    if (pagina < 0 || pagina > 1000000) throw new ResponseStatusException(BAD_REQUEST);
    return db.queryForList(
        "SELECT linha,valida,dados_originais::text AS dados_originais FROM importacao_linha WHERE"
            + " lote_id=? ORDER BY linha LIMIT 50 OFFSET ?",
        id,
        pagina * 50);
  }

  @PostMapping(value = "/preparar", consumes = "multipart/form-data")
  public Map<String, Object> prepare(@RequestParam MultipartFile arquivo, java.security.Principal p)
      throws Exception {
    String name =
        arquivo.getOriginalFilename() == null ? "arquivo.csv" : arquivo.getOriginalFilename();
    name = java.nio.file.Path.of(name).getFileName().toString();
    if (arquivo.isEmpty() || arquivo.getSize() > 10 * 1024 * 1024 || name.length() > 255)
      throw new ResponseStatusException(
          BAD_REQUEST, "Arquivo vazio, nome inválido ou maior que 10 MB");
    List<String> headers = new ArrayList<>();
    List<Map<String, String>> rows = new ArrayList<>();
    byte[] bytes = arquivo.getBytes();
    try {
      if (name.toLowerCase(Locale.ROOT).endsWith(".csv")) {
        String text =
            StandardCharsets.UTF_8
                .newDecoder()
                .decode(java.nio.ByteBuffer.wrap(bytes))
                .toString()
                .replaceFirst("^\\uFEFF", "");
        String first = text.lines().findFirst().orElse("");
        char delimiter =
            first.chars().filter(c -> c == ';').count()
                    > first.chars().filter(c -> c == ',').count()
                ? ';'
                : ',';
        try (var parser =
            CSVFormat.DEFAULT
                .builder()
                .setDelimiter(delimiter)
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreEmptyLines(true)
                .get()
                .parse(new StringReader(text))) {
          headers.addAll(parser.getHeaderNames());
          validateHeaders(headers);
          for (var row : parser) {
            if (row.size() != headers.size())
              throw new IllegalArgumentException(
                  "Número de colunas diferente na linha " + row.getRecordNumber());
            Map<String, String> values = new LinkedHashMap<>();
            for (String h : headers) values.put(h, row.get(h).trim());
            if (values.values().stream().anyMatch(v -> !v.isBlank())) rows.add(values);
            if (rows.size() > 5000) throw new IllegalArgumentException("Máximo de 5.000 linhas");
          }
        }
      } else if (name.toLowerCase(Locale.ROOT).endsWith(".xlsx")) {
        try (var workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
          var sheet = workbook.getSheetAt(0);
          var formatter = new DataFormatter(Locale.US);
          var header = sheet.getRow(0);
          if (header == null) throw new IllegalArgumentException("Cabeçalho ausente");
          for (int c = 0; c < header.getLastCellNum(); c++)
            headers.add(formatter.formatCellValue(header.getCell(c)).trim());
          validateHeaders(headers);
          if (sheet.getLastRowNum() > 5000)
            throw new IllegalArgumentException("Máximo de 5.000 linhas");
          for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            var row = sheet.getRow(i);
            if (row == null) continue;
            Map<String, String> values = new LinkedHashMap<>();
            for (int c = 0; c < headers.size(); c++) {
              var cell = row.getCell(c);
              if (cell != null && cell.getCellType() == CellType.FORMULA)
                throw new IllegalArgumentException(
                    "Fórmulas não são aceitas; exporte os valores antes de importar");
              String value =
                  cell != null
                          && cell.getCellType() == CellType.NUMERIC
                          && DateUtil.isCellDateFormatted(cell)
                      ? cell.getLocalDateTimeCellValue().toLocalDate().toString()
                      : formatter.formatCellValue(cell).trim();
              values.put(headers.get(c), value);
            }
            if (values.values().stream().anyMatch(v -> !v.isBlank())) rows.add(values);
          }
        }
      } else
        throw new IllegalArgumentException(
            "Use CSV UTF-8 ou XLSX, com cabeçalho na primeira linha");
      if (rows.isEmpty()) throw new IllegalArgumentException("Nenhuma linha de dados encontrada");
      if (rows.stream().flatMap(v -> v.values().stream()).anyMatch(v -> v.length() > 10000))
        throw new IllegalArgumentException("Uma célula excede 10.000 caracteres");
    } catch (Exception ex) {
      throw new ResponseStatusException(
          BAD_REQUEST, "Não foi possível ler a planilha: " + ex.getMessage());
    }
    UUID id = UUID.randomUUID();
    String hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    db.update(
        "INSERT INTO importacao_previa(id,usuario_id,nome_arquivo,hash_arquivo,colunas,linhas)"
            + " VALUES (?,?,?,?,?::jsonb,?::jsonb)",
        id,
        users.get(p).get("id"),
        name,
        hash,
        encode(headers),
        encode(rows));
    return Map.of(
        "id",
        id,
        "colunas",
        headers,
        "amostra",
        rows.stream().limit(5).toList(),
        "total",
        rows.size());
  }

  static void validateHeaders(List<String> headers) {
    if (headers.isEmpty()
        || headers.size() > 150
        || headers.stream().anyMatch(String::isBlank)
        || headers.stream().distinct().count() != headers.size())
      throw new IllegalArgumentException("Use até 150 colunas com títulos únicos e não vazios");
  }

  Map<String, Object> stage(UUID id, java.security.Principal p, boolean lock) {
    var rows =
        db.queryForList(
            "SELECT * FROM importacao_previa WHERE id=? AND usuario_id=?"
                + (lock ? " FOR UPDATE" : ""),
            id,
            users.get(p).get("id"));
    if (rows.isEmpty()) throw new ResponseStatusException(NOT_FOUND);
    var row = rows.getFirst();
    if (row.get("confirmado_id") != null)
      throw new ResponseStatusException(CONFLICT, "Esta prévia já foi importada");
    return row;
  }

  static String text(Map<String, String> row, String key) {
    return row.getOrDefault(key, "").trim();
  }

  static String required(Map<String, String> row, String key, int max) {
    String value = text(row, key);
    if (value.isBlank() || value.length() > max)
      throw new IllegalArgumentException(key + ": obrigatório, até " + max + " caracteres");
    return value;
  }

  static BigDecimal decimal(Map<String, String> row, String key, BigDecimal max) {
    String raw = text(row, key);
    if (raw.isBlank()) return null;
    BigDecimal value = new BigDecimal(raw.replace(',', '.'));
    if (value.signum() < 0 || (max != null && value.compareTo(max) > 0))
      throw new IllegalArgumentException(key + ": fora dos limites");
    return value;
  }

  static Long identifier(Map<String, String> row, String key) {
    String v = text(row, key);
    if (v.isBlank()) return null;
    long value = Long.parseLong(v);
    if (value <= 0) throw new IllegalArgumentException(key + ": identificador inválido");
    return value;
  }

  static String month(Map<String, String> row) {
    String raw = required(row, "mes_referencia", 10);
    LocalDate date = raw.length() == 7 ? YearMonth.parse(raw).atDay(1) : LocalDate.parse(raw);
    if (date.getDayOfMonth() != 1)
      throw new IllegalArgumentException("mes_referencia deve ser o primeiro dia do mês");
    return date.toString();
  }

  Map<String, Object> normalize(String type, Map<String, String> row) {
    Map<String, Object> result = new LinkedHashMap<>();
    if (type.equals("inventario")) {
      String name = Names.clean(required(row, "nome", 200));
      String address = Names.clean(text(row, "endereco"));
      String district = Names.clean(text(row, "bairro"));
      result.put("nome", name);
      result.put("endereco", address);
      result.put("bairro", district);
      result.put("descricao", text(row, "descricao"));
      if (address.length() > 255 || district.length() > 120)
        throw new IllegalArgumentException("Endereço ou bairro muito longo");
      String segment = Names.code(required(row, "segmento", 40));
      var seg = db.queryForList("SELECT id FROM inventario_segmento WHERE codigo=?", segment);
      if (seg.isEmpty())
        throw new IllegalArgumentException("Código de segmento desconhecido: " + segment);
      result.put("segmento_id", seg.getFirst().get("id"));
      var existing =
          db.queryForList(
              "SELECT r.id FROM registro_inventario r JOIN inventario_vinculo_segmento v ON"
                  + " v.registro_id=r.id WHERE "
                  + Names.sqlKey("r.nome")
                  + "=? AND v.segmento_id=? LIMIT 1",
              Names.key(name),
              result.get("segmento_id"));
      if (!existing.isEmpty())
        throw new IllegalArgumentException(
            "Nome já existe no segmento (cadastro " + existing.getFirst().get("id") + ")");
      var lat = text(row, "latitude");
      var lon = text(row, "longitude");
      if (lat.isBlank() != lon.isBlank())
        throw new IllegalArgumentException("Informe latitude e longitude juntas");
      if (!lat.isBlank()) {
        BigDecimal a = new BigDecimal(lat.replace(',', '.')),
            b = new BigDecimal(lon.replace(',', '.'));
        if (a.abs().compareTo(new BigDecimal("90")) > 0
            || b.abs().compareTo(new BigDecimal("180")) > 0)
          throw new IllegalArgumentException("Coordenadas fora dos limites");
        result.put("latitude", a);
        result.put("longitude", b);
      }
    } else if (type.equals("ocupacao") || type.equals("diaria")) {
      result.put("mes_referencia", month(row));
      Long establishment = identifier(row, "estabelecimento_id");
      if (establishment != null
          && !Boolean.TRUE.equals(
              db.queryForObject(
                  "SELECT EXISTS(SELECT 1 FROM registro_inventario WHERE id=?)",
                  Boolean.class,
                  establishment)))
        throw new IllegalArgumentException("Estabelecimento não encontrado");
      result.put("estabelecimento_id", establishment);
      if (type.equals("ocupacao")) {
        String mode = Names.code(required(row, "tipo_dado", 20));
        if (!Set.of("consolidado", "expectativa").contains(mode))
          throw new IllegalArgumentException("tipo_dado: use consolidado ou expectativa");
        result.put("tipo_dado", mode);
        var occupancy = decimal(row, "ocupacao_percentual", new BigDecimal("100"));
        var flow = decimal(row, "fluxo_pessoas", new BigDecimal(Integer.MAX_VALUE));
        if (flow != null && flow.stripTrailingZeros().scale() > 0)
          throw new IllegalArgumentException("fluxo_pessoas deve ser inteiro");
        if (occupancy == null && flow == null)
          throw new IllegalArgumentException("Informe ocupação ou fluxo");
        result.put("ocupacao_percentual", occupancy);
        result.put("fluxo_pessoas", flow == null ? null : flow.intValueExact());
      } else {
        var value = decimal(row, "valor", new BigDecimal("9999999999.99"));
        if (value == null) throw new IllegalArgumentException("valor é obrigatório");
        result.put("valor", value);
      }
      if (establishment != null) {
        String table = type.equals("ocupacao") ? "ocupacao_fluxo" : "diaria_media";
        String sameMode = type.equals("ocupacao") ? " AND tipo_dado=?" : "";
        Object[] args =
            type.equals("ocupacao")
                ? new Object[] {establishment, result.get("mes_referencia"), result.get("tipo_dado")}
                : new Object[] {establishment, result.get("mes_referencia")};
        var previous =
            db.queryForList(
                "SELECT lote_id FROM "
                    + table
                    + " WHERE estabelecimento_id=? AND mes_referencia=?::date"
                    + sameMode
                    + " LIMIT 1",
                args);
        if (!previous.isEmpty())
          throw new IllegalArgumentException(
              "Já existe dado deste estabelecimento para o mês (lote "
                  + previous.getFirst().get("lote_id")
                  + ")");
      }
    } else if (type.equals("demanda")) {
      result.put("referencia", required(row, "referencia", 50));
      String uf = text(row, "origem_uf").toUpperCase(Locale.ROOT);
      if (!uf.isBlank()
          && !Set.of(
                  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
                  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE",
                  "TO")
              .contains(uf)) throw new IllegalArgumentException("UF inválida");
      result.put("origem_uf", uf.isBlank() ? null : uf);
    } else if (Set.of("issqn", "caged", "veiculos", "fretamento").contains(type)) {
      result.put("mes_referencia", month(row));
      result.put("medida", Names.clean(required(row, "medida", 100)));
      result.put("unidade", Names.clean(required(row, "unidade", 60)));
      result.put("recorte", Names.clean(text(row, "recorte")));
      String raw = required(row, "valor", 30);
      BigDecimal value = new BigDecimal(raw.replace(',', '.'));
      if (value.precision() - value.scale() > 14 || value.scale() > 4)
        throw new IllegalArgumentException("valor: até 14 dígitos inteiros e 4 decimais");
      result.put("valor", value);
    } else result.put("referencia", required(row, "referencia", 50));
    return result;
  }

  List<Map<String, Object>> validateRows(Map<String, Object> stage, Mapping mapping) {
    if (mapping.tipo() == null
        || !TYPES.contains(mapping.tipo())
        || mapping.referencia() == null
        || mapping.referencia().isBlank()
        || mapping.referencia().length() > 50
        || mapping.campos() == null)
      throw new ResponseStatusException(BAD_REQUEST, "Informe tipo, referência e mapeamento");
    Set<String> headers = new HashSet<>();
    decode(stage.get("colunas")).forEach(v -> headers.add(v.asText()));
    if (mapping.campos().values().stream().anyMatch(v -> !headers.contains(v)))
      throw new ResponseStatusException(BAD_REQUEST, "Mapeamento aponta para coluna inexistente");
    var raw = decode(stage.get("linhas"));
    List<Map<String, Object>> output = new ArrayList<>();
    Set<String> seen = new HashSet<>();
    int index = 1;
    for (var node : raw) {
      index++;
      Map<String, String> row = new LinkedHashMap<>();
      for (var field : mapping.campos().entrySet())
        row.put(field.getKey(), node.path(field.getValue()).asText());
      Map<String, Object> item = new LinkedHashMap<>();
      item.put("linha", index);
      item.put("originais", node);
      try {
        var normalized = normalize(mapping.tipo(), row);
        String duplicate =
            mapping.tipo().equals("inventario")
                ? Names.key(normalized.get("nome").toString())
                    + ":"
                    + normalized.get("segmento_id")
                : encode(normalized);
        if (!seen.add(duplicate)) throw new IllegalArgumentException("Linha duplicada no arquivo");
        item.put("dados", normalized);
        item.put("valida", true);
      } catch (IllegalArgumentException | java.time.DateTimeException ex) {
        item.put("valida", false);
        item.put(
            "erro",
            ex instanceof NumberFormatException
                ? "Número inválido; use números sem separador de milhar"
                : ex.getMessage() == null ? "Valor inválido" : ex.getMessage());
      }
      output.add(item);
    }
    return output;
  }

  @PostMapping("/previas/{id}/validar")
  @Transactional
  public Map<String, Object> validate(
      @PathVariable UUID id, @RequestBody Mapping mapping, java.security.Principal p) {
    var stage = stage(id, p, true);
    var rows = validateRows(stage, mapping);
    db.update(
        "UPDATE importacao_previa SET tipo=?,referencia=?,mapeamento=?::jsonb WHERE id=?",
        mapping.tipo(),
        mapping.referencia(),
        encode(mapping.campos()),
        id);
    return Map.of(
        "total",
        rows.size(),
        "validas",
        rows.stream().filter(v -> Boolean.TRUE.equals(v.get("valida"))).count(),
        "linhas",
        rows);
  }

  @PostMapping("/previas/{id}/confirmar")
  @Transactional
  public Map<String, Object> commit(
      @PathVariable UUID id, @RequestBody Commit command, java.security.Principal p) {
    db.execute("SELECT pg_advisory_xact_lock(830512)");
    var stage = stage(id, p, true);
    if (stage.get("mapeamento") == null)
      throw new ResponseStatusException(BAD_REQUEST, "Valide a prévia antes de confirmar");
    Map<String, String> fields =
        json.convertValue(
            decode(stage.get("mapeamento")),
            new com.fasterxml.jackson.core.type.TypeReference<Map<String, String>>() {});
    String type = stage.get("tipo").toString();
    var rows = validateRows(stage, new Mapping(type, stage.get("referencia").toString(), fields));
    long valid = rows.stream().filter(v -> Boolean.TRUE.equals(v.get("valida"))).count();
    if (valid == 0) throw new ResponseStatusException(BAD_REQUEST, "Nenhuma linha válida");
    if (valid < rows.size() && !command.somenteValidas())
      throw new ResponseStatusException(
          BAD_REQUEST, "Há linhas inválidas; corrija o arquivo ou confirme somente as válidas");
    Long source =
        db.queryForObject(
            "INSERT INTO fonte_dados(nome,descricao,situacao_carga) VALUES (?,?,'importada')"
                + " RETURNING id",
            Long.class,
            "Arquivo — " + type,
            "Upload validado pelo sistema");
    Long dataset = null;
    if (!type.equals("inventario"))
      dataset =
          db.queryForObject(
              "INSERT INTO conjunto_pesquisa(nome,codigo) VALUES (?,?) ON CONFLICT(codigo) DO"
                  + " UPDATE SET codigo=EXCLUDED.codigo RETURNING id",
              Long.class,
              type,
              type.toUpperCase(Locale.ROOT));
    var batch =
        db.queryForMap(
            "INSERT INTO"
                + " importacao(fonte_id,conjunto_id,usuario_responsavel_id,referencia,nome_arquivo,hash_arquivo,status,linhas_total,linhas_validas,linhas_pendentes,tipo_importacao)"
                + " VALUES (?,?,?,?,?,?,?, ?,?,?,?) RETURNING *",
            source,
            dataset,
            users.get(p).get("id"),
            stage.get("referencia"),
            stage.get("nome_arquivo"),
            stage.get("hash_arquivo"),
            valid == rows.size() ? "validada" : "pendencias",
            rows.size(),
            valid,
            rows.size() - valid,
            type);
    for (var item : rows) {
      db.update(
          "INSERT INTO importacao_linha(lote_id,linha,dados_originais,valida) VALUES"
              + " (?,?,?::jsonb,?)",
          batch.get("id"),
          item.get("linha"),
          encode(item.get("originais")),
          item.get("valida"));
      if (!Boolean.TRUE.equals(item.get("valida"))) {
        db.update(
            "INSERT INTO erro_importacao(lote_id,linha,tipo,descricao) VALUES (?,?,'validacao',?)",
            batch.get("id"),
            item.get("linha"),
            item.get("erro"));
        continue;
      }
      @SuppressWarnings("unchecked")
      Map<String, Object> data = (Map<String, Object>) item.get("dados");
      if (type.equals("inventario")) {
        var record =
            db.queryForMap(
                "INSERT INTO registro_inventario(nome,endereco,bairro,descricao,latitude,longitude)"
                    + " VALUES (?,?,?,?,?,?) RETURNING id",
                data.get("nome"),
                data.get("endereco"),
                data.get("bairro"),
                data.get("descricao"),
                data.get("latitude"),
                data.get("longitude"));
        db.update(
            "INSERT INTO"
                + " inventario_vinculo_segmento(registro_id,segmento_id,lote_id,linha_excel_origem)"
                + " VALUES (?,?,?,?)",
            record.get("id"),
            data.get("segmento_id"),
            batch.get("id"),
            item.get("linha"));
      } else if (type.equals("ocupacao"))
        db.update(
            "INSERT INTO"
                + " ocupacao_fluxo(lote_id,estabelecimento_id,mes_referencia,ocupacao_percentual,fluxo_pessoas,tipo_dado,linha_origem,dados_originais)"
                + " VALUES (?,?,?::date,?,?,?,?,?::jsonb)",
            batch.get("id"),
            data.get("estabelecimento_id"),
            data.get("mes_referencia"),
            data.get("ocupacao_percentual"),
            data.get("fluxo_pessoas"),
            data.get("tipo_dado"),
            item.get("linha"),
            encode(item.get("originais")));
      else if (type.equals("diaria"))
        db.update(
            "INSERT INTO"
                + " diaria_media(lote_id,estabelecimento_id,mes_referencia,valor,linha_origem,dados_originais)"
                + " VALUES (?,?,?::date,?,?,?::jsonb)",
            batch.get("id"),
            data.get("estabelecimento_id"),
            data.get("mes_referencia"),
            data.get("valor"),
            item.get("linha"),
            encode(item.get("originais")));
      else if (type.equals("demanda"))
        db.update(
            "INSERT INTO"
                + " demanda_turistica(lote_id,referencia,origem_uf,linha_origem,dados_originais)"
                + " VALUES (?,?,?,?,?::jsonb)",
            batch.get("id"),
            data.get("referencia"),
            data.get("origem_uf"),
            item.get("linha"),
            encode(item.get("originais")));
      else if (Set.of("issqn", "caged", "veiculos", "fretamento").contains(type))
        db.update(
            "INSERT INTO"
                + " observacao_externa(lote_id,tipo,mes_referencia,medida,unidade,recorte,valor,linha_origem)"
                + " VALUES (?,?,?::date,?,?,?,?,?)",
            batch.get("id"),
            type,
            data.get("mes_referencia"),
            data.get("medida"),
            data.get("unidade"),
            data.get("recorte"),
            data.get("valor"),
            item.get("linha"));
      else
        db.update(
            "INSERT INTO"
                + " controle_pesquisa(lote_id,conjunto_id,referencia,linha_origem,dados_originais)"
                + " VALUES (?,?,?,?,?::jsonb)",
            batch.get("id"),
            dataset,
            data.get("referencia"),
            item.get("linha"),
            encode(item.get("originais")));
    }
    db.update(
        "UPDATE importacao_previa SET confirmado_id=?,linhas='[]'::jsonb WHERE id=?",
        batch.get("id"),
        id);
    return batch;
  }
}
