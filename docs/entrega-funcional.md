# Entrega funcional local — 15/11/2026

## Referências e decisões

- [Plano do projeto](https://docs.google.com/document/d/1O_jhNM8CSjYdVQaxpp1HSp63WpKcVc-p/edit): requisitos RF01–RF08 e limites da primeira versão.
- [Backlog inicial](https://docs.google.com/spreadsheets/d/15FPwa-267awuvv1YPkFKsf0w2LThPnkVSQFTJUE58UY/edit), aba Backlog: critérios dos módulos, integração, testes, documentação e homologação.
- [Figma](https://www.figma.com/design/0OqnmHVvJakoG8gGGZkNe6/Observat%C3%B3rio-de-Turismo-de-Ol%C3%ADmpia?node-id=0-1): mapa de telas, inventário, importação, indicadores e fluxo da hospedagem.
- [Trello informado](https://trello.com/b/uYkj9W6C): a conexão não teve acesso ao quadro; tentativa pública retornou 401. Cartões atuais e alterações posteriores ao backlog inicial não foram conferidos. Nenhum cartão foi alterado.

O plano inicial cita Python/FastAPI. A implementação mantém Java 21/Spring Boot por decisão expressa da usuária na configuração deste repositório em 09/11/2026. Essa mudança está registrada aqui; o documento remoto não foi editado. A interface existente React/Vite/TypeScript e seus tokens foram reutilizados; não se trata de certificação de igualdade visual pixel a pixel de todas as telas.

## Cobertura funcional

| Área | Implementação local | Validação externa restante |
| --- | --- | --- |
| RF01 / DB / API | PostgreSQL versionado, migrações V1–V6 e API conectada | Revisão da equipe e volume real |
| RF02 / INV / GEO | Cadastro, edição, busca, filtros, segmentos, campos tipados, canais/CNAE/CADASTUR e mapa interativo | Conferência de cadastros e coordenadas pelo OTO |
| RF03 / ETL / QUAL | CSV/XLSX, mapeamento, prévia, validação, confirmação, pendências, hash e preservação das linhas originais | Mapeamento e carga de arquivos oficiais de cada fonte |
| RF04 / PESQ | Demanda, ocupação/fluxo, diária e controle importáveis/consultáveis; formulários com rascunho, revisão e envio; acompanhamento e prorrogação | Catálogos oficiais das perguntas e regras de consolidação |
| RF05 / DASH | Séries, filtros, ocupação, fluxo, diária, origem da demanda e observações econômicas/de transporte, sempre vinculadas à carga | Aprovação de metodologia, fontes e recortes; sem declarar renda a partir de ISSQN |
| RF06 / ODS | Cadastro de indicador, unidade, metodologia, vínculos ODS e observações com fonte | Aprovação das associações/metas; sem progresso municipal presumido |
| RF07 / REP | Prévia, CSV/XLSX/PDF e histórico de exportações | Revisão do conteúdo técnico pelo PO |
| RF08 / acesso | Secretaria/Hospedagem, contas, troca/redefinição de senha, desativação e invalidação de sessões | Perfis adicionais e visão pública dependem da matriz aprovada |

A carga de fontes externas é controlada por arquivo, permitida pelo escopo da primeira versão no plano. Não há conector ativo para serviços externos nem promessas de sincronização automática. As planilhas devem ser mapeadas ou adaptadas ao modelo; as linhas originais dos novos lotes são preservadas para evitar perda de colunas não interpretadas.

## O que os números significam

- Ocupação mensal: média simples das observações não nulas, sem ponderar capacidade.
- Fluxo mensal: soma das observações não nulas, separando consolidado e expectativa.
- Diária mensal: média simples dos valores não nulos. Cartões do período usam a média das médias mensais disponíveis e identificam isso na tela.
- Cadastro/formulário/importação: contagens totais; não variam com o filtro analítico de datas.
- ISSQN, CAGED, veículos e fretamento: observações com mês, medida, valor, unidade, recorte e lote de origem. Medidas diferentes não são somadas automaticamente.
- Ausência é exibida como ausência. Zero e falso são preservados. Dados fictícios continuam fictícios depois de carregados.
- A exportação mantém registros do banco; os indicadores não passam a ser oficiais por estarem no relatório.

## Migrações novas

V5 adiciona prévias de importação, versão de senha, histórico básico de ações, índice de respostas e proteção contra a mesma carga repetida por hash/tipo. V6 acrescenta observações externas e linhas originais de importações novas. São migrações aditivas, sem exclusão dos 19 cadastros, contas ou respostas existentes. V1–V4 não foram alteradas.

Prévia de importação não altera os dados de negócio. Confirmar executa uma transação; linhas inválidas só são ignoradas após opção explícita e ficam registradas como pendências. Nomes de inventário repetidos no mesmo segmento são sinalizados, não mesclados automaticamente. Cadastros já existentes devem ser atualizados na ficha; o importador não faz atualização em massa por nome ambíguo.

## Qualidade dos dados (QUAL-01)

| Regra | Onde vale | Comportamento |
| --- | --- | --- |
| Campos ausentes | Importação e cadastro manual | Nome, segmento, mês, modalidade e valor obrigatórios são recusados com a coluna indicada |
| Formatos inválidos | Importação e cadastro manual | Número com separador de milhar, percentual fora de 0–100, fluxo fracionado, mês que não é o dia 1, UF, coordenadas fora dos limites e modalidade desconhecida |
| Padronização de nomes | Importação e cadastro manual | Nome, endereço, bairro e razão social são gravados sem espaços nas pontas e com espaços internos únicos. Maiúsculas e acentos são preservados como digitados |
| Códigos sem diferença de maiúsculas | Importação | `Hospedagem`, `HOSPEDAGEM` e `hospedagem` indicam o mesmo segmento; `CONSOLIDADO` vale como `consolidado` |
| Nome repetido no segmento | Importação, vínculo e edição manual | A comparação ignora maiúsculas, acentos e espaços extras (`Pousada São João` = `POUSADA  SAO JOAO`). A importação marca a linha como pendência e a API manual responde 409, informando o cadastro já existente |
| Linha repetida no arquivo | Importação | A segunda ocorrência vira pendência |
| Mesmo arquivo de novo | Importação | Bloqueado pelo hash do arquivo |
| Ocupação ou diária repetida | Importação | Para um estabelecimento informado, um segundo dado do mesmo mês (e modalidade, na ocupação) vindo de outro arquivo vira pendência, indicando o lote original. Linhas municipais, sem estabelecimento, não são comparadas com o histórico |

A comparação de nomes não usa a extensão `unaccent`. Java e SQL aplicam a mesma tabela de acentos (`Names.java`), então a regra funciona igual em qualquer instalação do PostgreSQL.

## Verificação realizada

- Build Java/Maven e 52 testes unitários/web sem falhas (21 originais e 31 do QUAL-01/TST-01).
- Build TypeScript/Vite sem erros.
- Integração real em PostgreSQL temporário separado do banco da usuária: migrações, autenticação, isolamento de hospedagens, edição, contatos/CADASTUR, importações, bloqueio de duplicidade, fontes externas, consulta analítica, exportações, troca/redefinição de senha e desativação.
- Navegador Chrome automático: login, navegação dos módulos, cadastro, publicação de pesquisa e preenchimento em viewport de celular; rascunho persiste ao recarregar e envio é confirmado pelo banco. Importação e download CSV também foram exercitados pela interface.
- O Compose integrado e o Nginx foram preparados para homologação, mas a execução em containers não foi validada neste computador sem Docker.

Testes reproduzíveis em `backend/scripts/smoke_test.py`, `backend/scripts/complete_test.py` e `frontend/scripts/e2e.mjs`. Eles criam dados sintéticos; use ambiente descartável.

## Limites de entrega e próximos aceites

A versão entrega os fluxos locais integrados, não o aceite institucional. Ainda são necessários revisão da equipe/PO, carga e validação de dados oficiais, teste de aceitação TST-03 (roteiro em [roteiro-aceitacao.md](roteiro-aceitacao.md)) e definição/publicação do ambiente externo DEP-01. Não foi publicada uma URL de homologação. A publicação do código na branch de desenvolvimento não substitui a implantação do sistema nem o aceite do PO.

A visão pública PUB-01 não foi habilitada porque o backlog exige aprovação do conjunto publicável pelo PO. Dados internos permanecem autenticados. Recuperação automática por e-mail não foi adicionada; a Secretaria redefine senhas pela interface. Não há conversão automática de respostas arbitrárias de formulário em séries de ocupação/diária, remoção do cadastro mestre ou desvinculação de segmentos com respostas.

Limites operacionais: upload 10 MB, 5.000 linhas e 150 colunas; listas paginadas de 50; exportação até 10.000; primeira aba do XLSX; fórmulas precisam virar valores; PDF é relatório técnico básico e pode substituir caracteres fora do alfabeto suportado. As sessões ficam na memória da API. A auditoria registra usuário, método, rota e data, sem conteúdo das senhas e sem diffs completos dos registros.
