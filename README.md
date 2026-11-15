# Observatório de Turismo de Olímpia (OTO)

Aplicação web para apoiar a Secretaria de Turismo de Olímpia na organização do inventário turístico, coleta de pesquisas e consulta de informações para gestão do turismo. Projeto acadêmico PDSI.

O backend oferece uma API HTTP para o frontend consumir. O frontend React/Vite já está integrado à API, a partir dos fluxos e do visual existente do Figma.

## Organização do repositório

| Pasta | Conteúdo | Documentação |
| --- | --- | --- |
| `frontend/` | Interface React/TypeScript, navegação, login e módulos integrados | [Executar frontend](frontend/README.md) |
| `backend/` | API Java 21, Spring Boot, autenticação, permissões e migrações Flyway | [Passo a passo do backend](backend/README.md) |
| `database/` | Estrutura PostgreSQL, catálogo de campos e scripts de dados fictícios | [Guia do banco](database/README.md) |

- [Banco, usuários e tipos de acesso](backend/sobre-o-banco.md)
- [Contrato de integração para o frontend](backend/docs/frontend.md)
- [Verificação e testes](backend/docs/verificacao.md)
- [Design no Figma](https://www.figma.com/design/0OqnmHVvJakoG8gGGZkNe6/Observat%C3%B3rio-de-Turismo-de-Ol%C3%ADmpia?node-id=0-1)

## Contas de teste para a equipe

Acesse http://localhost:5173/login com uma das contas abaixo:

| Perfil | Login | Senha inicial |
| --- | --- | --- |
| **Secretaria** | `secretaria@oto.local` | `Oto-O536MjGrk2mNK-QT` |
| **Hospedagem** | `hospedagem@oto.local` | `Oto-uvg1mEEXI6jnu3ZR` |

Estas credenciais de demonstração foram registradas na documentação por decisão da responsável pelo repositório privado. As duas contas já foram criadas no banco local usado durante o desenvolvimento; clonar o repositório não copia esse banco nem cria essas contas automaticamente. Em outro ambiente, crie-as pela interface **Usuários e acessos**, após configurar o primeiro administrador. A conta de Hospedagem está vinculada ao cadastro fictício **1011 — Meios de hospedagem 01**; em outro banco, escolha o cadastro correspondente do segmento hospedagem.

Secretaria administra os módulos do sistema. Hospedagem preenche os formulários do estabelecimento vinculado. A conta `admin@oto.local` continua existindo separadamente, com a senha escolhida na configuração. As senhas das contas permanecem como hash BCrypt no PostgreSQL; a tabela acima documenta apenas as credenciais de teste.

## Como começar

Siga o [README do backend](backend/README.md).

| Serviço | Endereço local |
| --- | --- |
| API | http://localhost:8080/api |
| Documentação Swagger | http://localhost:8080/swagger-ui/index.html |
| PostgreSQL | `localhost:5432`, banco `oto` |
| Frontend permitido por padrão no CORS | http://localhost:5173 |

O PostgreSQL armazena os dados e o GitHub armazena os arquivos do projeto.
Cada pessoa precisa configurar sua própria conexão. Dados inseridos no banco local não são enviados ao GitHub (esses dados são ficticios).

## Perfis de acesso e abas do sistema

Existem **dois perfis**: `SECRETARIA` e `HOSPEDAGEM`. O nome exibido na tela identifica a conta, não um terceiro perfil: tanto `admin@oto.local` quanto `secretaria@oto.local` têm acesso de Secretaria. As contas de demonstração aparecem como **Perfil da secretaria** e **Perfil da hospedagem**.

### Secretaria

| Aba | Para que serve |
| --- | --- |
| **Visão geral** | Consultar contagens, fluxo, ocupação, diária média, origem da demanda e observações de fontes externas. Séries analíticas têm filtros de período e modalidade; ausência de dados aparece como “—” ou estado vazio. |
| **Ocupação hoteleira** | Consultar observações mensais de ocupação e fluxo, separando consolidado de expectativa e identificando o arquivo de origem. |
| **Dados de pesquisas** | Criar formulários com perguntas e prazo, acompanhar a coleta, consultar respostas, prorrogar prazo e consultar os conjuntos de pesquisas importados. |
| **Consulta** (Inventário) | Buscar, filtrar, criar e editar cadastros, vincular segmentos e preencher campos, contatos, CNAE e CADASTUR. |
| **Mapa demonstrativo** | Explorar cadastros georreferenciados com filtros, legenda e agrupamento de pontos coincidentes. Selecionar um cadastro e abrir sua ficha. |
| **Importação** | Carregar CSV/XLSX, mapear colunas, validar, conferir pendências e confirmar a gravação. Consultar histórico e linhas de origem. |
| **Sustentabilidade ODS** | Cadastrar indicadores, unidades, metodologia e vínculos ODS; registrar valores por referência e fonte. O cálculo dos valores não é automático. |
| **Relatórios e exportações** | Conferir prévias e baixar registros em CSV, XLSX ou PDF, com recortes disponíveis por conjunto. |
| **Usuários e acessos** | Criar contas de Secretaria/Hospedagem, vincular hospedagens, ativar/desativar acessos e redefinir senhas. |
| **Minha conta / senha** | Alterar a própria senha e entrar novamente. |

### Hospedagem

| Aba ou etapa | Para que serve |
| --- | --- |
| **Meus Formulários** | Listar pesquisas disponíveis para o estabelecimento vinculado, com filtros de disponíveis, pendentes/rascunhos e enviadas. |
| **Preencher → Revisar → Enviar** | Responder às perguntas, salvar rascunho, retomar depois e confirmar o envio. Respostas enviadas não podem ser alteradas. |
| **Confirmação da pesquisa** | Verificar se o banco confirmou o envio e consultar sua data. É uma etapa do formulário, não uma aba independente do menu. |
| **Minha conta / senha** | Alterar a própria senha e entrar novamente. |

**Sair** encerra a sessão em ambos os perfis. Hospedagem não acessa os módulos administrativos da Secretaria nem as respostas de outro estabelecimento. Formulários publicados são disponibilizados a todas as hospedagens vinculadas; não há seleção individual de destinatários nesta versão. Ainda não existe um perfil público.

A explicação detalhada das abas, rotas e exemplos de uso está no [README do frontend](frontend/README.md#abas-e-fluxos-por-perfil).

## Dados fictícios para testar as análises

Os [CSVs de demonstração](database/exemplos_csv/LEIA-ME.md) ficam em `database/exemplos_csv/`. São arquivos separados para `ocupacao`, `diaria` e `demanda`; cada um deve ser importado no conjunto correspondente pela interface. Eles não são carregados automaticamente ao clonar o projeto.

O seed inicial adiciona cadastros fictícios do inventário, mas não cria séries de ocupação, diária e demanda. Por isso o inventário pode ter registros enquanto os gráficos continuam vazios. Importar os CSVs de análises preenche essas consultas. Os dados permanecem fictícios; carregar um arquivo não os torna oficiais.

## Situação atual

Login pelo navegador, gestão de contas/senhas, inventário, mapa, pesquisas e formulários, importação CSV/XLSX com validação, indicadores/ODS e relatórios CSV/XLSX/PDF estão integrados ao PostgreSQL. Os gráficos usam dados carregados, e não números fixos de demonstração. Sem dados, a interface informa a ausência.

Veja [guia rápido de uso](docs/guia-de-uso.md) e [escopo, fontes e testes da entrega](docs/entrega-funcional.md). O aceite do PO, arquivos oficiais das fontes e publicação de homologação continuam sendo etapas externas à validação local. O quadro Trello informado não ficou acessível pela conexão; os critérios foram confrontados com o plano, backlog inicial do Drive e Figma.

## Iniciar o frontend

Com o backend já rodando, em outra aba:

```bash
cd ~/pdsi/frontend
npm ci
npm run dev
```

Abra http://localhost:5173/login e use a conta cadastrada no banco. Para configurar o backend e o primeiro administrador, siga [backend/README.md](backend/README.md).

## Ambiente integrado opcional com Docker

O caminho local Homebrew continua funcionando. Para demonstrar todos os serviços em um ambiente separado, com Docker instalado:

```bash
cd ~/pdsi
cp .env.example .env
# Edite .env e defina senhas próprias antes de iniciar.
docker compose up --build -d
docker compose logs -f api
```

Depois da inicialização, abra http://localhost:8081/login. Esse Compose cria outro banco em volume próprio; não importa automaticamente os dados do PostgreSQL local. Não apague volumes para atualizar. Em publicação externa, configure domínio/HTTPS, senhas apropriadas, `COOKIE_SECURE=true` e a origem exata do frontend. A porta está limitada ao acesso local nesta configuração de demonstração. A implantação definitiva deve ser validada na infraestrutura de homologação.

Os dados de demonstração são inteiramente fictícios. As migrações carregam metadados (9 segmentos e 1.050 campos), mas não carregam os 19 cadastros fictícios automaticamente. Cada ambiente deve seguir os guias de seeds e conexão.
