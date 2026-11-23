# Roteiro de aceitação — TST-03

Roteiro para a sessão de aceite do Observatório de Turismo de Olímpia (OTO) com o PO e a equipe da Secretaria de Turismo. Cada caso descreve o que fazer e o que deve acontecer. Durante a sessão, a equipe marca o resultado e anota o que o PO pedir.

## Antes da sessão

| Item | Como preparar |
| --- | --- |
| Ambiente | Sistema rodando com **banco de demonstração**, nunca o de produção. Com Docker: `docker compose up --build -d` e acesso em http://localhost:8081 |
| Dados | Inventário fictício carregado (`database/db/seeds/002_demo_inventario.sql`, 19 cadastros) |
| Contas | `secretaria@oto.local` (perfil Secretaria) e `hospedagem@oto.local` (perfil Hospedagem, vinculada a **1011 — Meios de hospedagem 01**), criadas em **Usuários e acessos** |
| Arquivos | Os CSVs de `database/exemplos_csv/` e os dois arquivos de teste da seção [Arquivos para os casos de qualidade](#arquivos-para-os-casos-de-qualidade) |
| Navegadores | Um computador para a Secretaria e um celular (ou janela anônima em modo celular) para a Hospedagem |
| Testes automáticos | Rodados e aprovados na mesma versão: `mvn test` no backend, `complete_test.py` e `npm run test:e2e` (ver [verificação](../backend/docs/verificacao.md)) |

Anote no topo da tabela de resultado a **versão testada**, que é o commit mostrado por `git log -1 --oneline`.

## Como marcar o resultado

- **OK**: aconteceu o resultado esperado.
- **Ajuste**: funciona, mas o PO pediu mudança (texto, ordem, regra). Registre em [Correções e pedidos](#correções-e-pedidos).
- **Falhou**: não aconteceu o resultado esperado. Registre como correção com prioridade.
- **N/A**: não se aplica nesta versão (explique em Observações).

## Casos de teste

### A. Acesso e perfis

| ID | Perfil | Passos | Resultado esperado | Resultado | Observações |
| --- | --- | --- | --- | --- | --- |
| A1 | Secretaria | Entrar com `secretaria@oto.local` | Abre a **Visão geral** com o menu da Secretaria | | |
| A2 | — | Tentar entrar com senha errada | Mensagem de credenciais inválidas; não entra | | |
| A3 | Hospedagem | Entrar com `hospedagem@oto.local` no celular | Abre **Meus Formulários**; o menu não mostra módulos da Secretaria | | |
| A4 | Hospedagem | Digitar na barra de endereço `/secretaria/painel` | Acesso negado ou volta para os formulários; nenhum dado administrativo aparece | | |
| A5 | Secretaria | Em **Usuários e acessos**, desativar a conta de Hospedagem e tentar usá-la | A Hospedagem perde o acesso na próxima ação. Reativar ao final | | |
| A6 | Ambos | Em **Minha conta / senha**, trocar a senha e entrar de novo | A senha nova funciona e a antiga não | | |

### B. Inventário turístico

| ID | Perfil | Passos | Resultado esperado | Resultado | Observações |
| --- | --- | --- | --- | --- | --- |
| B1 | Secretaria | Em **Consulta**, buscar "hospedagem" e filtrar por segmento | Lista apenas os cadastros que correspondem | | |
| B2 | Secretaria | Criar um cadastro com nome `  Pousada   Aceite  ` (espaços extras), endereço e coordenadas | Salva como **Pousada Aceite**, sem os espaços extras | | |
| B3 | Secretaria | Vincular o cadastro B2 ao segmento hospedagem e preencher campos, contato, CNAE e CADASTUR | Os dados ficam salvos ao reabrir a ficha | | |
| B4 | Secretaria | Criar outro cadastro chamado `POUSADA ACEITE` e vinculá-lo a hospedagem | O sistema **bloqueia** e informa o número do cadastro que já tem esse nome | | |
| B5 | Secretaria | Tentar salvar um cadastro sem nome, ou com latitude 95 | O sistema recusa e explica o motivo | | |
| B6 | Secretaria | Abrir o **Mapa demonstrativo**, filtrar e clicar no ponto do cadastro B2 | O ponto aparece na posição informada e abre a ficha | | |

### C. Importação e qualidade dos dados

| ID | Perfil | Passos | Resultado esperado | Resultado | Observações |
| --- | --- | --- | --- | --- | --- |
| C1 | Secretaria | Importar `FICTICIO_ocupacao_fluxo_2026.csv` (conjunto **ocupacao**): ler, validar e confirmar | Todas as linhas válidas; aparece no histórico de importações | | |
| C2 | Secretaria | Importar o **mesmo arquivo** de novo | O sistema bloqueia porque o arquivo já foi importado | | |
| C3 | Secretaria | Importar `qualidade-inventario.csv` (conjunto **inventario**) | A prévia aponta: nome obrigatório ausente, segmento desconhecido, coordenada fora do limite, nome já existente (B2) e linha repetida no arquivo. Só a linha "Hotel Aceite Novo" é válida | | |
| C4 | Secretaria | No caso C3, tentar confirmar sem marcar a opção de "somente válidas" | O botão de confirmar fica bloqueado | | |
| C5 | Secretaria | Marcar "somente as linhas válidas" e confirmar | Grava 1 cadastro e registra as demais como pendências, consultáveis no histórico | | |
| C6 | Secretaria | Importar `qualidade-ocupacao.csv` (conjunto **ocupacao**) | A prévia recusa: percentual 101, mês 15/11 (não é o primeiro dia), número com separador de milhar e modalidade "realizado". Aceita `CONSOLIDADO` em maiúsculas | | |

### D. Pesquisas com as hospedagens

| ID | Perfil | Passos | Resultado esperado | Resultado | Observações |
| --- | --- | --- | --- | --- | --- |
| D1 | Secretaria | Em **Dados de pesquisas**, criar e publicar um formulário com prazo futuro | O formulário fica disponível para as hospedagens | | |
| D2 | Hospedagem | Abrir o formulário, preencher ocupação **0** e salvar rascunho; recarregar a página | O valor 0 continua lá (zero não vira vazio) | | |
| D3 | Hospedagem | Tentar enviar sem uma resposta obrigatória | O sistema avisa qual resposta falta | | |
| D4 | Hospedagem | Preencher tudo, revisar e enviar | Aparece a confirmação com a data de envio | | |
| D5 | Hospedagem | Tentar alterar a resposta enviada | Não é permitido | | |
| D6 | Secretaria | Acompanhar a coleta, abrir a resposta e prorrogar o prazo | A resposta da hospedagem aparece; o prazo novo é salvo | | |

### E. Análises, indicadores e relatórios

| ID | Perfil | Passos | Resultado esperado | Resultado | Observações |
| --- | --- | --- | --- | --- | --- |
| E1 | Secretaria | Na **Visão geral**, filtrar jan–dez/2026, modalidade consolidado | Os números batem com o arquivo importado em C1 (conferir um mês na planilha) | | |
| E2 | Secretaria | Trocar a modalidade para expectativa | Os números mudam; consolidado e expectativa não se misturam | | |
| E3 | Secretaria | Filtrar um período sem dados | Aparece "—" ou estado vazio, nunca zero inventado | | |
| E4 | Secretaria | Em **Ocupação hoteleira**, conferir o arquivo de origem de cada linha | Cada linha mostra o nome do arquivo importado | | |
| E5 | Secretaria | Em **Sustentabilidade ODS**, cadastrar um indicador com vínculo ODS e registrar um valor | O indicador aparece com o valor, a referência e a fonte | | |
| E6 | Secretaria | Em **Relatórios e exportações**, baixar o inventário em CSV, XLSX e PDF | Os três arquivos abrem e mostram os mesmos registros da prévia | | |

### F. Avaliação geral do PO

| ID | Pergunta ao PO | Resposta |
| --- | --- | --- |
| F1 | Os nomes das telas e os textos estão claros para a equipe da Secretaria? | |
| F2 | Os indicadores da Visão geral são os que a Secretaria precisa acompanhar? Falta algum? | |
| F3 | As regras de validação da importação correspondem às planilhas reais que vocês recebem? | |
| F4 | O fluxo da Hospedagem no celular está simples o bastante para os estabelecimentos? | |
| F5 | Há algo que impede o uso desta versão? | |

## Arquivos para os casos de qualidade

Salve cada bloco como CSV UTF-8 com o nome indicado. Os dados são fictícios.

`qualidade-inventario.csv` (caso C3; rode depois do B2):

```csv
nome;segmento;latitude;longitude
;hospedagem;;
Hotel Aceite Velho;hotelaria;;
Hotel Aceite Mapa;hospedagem;95;-48.9
pousada aceite;Hospedagem;;
Hotel Aceite Novo;HOSPEDAGEM;-20.74;-48.91
HOTEL  ACEITE NOVO;hospedagem;;
```

`qualidade-ocupacao.csv` (caso C6):

```csv
mes_referencia;ocupacao_percentual;fluxo_pessoas;tipo_dado
2027-01;101;100;consolidado
2027-01-15;70;100;consolidado
2027-01;70;1.200,5;consolidado
2027-01;70;100;realizado
2027-02;70;100;CONSOLIDADO
```

## Correções e pedidos

Uma linha por item levantado na sessão. Itens marcados como **Falhou** entram com prioridade alta.

| Nº | Caso | Descrição do problema ou pedido | Tipo (correção / ajuste / novo requisito) | Prioridade | Responsável | Situação |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

Itens classificados como **novo requisito** vão para o backlog no Trello e não bloqueiam o aceite desta versão.

## Registro do aceite

| Campo | Preenchimento |
| --- | --- |
| Data da sessão | |
| Versão testada (commit) | |
| Participantes | |
| Casos OK / Ajuste / Falhou / N/A | |
| Decisão do PO | ☐ Aceita ☐ Aceita com ajustes listados ☐ Não aceita |
| Condições para o aceite | |
| Assinatura ou confirmação do PO | |

Depois da sessão, faça o commit deste arquivo preenchido e mova o cartão TST-03 no Trello, anexando o link.
