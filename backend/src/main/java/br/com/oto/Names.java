package br.com.oto;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Padronização de nomes e textos curtos (QUAL-01).
 *
 * <p>{@link #clean} define como o texto é gravado: remove espaços nas pontas, troca sequências de
 * espaços, tabulações e quebras de linha por um único espaço e preserva maiúsculas e acentos.
 *
 * <p>{@link #key} define como dois nomes são comparados para detectar duplicidade: ignora
 * maiúsculas, acentos e espaços extras. {@link #sqlKey} gera a mesma comparação em SQL, para que
 * Java e PostgreSQL concordem sem depender da extensão {@code unaccent} nem da collation do banco.
 */
final class Names {
  private static final String ACCENTED =
      "áàâãäåéèêëíìîïóòôõöúùûüçñýÿÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝ ";
  private static final String PLAIN =
      "aaaaaaeeeeiiiiooooouuuucnyyaaaaaaeeeeiiiiooooouuuucny ";

  private Names() {}

  /** Texto padronizado para gravação; {@code null} continua {@code null}. */
  static String clean(String value) {
    if (value == null) return null;
    return Normalizer.normalize(value, Normalizer.Form.NFC)
        .replace(' ', ' ')
        .replaceAll("\\s+", " ")
        .trim();
  }

  /** Chave de comparação: sem diferença de maiúsculas, acentos ou espaços extras. */
  static String key(String value) {
    String cleaned = clean(value);
    if (cleaned == null) return null;
    StringBuilder out = new StringBuilder(cleaned.length());
    for (char c : cleaned.toLowerCase(Locale.ROOT).toCharArray()) {
      int i = ACCENTED.indexOf(c);
      out.append(i >= 0 ? PLAIN.charAt(i) : c);
    }
    return out.toString();
  }

  /** Expressão SQL equivalente a {@link #key} aplicada à coluna informada. */
  static String sqlKey(String column) {
    return "btrim(regexp_replace(lower(translate("
        + column
        + ",'"
        + ACCENTED
        + "','"
        + PLAIN
        + "')),'\\s+',' ','g'))";
  }

  /** Código técnico (segmento, modalidade): sem espaços nas pontas e em minúsculas. */
  static String code(String value) {
    return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
  }
}
