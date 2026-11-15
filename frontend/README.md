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

## Abas e fluxos por perfil

O login redireciona cada conta para a área do seu perfil. Existem somente `SECRETARIA` e `HOSPEDAGEM`; “Administrador” é o nome/papel de uma conta de Secretaria, não um perfil técnico adicional. As contas de demonstração foram nomeadas **Perfil da secretaria** e **Perfil da hospedagem**. O identificador e a senha usados para entrar continuam sendo os da tabela acima.

### Perfil Secretaria

#### Visão geral

**Rota:** `/secretaria/painel`.

É o painel de acompanhamento do banco conectado. Mostra totais do inventário, formulários, respostas enviadas e importações, além de fluxo, ocupação, diária, origem da demanda, fontes disponíveis e observações de ISSQN/CAGED/transporte.

- **De / Até:** filtram as séries analíticas por período; deixe vazios para consultar todo o intervalo disponível.
- **Consolidado / Expectativa:** separam os registros de ocupação e fluxo. Expectativa é um dado informado/importado; o sistema não faz previsão automática.
- **Totais cadastrais:** são contagens gerais e não variam com o filtro analítico de datas.
- **Médias:** o painel identifica a média simples das médias mensais; não é uma média ponderada pela capacidade dos hotéis.
- **Campos vazios:** “—” e “Nenhum dado disponível” significam ausência de observações, não falha no cadastro do inventário.

A fonte precisa ter sido carregada para alimentar os gráficos. ISSQN não é apresentado como renda turística e medidas diferentes do CAGED não são somadas como se fossem equivalentes.

#### Ocupação hoteleira

**Rota:** `/secretaria/ocupacao`.

Exibe os registros mensais de ocupação percentual e fluxo de pessoas, com estabelecimento quando informado e arquivo de origem. Permite filtrar período, alternar consolidado/expectativa e navegar entre páginas. Serve para conferir os registros que alimentam a visão geral; não cria um formulário nem calcula previsões.

#### Dados de pesquisas

**Rota:** `/secretaria/pesquisas`.

Reúne a criação dos formulários, os conjuntos importados e o acompanhamento das respostas.

1. Em **Nova pesquisa**, informe título, referência e prazo.
2. Defina as perguntas, cada uma com chave técnica única, título, tipo e indicação de obrigatoriedade no envio. Tipos: texto, inteiro, decimal, percentual e Sim/Não.
3. Clique em **Publicar formulário**. Ele fica disponível para todas as hospedagens vinculadas a contas ativas, sem escolha individual de destinatários.
4. Em **Acompanhamento da coleta**, consulte prazo, quantidade de enviadas e hospedagens com acesso.
5. Clique em **Ver respostas / prazo**. Uma seção com o nome da pesquisa aparece **abaixo da tabela**, na mesma página; role para baixo se necessário.
6. Nessa seção, consulte as respostas/rascunhos existentes, atualize o prazo ou exporte todos os formulários em CSV.

Se a lista de respostas estiver vazia, ainda não há resposta salva para aquela pesquisa. Um formulário publicado não cria respostas automaticamente. Prorrogar o prazo não desbloqueia respostas já enviadas.

**Conjuntos importados** lista as bases de pesquisa carregadas por arquivos. Essa lista é diferente dos formulários criados no site. Respostas de perguntas dinâmicas não alimentam automaticamente as tabelas analíticas de ocupação/diária; essas séries usam a importação com mapeamento explícito.

#### Consulta do inventário

**Rota:** `/secretaria/inventario`.

Permite buscar por nome e filtrar por segmento ou situação de conferência. Em **Novo registro**, crie o cadastro. Em **Abrir ficha**, consulte/edite identificação, descrição, endereço, coordenadas e conferência.

Depois de salvar o cadastro, vincule os segmentos correspondentes. Um mesmo registro pode ter vários segmentos. A ficha também permite preencher campos tipados do catálogo, contatos/canais, atividades/CNAE e CADASTUR. Contatos ficam internos por padrão. Coordenadas são opcionais, mas latitude e longitude devem ser informadas juntas. Zero e Não não devem substituir valores desconhecidos.

Para criar um login de hospedagem, o cadastro precisa estar vinculado ao segmento hospedagem. Criar o registro no inventário, sozinho, não cria uma conta de usuário. A interface não remove cadastros mestres nem desvincula segmentos com respostas.

#### Mapa demonstrativo

**Rota:** `/secretaria/mapa`.

Exibe os cadastros com coordenadas válidas em mapa interativo, acompanhado da lista e da tabela de registros.

