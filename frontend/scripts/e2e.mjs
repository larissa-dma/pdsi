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
  await page.getByLabel("Nome", { exact: true }).fill("Browser Test Hotel");
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
    "OK navegador: login, 8 módulos, cadastro, publicação, hospedagem no celular, rascunho persistido, revisão, envio, confirmação real, importação pela interface e download CSV. Sem erros JavaScript.",
  );
  await lodge.close();
} finally {
  await browser.close();
}
