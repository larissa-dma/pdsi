import { chromium } from "playwright";
import assert from "node:assert/strict";
const base = process.env.OTO_WEB_URL ?? "http://127.0.0.1:15173";
const admin = process.env.OTO_TEST_ADMIN;
const password = process.env.OTO_TEST_PASSWORD;
if (!admin || !password)
  throw new Error(
    "Configure OTO_TEST_ADMIN e OTO_TEST_PASSWORD para um ambiente descartável.",
  );
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_EXECUTABLE
    ? { executablePath: process.env.CHROME_EXECUTABLE }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
let pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));
try {
  await page.goto(base + "/login");
  await page.getByPlaceholder("seu@email.com").fill(admin);
  await page.locator("input[type=password]").fill(password);
  await page.getByRole("button", { name: /Entrar|Acessar/ }).click();
  await page.waitForURL("**/secretaria/painel");
  await page
    .getByRole("heading", { name: "Visão geral", exact: true })
    .waitFor();
  for (const [path, title] of [
    ["inventario", "Inventário turístico"],
    ["ocupacao", "Ocupação hoteleira e fluxo"],
    ["pesquisas", "Pesquisas e formulários"],
    ["importacao", "Importação e qualidade"],
    ["mapa", "Mapa do inventário"],
    ["sustentabilidade", "Sustentabilidade e indicadores ODS"],
    ["relatorios", "Relatórios e exportações"],
    ["usuarios", "Usuários e acessos"],
  ]) {
    await page.goto(base + "/secretaria/" + path);
    await page.getByRole("heading", { name: title, exact: true }).waitFor();
    await page.waitForTimeout(250);
    assert.equal(
      await page.locator(".notice.error").count(),
      0,
      `Erro em ${path}: ${await page.locator(".notice.error").allTextContents()}`,
    );
  }
  await page.goto(base + "/secretaria/inventario/novo");
  // Nome único: o QUAL-01 bloqueia nomes repetidos no mesmo segmento.
  await page
    .getByLabel("Nome", { exact: true })
    .fill("Browser Test Hotel " + Date.now());
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Descrição pelo navegador");
  await page.getByLabel("Latitude", { exact: true }).fill("-20.75");
  await page.getByLabel("Longitude", { exact: true }).fill("-48.90");
  await page
    .getByRole("button", { name: "Salvar cadastro", exact: true })
    .click();
  await page.waitForURL(/inventario\/\d+\/editar/);
  const record = Number(page.url().match(/inventario\/(\d+)/)[1]);
  const token = await (await page.request.get(base + "/api/csrf")).json();
  const headers = { [token.headerName]: token.token };
  const segments = await (
    await page.request.get(base + "/api/secretaria/inventario/segmentos")
  ).json();
  const segment = segments.find((s) => s.codigo === "hospedagem");
  assert(
    (
      await page.request.put(
        base +
          `/api/secretaria/inventario/registros/${record}/segmentos/${segment.id}`,
        { headers },
      )
    ).ok(),
  );
  const login = "browser-" + Date.now();
  assert(
    (
      await page.request.post(base + "/api/secretaria/usuarios", {
        headers,
        data: {
          nome: "Browser Lodging",
          identificador: login,
          senha: "browser-test-password",
          perfil: "HOSPEDAGEM",
          estabelecimentoId: record,
        },
      })
    ).ok(),
  );
  await page.goto(base + "/secretaria/pesquisas");
  await page.getByLabel("Título", { exact: true }).fill("Pesquisa navegador");
  await page.getByLabel("Referência", { exact: true }).fill("2026-11");
  await page.getByLabel("Prazo", { exact: true }).fill("2099-12-31");
  await page
    .getByRole("button", { name: "Publicar formulário", exact: true })
    .click();
  await page
    .getByText("Formulário criado e disponível às hospedagens vinculadas.")
    .waitFor();
  const lodge = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const mobile = await lodge.newPage();
  mobile.on("pageerror", (e) => pageErrors.push(e.message));
  await mobile.goto(base + "/login");
  await mobile.getByPlaceholder("seu@email.com").fill(login);
  await mobile.locator("input[type=password]").fill("browser-test-password");
  await mobile.getByRole("button", { name: /Entrar|Acessar/ }).click();
  await mobile.waitForURL("**/formularios");
  await mobile
    .getByRole("link", { name: /Preencher/ })
    .first()
    .click();
  await mobile.getByLabel("Taxa de ocupação (%) *", { exact: true }).fill("0");
  await mobile
    .getByRole("button", { name: "Salvar rascunho", exact: true })
    .click();
  await mobile.getByText("Rascunho salvo no banco.").waitFor();
  await mobile.reload();
  await mobile.getByLabel("Taxa de ocupação (%) *", { exact: true }).waitFor();
  assert.equal(
    await mobile
      .getByLabel("Taxa de ocupação (%) *", { exact: true })
      .inputValue(),
    "0",
  );
  await mobile
    .getByRole("button", { name: "Revisar respostas", exact: true })
    .click();
  await mobile
    .getByRole("button", { name: "Confirmar revisão", exact: true })
    .click();
  await mobile
    .getByRole("button", { name: "Enviar pesquisa", exact: true })
    .click();
  await mobile.waitForURL("**/confirmacao");
  await mobile
    .getByRole("heading", { name: "✓ Pesquisa enviada com sucesso" })
    .waitFor();
  assert(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 2,
    ),
    "Overflow horizontal no celular",
  );
  // Exercise the complete UI upload → validation → database → inventory flow.
  await page.goto(base + "/secretaria/importacao");
  await page.getByLabel("Referência do lote", {exact:true}).fill("2026-11");
  const importedName="FICTICIO Browser Import "+Date.now();
  await page.locator('input[type=file]').setInputFiles({name:"inventario-browser.csv",mimeType:"text/csv",buffer:Buffer.from("\ufeffnome;segmento;endereco;latitude;longitude\n"+importedName+";hospedagem;Rua de teste;-20.75;-48.9\n")});
  await page.getByRole("button",{name:"Ler arquivo",exact:true}).click();
  await page.getByRole("button",{name:"Validar mapeamento",exact:true}).click();
  await page.getByRole("button",{name:"Confirmar importação",exact:true}).click();
  await page.getByRole("status").filter({hasText:"linhas válidas"}).waitFor();
  await page.goto(base+"/secretaria/inventario");
  await page.getByLabel("Nome",{exact:true}).fill(importedName);
  await page.getByRole("button",{name:"Buscar",exact:true}).click();
  await page.getByRole("cell",{name:importedName,exact:true}).waitFor();
  // TST-02: arquivo de ocupação → validação com pendência → banco → API →
  // tela de Ocupação → Visão geral. O mês é único por execução para que os
  // números conferidos no dashboard venham só deste arquivo.
  const year = 2200 + (Math.floor(Date.now() / 1000) % 7000);
  const month = `${year}-01`;
  const occupancyFile = `ocupacao-e2e-${year}.csv`;
  await page.goto(base + "/secretaria/importacao");
  // O nome acessível do <select> dentro do <label> inclui a opção atual
  // ("Conjunto inventario"), por isso a busca é pelo início do texto.
  await page.getByLabel(/^Conjunto/).selectOption("ocupacao");
  await page.getByLabel("Referência do lote", { exact: true }).fill(month);
  await page.locator("input[type=file]").setInputFiles({
    name: occupancyFile,
    mimeType: "text/csv",
    buffer: Buffer.from(
      "mes_referencia;ocupacao_percentual;fluxo_pessoas;tipo_dado\n" +
        `${month};65.5;120;CONSOLIDADO\n` +
        `${month};101;5;consolidado\n`,
    ),
  });
  await page.getByRole("button", { name: "Ler arquivo", exact: true }).click();
  await page
    .getByRole("button", { name: "Validar mapeamento", exact: true })
    .click();
  await page.getByText("1 válidas de 2 linhas.").waitFor();
  await page
    .getByRole("cell", { name: "ocupacao_percentual: fora dos limites" })
    .waitFor();
  const confirm = page.getByRole("button", {
    name: "Confirmar importação",
    exact: true,
  });
  assert(await confirm.isDisabled(), "Confirmou com pendência sem opção explícita");
  await page.getByLabel(/Confirmar somente as linhas válidas/).check();
  await confirm.click();
  await page.getByRole("status").filter({ hasText: "linhas válidas" }).waitFor();
  const cells = async (row) =>
    (await row.getByRole("cell").allTextContents()).map((t) => t.trim());
  await page.goto(base + "/secretaria/ocupacao");
  await page.getByLabel("De", { exact: true }).fill(`${month}-01`);
  await page.getByLabel("Até", { exact: true }).fill(`${month}-28`);
  const detail = page.getByRole("row").filter({ hasText: occupancyFile });
  await detail.waitFor();
  assert.equal(await detail.count(), 1, "A linha inválida não deveria ser gravada");
  assert.deepEqual((await cells(detail)).slice(2, 5), ["65.5", "120", occupancyFile]);
  await page.goto(base + "/secretaria/painel");
  await page.getByLabel("De", { exact: true }).fill(`${month}-01`);
  await page.getByLabel("Até", { exact: true }).fill(`${month}-28`);
  const monthly = page.getByRole("row").filter({ hasText: `${month}-01` });
  await monthly.first().waitFor();
  assert.deepEqual(await cells(monthly.first()), [`${month}-01`, "65.5", "120", "1"]);
  await page.goto(base+"/secretaria/relatorios");
  const downloadPromise=page.waitForEvent("download");
  await page.getByRole("button",{name:"Exportar",exact:true}).click();
  const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),"oto-inventario.csv");
  await page.goto(base + "/secretaria/painel");
  await page
    .getByRole("heading", { name: "Visão geral", exact: true })
    .waitFor();
  await page.screenshot({
    path: process.env.OTO_DESKTOP_SCREENSHOT ?? "/tmp/oto-complete-desktop.png",
    fullPage: true,
  });
  await mobile.screenshot({
    path: process.env.OTO_MOBILE_SCREENSHOT ?? "/tmp/oto-complete-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(pageErrors, []);
  console.log(
    "OK navegador: login, 8 módulos, cadastro, publicação, hospedagem no celular, rascunho persistido, revisão, envio, confirmação real, importação de inventário, importação de ocupação com pendência até a tela de Ocupação e a Visão geral, e download CSV. Sem erros JavaScript.",
  );
  await lodge.close();
} finally {
  await browser.close();
}