- Busque nome, segmento ou bairro; filtre por segmento e por presença de coordenadas.
- A legenda identifica os segmentos. Marcadores numerados agrupam registros com a mesma coordenada; clique para escolher um cadastro do grupo.
- Clique em um marcador ou nome da lista para consultar detalhes, latitude/longitude e abrir a ficha.
- **Voltar para Olímpia** retorna à referência visual da cidade. **Enquadrar todos** ajusta o mapa a todos os pontos do filtro, inclusive os distantes.
- Um aviso destaca pontos a mais de aproximadamente 80 km da referência para revisão. Esse limite é um auxílio visual, não a divisa oficial do município. Nenhuma coordenada é alterada automaticamente.
- Cadastros sem coordenadas continuam na tabela, mas não recebem um marcador. A base OpenStreetMap depende de internet.

Coordenadas fictícias também podem estar sobrepostas ou fora da cidade. Confira sinais e valores ao cadastrar; a posição apresentada corresponde aos dados armazenados.

#### Importação

**Rota:** `/secretaria/importacao`.

Carrega arquivos com rastreabilidade. Conjuntos disponíveis: inventário, ocupação/fluxo, diária, demanda, controle, ISSQN, CAGED, veículos e fretamento.

1. Escolha o conjunto, preencha a referência do lote e selecione o CSV UTF-8 ou XLSX.
2. **Ler arquivo:** obtém colunas e amostra. Ainda não grava os dados de negócio.
3. **Mapear colunas:** relacione cada campo OTO à coluna de origem; os nomes conhecidos são sugeridos automaticamente.
4. **Validar mapeamento:** confira as linhas válidas e as pendências.
5. Corrija o arquivo ou marque explicitamente a importação apenas das linhas válidas; as inválidas ficam registradas como pendências.
6. **Confirmar importação:** grava os dados. O histórico mostra lote, arquivo, referência e totais.
7. **Ver erros** consulta pendências; **Ver linhas de origem** consulta os dados originais preservados dos lotes novos.

Limites: 10 MB, 5.000 linhas e 150 colunas; cabeçalho na primeira linha; no XLSX é lida a primeira aba e fórmulas precisam ser substituídas por valores. A repetição do mesmo arquivo para o mesmo conjunto é bloqueada pelo hash. Os dados econômicos/de transporte usam observações com mês, medida, valor, unidade e recorte; não há sincronização automática com serviços oficiais.

#### Sustentabilidade ODS

**Rota:** `/secretaria/sustentabilidade`.

Cadastra indicadores de sustentabilidade e seus vínculos com os Objetivos de Desenvolvimento Sustentável (ODS). Há duas etapas diferentes:

1. **Novo indicador:** defina nome, unidade, metodologia e, se aplicável, números ODS de 1 a 17 separados por vírgula. Isso descreve o que será medido.
2. **Registrar observação:** selecione um indicador, informe referência, valor e fonte. Isso registra um resultado daquele indicador.

Exemplo fictício: crie “Hospedagens com coleta seletiva”, unidade “percentual”, metodologia “hospedagens com coleta seletiva / total pesquisado × 100”. Depois registre uma observação com referência `2026-11`, valor `60` e fonte “Pesquisa fictícia”. A tabela exibirá esse valor como 60 na unidade cadastrada.

A tela lista o último valor cadastrado e sua referência. Ela **não calcula automaticamente a metodologia** nem consolida as respostas dos formulários em indicadores ODS. Vínculos e interpretações precisam ser definidos pela equipe; não representam certificação ou progresso municipal oficial.

#### Relatórios e exportações

**Rota:** `/secretaria/relatorios`.

Escolha o conjunto e o formato, confira a prévia e clique em **Exportar**. CSV e XLSX permitem trabalhar com os dados em planilhas; PDF gera um relatório técnico básico. O histórico registra as exportações realizadas.

A prévia mostra até 50 linhas e a exportação admite até 10.000. Filtros de datas estão disponíveis para ocupação, diária e bases externas. Para os demais conjuntos, a exportação usa os registros disponíveis sem filtro de datas. Um arquivo gerado pode conter dados fictícios se esses forem os dados carregados no banco.

#### Usuários e acessos

**Rota:** `/secretaria/usuarios`.

Crie contas com nome, identificador, senha inicial e perfil. Para `HOSPEDAGEM`, selecione um estabelecimento vinculado ao segmento hospedagem; `SECRETARIA` pode ser criado sem estabelecimento. A senha deve ter pelo menos 12 caracteres e no máximo 72 bytes.

