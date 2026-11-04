# OTO — dicionário de dados: comprovado x provisório

**Estado:** versão de desenvolvimento, aguardando a estrutura de planilhas e o dicionário com tipos de dados enviados por Daniel no grupo da equipe.

O banco não depende de acesso aos dados confidenciais. A equipe só precisa dos **nomes das abas**, **nomes de cada coluna**, **tipos de dados**, **nulidade/obrigatoriedade** e **regras de negócio**. Evite enviar qualquer linha real com dados pessoais ou sigilosos.

## Fontes já inspecionadas
- Plano de Projeto (stack React/FastAPI/Pandas/PostgreSQL).
- REQ-01: mapeamento AS-IS das fontes (inventário, pesquisa, ISSQN, ODS, indicadores e bases externas).
- DER do Figma `OTO — Modelagem do banco de dados`.

## Campos já previstos no Figma
| Tabela | Campo | PostgreSQL proposto | Situação |
|---|---|---|---|
| categoria_inventario | id; nome | bigint; varchar(100) | Proposta Figma |
| registro_inventario | id; categoria_id; nome; descricao | bigint; bigint; varchar(200); text | Proposta Figma |
| registro_inventario | endereco; bairro; latitude; longitude | varchar(255); varchar(120); numeric(9,6); numeric(9,6) | Proposta Figma; nullable |
| fonte_dados | id; nome; descricao; situacao_carga | bigint; varchar(200); text; varchar(30) | Proposta Figma |
| conjunto_pesquisa | id; nome; descricao; codigo | bigint; varchar(200); text; varchar(50) | Proposta Figma |
| usuario | id; nome; identificador; ativo | bigint; varchar(150); varchar(200); boolean | Suporte hipotético |
| importacao | fonte_id; conjunto_id; usuario_responsavel_id | bigint (FK) | Proposta Figma |
| importacao | referencia; nome_arquivo; hash_arquivo; status | varchar(50); varchar(255); varchar(128); varchar(30) | Proposta Figma |
| importacao | linhas_total; linhas_validas; linhas_pendentes; data_importacao | integer; integer; integer; timestamptz | Proposta Figma |
| erro_importacao | lote_id; linha; campo; tipo; descricao | bigint; integer; varchar(100); varchar(50); text | Proposta Figma |
| ocupacao_fluxo | lote_id; estabelecimento_id; mes_referencia | bigint; bigint; date | Proposta Figma |
| ocupacao_fluxo | ocupacao_percentual; fluxo_pessoas; tipo_dado | numeric(5,2); integer; varchar(20) | Proposta Figma |
| diaria_media | lote_id; estabelecimento_id; mes_referencia; valor | bigint; bigint; date; numeric(12,2) | Proposta Figma |
| demanda_turistica | lote_id; referencia; origem_uf | bigint; varchar(50); char(2) | Campos adicionais reais pendentes |
| controle_pesquisa | lote_id; conjunto_id; referencia | bigint; bigint; varchar(50) | Campos adicionais reais pendentes |
| indicador | nome; unidade; metodologia | varchar(200); varchar(60); text | Fase posterior |
| observacao_indicador | indicador_id; fonte_id; lote_id; referencia; valor | bigint; bigint; bigint; varchar(50); numeric(18,4) | Fase posterior |
| ods; indicador_ods | ids/numero/nome; associacao | integer/bigint, varchar, text | Fase posterior |

Outras tabelas documentadas no DDL: `relatorio`, `exportacao`, `relatorio_lote`.

## Dependências do material do Daniel
- Mapear todas as abas do inventário e suas estruturas (algumas categorias exigem campos específicos).
- Confirmar o **grão** de ocupação (por estabelecimento/período; consolidado/expectativa) e o de demanda (resposta individual).
- Definir perguntas, tipos e domínios reais da pesquisa de demanda e do controle.
- Determinar se os campos de ISSQN, CAGED, CIET e ODS precisam de tabelas especializadas.
- Normalizar datas, texto, percentuais e dinheiro; definir formatos compatíveis com PostgreSQL.
- Validar PK/FK a partir de identificadores estáveis (evitar relacionamento automático por nome fantasia).

`dados_originais JSONB`, `linha_origem` e as tabelas adicionais são recursos temporários de prototipagem e rastreabilidade. Não substituem a normalização final.

## Dados de teste
O arquivo `db/seeds/001_demo.sql` injeta **somente dados sintéticos**, rotulados como fictícios. Os indicadores agregados não correspondem a estatísticas oficiais e não são calculados a partir das 592 respostas brutas. Nunca publicar números sintéticos como números reais do município.
