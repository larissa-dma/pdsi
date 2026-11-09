# Sobre o banco, usuários e acessos

## Conexão local

| Item | Configuração usada no desenvolvimento |
| --- | --- |
| Banco | `oto` |
| Servidor | `localhost` |
| Porta PostgreSQL | `5432` |
| URL JDBC | `jdbc:postgresql://localhost:5432/oto` |
| Usuário PostgreSQL no Mac da configuração inicial | `katielylacerda` |
| Senha PostgreSQL | Vazia apenas na instalação local validada; outras instalações podem exigir senha |
| Porta da API | `8080` |

O usuário PostgreSQL é a conta técnica que permite ao Java acessar tabelas. Os usuários do sistema ficam na tabela `usuario` e são usados no login HTTP. Não são a mesma coisa. `oto_app` é o usuário padrão do Compose; ele não é criado automaticamente pelo caminho `createdb oto` do Homebrew.

## Usuários conhecidos e exemplos

Esta lista documenta a configuração realizada e exemplos, não é uma consulta em tempo real ao banco.

| Identificador | Situação | Perfil | Vínculo |
| --- | --- | --- | --- |
| `admin@oto.local` | Criado no ambiente local durante a configuração | `SECRETARIA` | Sem estabelecimento (`null`) |
| `hospedagem@exemplo.invalid` | Exemplo do README; só existe se o passo de criação for executado | `HOSPEDAGEM` | Registro fictício `1011`, se o seed foi carregado |
| `operador@exemplo.invalid` | Presente no seed antigo `001_demo.sql`, não carregado no caminho atual | Padrão de V4: `HOSPEDAGEM` | Sem vínculo e sem senha; não é um login utilizável |

Não há senha padrão. Cada pessoa escolhe a senha ao criar o administrador ou outro usuário. As senhas são armazenadas como hash BCrypt em `senha_hash`, nunca como texto legível. Login exige usuário ativo e hash de senha preenchido. Trocar variáveis `ADMIN_*` não redefine senha existente. Recuperação/alteração de senha ainda não possui endpoint próprio.

## Tipos de acesso

| Operação | Sem login | SECRETARIA | HOSPEDAGEM |
| --- | --- | --- | --- |
| Gerar CSRF e consultar documentação Swagger | Sim | Sim | Sim |
| Fazer login (com CSRF) | Sim | Sim | Sim |
| Consultar a própria conta `/api/me` | Não | Sim | Sim |
| Criar usuários | Não | Sim | Não |
| Cadastrar/editar inventário e respostas tipadas | Não | Sim | Não |
| Consultar painel, indicadores e importações | Não | Sim | Não |
| Criar formulários e consultar respostas de todos | Não | Sim | Não |
| Listar/preencher formulários da hospedagem vinculada | Não | Só se possuir vínculo de hospedagem | Sim, com vínculo válido |
| Alterar uma resposta já enviada | Não | Não há endpoint para isso | Não |

As rotas `/api/secretaria/**` exigem `SECRETARIA`. As rotas `/api/formularios` usam o estabelecimento da conta autenticada, sem aceitar outro estabelecimento escolhido pelo cliente. O administrador inicial não possui vínculo e, por isso, deve usar as rotas de gestão de formulários. O perfil `ADMIN` não existe: o administrador usa `SECRETARIA`.

## Consultar os usuários que realmente existem

No terminal, com acesso ao PostgreSQL local:

```bash
psql -d oto -P pager=off -c "SELECT id,nome,identificador,perfil,ativo,estabelecimento_id FROM usuario ORDER BY id;"
```

Essa consulta não mostra hashes nem senhas. Para criar usuários pelo sistema, siga o passo 9 do [README do backend](README.md). Hospedagem exige `estabelecimentoId` de registro vinculado ao segmento `hospedagem`.

## Estrutura e migrações

| Grupo | Tabelas principais |
| --- | --- |
| Acesso | `usuario` |
| Inventário | `registro_inventario`, `inventario_segmento`, `inventario_vinculo_segmento`, `inventario_campo`, `inventario_resposta` |
| Complementos | `inventario_canal`, `inventario_atividade`, `inventario_cadastur`, `inventario_profissional` |
| Coleta por formulários | `formulario`, `formulario_resposta` |
| Origem e cargas | `fonte_dados`, `conjunto_pesquisa`, `importacao`, `erro_importacao` |
| Dados analíticos | `ocupacao_fluxo`, `diaria_media`, `demanda_turistica`, `controle_pesquisa` |
| Indicadores/relatórios | `indicador`, `observacao_indicador`, `ods`, `indicador_ods`, `relatorio`, `exportacao`, `relatorio_lote` |
| Histórico de migrações | `flyway_schema_history` |

Flyway aplica V1–V4 na inicialização do backend. V1–V3 reproduzem os arquivos originais de `database/db/migrations`; V4 adiciona autenticação e formulários. O catálogo inicial contém 9 segmentos e 1.050 campos, incluindo 153 posições auxiliares. Metadados não equivalem a empresas cadastradas.

O seed `002_demo_inventario.sql` cria 19 registros fictícios e 20 vínculos. Não cria usuários, formulários nem importações. O painel pode mostrar 19 registros e zero nos outros contadores. Datas, nomes e respostas do seed não representam dados reais da Prefeitura. Valores ausentes não devem virar zero ou falso automaticamente.

## Sessão e integração

Autenticação usa cookie `JSESSIONID`, não JWT. CSRF é exigido nas escritas e no login/logout. Busque `/api/csrf` novamente após login. O frontend deve enviar cookies (`credentials: 'include'`) e o cabeçalho retornado pelo CSRF. Sessão do curl e sessão do navegador são independentes; reiniciar a API encerra as sessões. Consulte o [contrato do frontend](docs/frontend.md).