Na lista, ative/desative contas ou redefina senhas. Não é permitido desativar a própria conta. A desativação e a redefinição de senha invalidam as sessões da conta na próxima requisição. O nome exibido pode ser “Perfil da secretaria”, mas a permissão é determinada pelo campo `perfil`, não pelo nome.

#### Minha conta / senha

**Rota:** `/conta`, disponível nos dois perfis.

Informe a senha atual, a nova e sua confirmação. Depois de salvar, entre novamente. Se esqueceu a senha atual, outra conta de Secretaria pode redefini-la em **Usuários e acessos**; não há recuperação por e-mail nesta versão.

### Perfil Hospedagem

A conta acessa somente os formulários e as respostas do seu estabelecimento vinculado. Não recebe as abas administrativas de inventário, importações, indicadores, relatórios ou usuários da Secretaria.

#### Meus Formulários

**Rota:** `/formularios`.

Lista as pesquisas disponibilizadas pela Secretaria, com título, referência, prazo e situação. Os filtros são:

| Filtro | Significado |
| --- | --- |
| **Todos** | Todos os formulários da página atual. |
| **Disponíveis** | Ainda não há resposta salva pelo estabelecimento. |
| **Pendentes** | Há um rascunho salvo, ainda não enviado. |
| **Enviados** | O estabelecimento já confirmou o envio. |

A listagem possui paginação. **Preencher** abre uma pesquisa nova; **Continuar** retoma o rascunho. A Secretaria publica o formulário, mas quem o responde é a conta da hospedagem.

#### Preencher, revisar e enviar

**Rota:** `/formularios/:id/preencher`; é um fluxo iniciado pela lista, não uma aba administrativa.

1. Responda às perguntas do formulário.
2. Use **Salvar rascunho** para gravar o progresso e retomar depois. Sem salvar, o que foi apenas digitado pode ser perdido ao sair.
3. Clique em **Revisar respostas** e confira o conteúdo. Use **Corrigir** se precisar voltar.
4. Confirme a revisão e clique em **Enviar pesquisa**.
5. Campos obrigatórios são exigidos no envio. Respostas enviadas ficam bloqueadas; após o prazo, o sistema também bloqueia salvar/enviar.

Zero e Não são respostas válidas. Cada resposta pertence ao estabelecimento autenticado; a hospedagem não escolhe outro cadastro para responder por ele.

#### Confirmação da pesquisa

**Rota:** `/formularios/:id/confirmacao`; aparece após um envio confirmado pelo banco.

Mostra a pesquisa e a data do envio, com retorno a **Meus formulários**. Abrir a URL sozinho não cria nem envia uma resposta: sem envio confirmado, a página informa que ele ainda não ocorreu.

#### Minha conta / senha e Sair

**Minha conta / senha** permite alterar a senha como descrito na seção compartilhada. **Sair** encerra a sessão e retorna ao login. A Hospedagem não pode criar contas ou redefinir a senha de outra pessoa.

### Avisos e estados da interface

Mensagens de sucesso e erro têm um **× à direita** para fechar. Fechar a mensagem não desfaz a operação, não apaga dados e não confirma uma gravação que falhou. Uma nova ação pode mostrar outro aviso. Estados de carregamento e listas vazias indicam a situação da consulta; por exemplo, “Nenhum registro encontrado” nas respostas pode significar que ninguém salvou ou enviou uma resposta ainda.

## CSVs fictícios para demonstrar as análises

Os arquivos ficam em [`database/exemplos_csv/`](../database/exemplos_csv/LEIA-ME.md):

| CSV | Conjunto a selecionar | O que alimenta |
| --- | --- | --- |
| `FICTICIO_ocupacao_fluxo_2026.csv` | `ocupacao` | Fluxo e ocupação, em consolidado/expectativa. |
| `FICTICIO_diaria_media_2026.csv` | `diaria` | Diária média mensal. |
| `FICTICIO_demanda_origem_2026.csv` | `demanda` | Origem da demanda por UF. |

Importe cada arquivo uma vez, seguindo a aba Importação. Sem outras cargas e com datas vazias no consolidado, os exemplos produzem fluxo de **233.700 pessoas**, ocupação média mensal de **74,6%** e diária média mensal de **R$ 354,00**. O terceiro CSV contém 39 observações sintéticas de origem. Se já houver outros dados no banco, os resultados podem ser diferentes.

Os arquivos são exemplos totalmente fictícios. Clonar o repositório não carrega automaticamente o banco nem os CSVs. Os cadastros do seed do inventário, sozinhos, não preenchem esses indicadores.

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
