# Frontend OTO

React, TypeScript e Vite, integrado à API Spring Boot. Não usa dados fixos para representar resultados reais. Navegação e componentes reutilizam as cores e o layout existentes do projeto e os fluxos do Figma.

## Executar no Mac

1. Inicie o PostgreSQL e o backend seguindo [backend/README.md](../backend/README.md). Use a API em `http://localhost:8080`.
2. Em outra aba:

```bash
cd ~/pdsi/frontend
npm ci
npm run dev
```

Abra http://localhost:5173/login. Use `admin@oto.local` e a senha já cadastrada no seu banco. Não existe senha padrão. Se o lockfile de uma versão antiga estiver desatualizado, execute `npm install` uma vez e versione o `package-lock.json` atualizado.

O Vite encaminha `/api` para `http://localhost:8080`; login, cookies e CSRF usam esse proxy. A porta 5173 é fixa para evitar iniciar silenciosamente em outra porta. Para outro endereço de API em testes, configure `API_PROXY_TARGET` no ambiente que inicia o Vite. Em produção, o Nginx fornece o frontend e encaminha `/api` no mesmo domínio.

## Contas de teste para a equipe

Acesse http://localhost:5173/login com uma das contas abaixo:

| Perfil | Login | Senha inicial |
| --- | --- | --- |
| **Secretaria** | `secretaria@oto.local` | `Oto-O536MjGrk2mNK-QT` |
| **Hospedagem** | `hospedagem@oto.local` | `Oto-uvg1mEEXI6jnu3ZR` |

Estas credenciais de demonstração foram registradas na documentação por decisão da responsável pelo repositório privado. As duas contas já foram criadas no banco local usado durante o desenvolvimento; clonar o repositório não copia esse banco nem cria essas contas automaticamente. Em outro ambiente, crie-as pela interface **Usuários e acessos**, após configurar o primeiro administrador. A conta de Hospedagem está vinculada ao cadastro fictício **1011 — Meios de hospedagem 01**; em outro banco, escolha o cadastro correspondente do segmento hospedagem.

Secretaria administra os módulos do sistema. Hospedagem preenche os formulários do estabelecimento vinculado. A conta `admin@oto.local` continua existindo separadamente, com a senha escolhida na configuração. As senhas das contas permanecem como hash BCrypt no PostgreSQL; a tabela acima documenta apenas as credenciais de teste.

## O que testar

- Entre como Secretaria, confira os totais e os gráficos. Sem observações, aparece estado vazio.
- Inventário: buscar/filtrar, criar, salvar, abrir novamente; vincular segmento, preencher valores tipados, contatos, CNAE e CADASTUR.
- Pesquisas: publicar formulário com perguntas e prazo; consultar respostas e prorrogar prazo.
- Usuários: criar uma conta de hospedagem vinculada a registro do segmento `hospedagem`; sair e entrar com ela.
- Hospedagem: preencher, salvar rascunho, recarregar, revisar e enviar. Confirmar que uma resposta enviada não pode ser editada.
- Importação: baixar um modelo, carregar CSV/XLSX, mapear, validar, conferir erros e confirmar. A prévia não grava dados de negócio.
- Painel: conferir a atualização após a carga; separar consolidado e expectativa e consultar origem dos dados externos.
- Relatórios: conferir prévia e baixar CSV, XLSX e PDF.
- Conta: alterar senha e entrar novamente; Secretaria pode redefinir a senha de outra conta.

## Build e testes

```bash
npm run build
```

Teste automatizado de navegador (somente ambiente descartável): instale um Chromium do Playwright com `npx playwright install chromium`, inicie API e frontend de testes e configure `OTO_WEB_URL`, `OTO_TEST_ADMIN` e `OTO_TEST_PASSWORD` no ambiente. Depois:

```bash
npm run test:e2e
```

O teste cria registros, conta de hospedagem e pesquisa. Não execute no banco de produção. Pode usar um Chrome já instalado com `CHROME_EXECUTABLE` apontando para o executável; caso contrário usa o Chromium do Playwright.

Veja [guia de uso](../docs/guia-de-uso.md) e [escopo e verificação](../docs/entrega-funcional.md).
