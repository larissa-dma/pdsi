package br.com.oto;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class NamesTest {
  @Test
  void cleanCollapsesSpacesAndKeepsCase() {
    assertEquals("hotel SOL", Names.clean("  hotel \t  SOL \n"));
    assertEquals("Pousada São João", Names.clean("Pousada São   João"));
  }

  @Test
  void cleanKeepsNullAndEmpty() {
    assertNull(Names.clean(null));
    assertEquals("", Names.clean("   "));
  }

  @Test
  void keyIgnoresCaseAccentsAndSpaces() {
    assertEquals(Names.key("Hotel São João"), Names.key("  HOTEL   sao joão "));
    assertEquals("acai e cia", Names.key("Açaí  E  Cia"));
  }

  @Test
  void keyKeepsDifferentNamesDifferent() {
    assertNotEquals(Names.key("Hotel Sol"), Names.key("Hotel Sol 2"));
    assertNotEquals(Names.key("Pousada"), Names.key("Pousadas"));
  }

  @Test
  void keyComposesDecomposedAccents() {
    // "é" digitado como "e" + acento combinante (comum em arquivos vindos do macOS).
    assertEquals(Names.key("Café"), Names.key("Café"));
  }

  @Test
  void sqlKeyUsesTheColumn() {
    String sql = Names.sqlKey("r.nome");
    assertTrue(sql.contains("translate(r.nome,"), sql);
    assertTrue(sql.contains("'\\s+',' ','g'"), sql);
  }

  @Test
  void codeIsLowercaseAndTrimmed() {
    assertEquals("hospedagem", Names.code(" Hospedagem "));
    assertEquals("consolidado", Names.code("CONSOLIDADO"));
    assertNull(Names.code(null));
  }
}
