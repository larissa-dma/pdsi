# CSVs fictícios para testar as análises

Todos os valores são inventados, sem relação com estatísticas oficiais ou pessoas reais. Esses arquivos são para importar manualmente em ambiente de desenvolvimento. Não foram carregados automaticamente no banco.

| Arquivo | Conjunto no site | Linhas |
| --- | --- | --- |
| FICTICIO_ocupacao_fluxo_2026.csv | ocupacao | 22: 10 consolidadas de janeiro a outubro e 12 expectativas de janeiro a dezembro |
| FICTICIO_diaria_media_2026.csv | diaria | 10: janeiro a outubro de 2026 |
| FICTICIO_demanda_origem_2026.csv | demanda | 39: origens sintéticas distribuídas entre janeiro e outubro de 2026 |

## Como importar

1. Entre com perfil Secretaria e abra **Importação**.
2. Escolha o conjunto correspondente ao arquivo e informe a referência **2026 - demonstracao ficticia**.
3. Selecione o CSV e clique em **Ler arquivo**.
4. As colunas têm os nomes esperados e são mapeadas automaticamente. Confira e clique em **Validar mapeamento**.
5. Todas as linhas devem ser válidas; clique em **Confirmar importação**.
6. Repita para os outros arquivos, mudando o conjunto.
7. Em **Visão geral**, deixe as datas vazias para consultar tudo ou use **01/01/2026 a 31/12/2026**. Alterne Consolidado/Expectativa.

O primeiro arquivo alimenta fluxo e ocupação, o segundo alimenta diária e o terceiro alimenta origem da demanda. Se outros dados já existirem, os painéis considerarão também esses registros.

O estabelecimento_id fica vazio porque as observações de ocupação/diária são agregadas. Não dependem de IDs de hospedagens do seu banco. Na demanda, cada linha é uma observação sintética, não uma contagem ponderada de visitantes. A distribuição por UF reflete apenas essas 39 linhas de teste.

Importe cada arquivo uma única vez. O hash bloqueia a repetição do mesmo arquivo por conjunto. Guardar os CSVs no Git não importa os dados automaticamente.
