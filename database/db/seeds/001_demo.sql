-- OTO | Dados 100% sinteticos para DEMONSTRACAO E TESTES.
-- Nenhum registro e baseado em dados confidenciais do OTO.
-- Rode APENAS em banco de desenvolvimento vazio, depois de 001_init.sql.
-- Este arquivo REFUSA popular se detectar registros preexistentes; NUNCA apaga dados.
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM registro_inventario)
    OR EXISTS (SELECT 1 FROM categoria_inventario)
    OR EXISTS (SELECT 1 FROM fonte_dados)
    OR EXISTS (SELECT 1 FROM conjunto_pesquisa)
    OR EXISTS (SELECT 1 FROM usuario)
    OR EXISTS (SELECT 1 FROM importacao)
    OR EXISTS (SELECT 1 FROM demanda_turistica)
    OR EXISTS (SELECT 1 FROM ocupacao_fluxo)
    OR EXISTS (SELECT 1 FROM diaria_media)
    OR EXISTS (SELECT 1 FROM controle_pesquisa)
    OR EXISTS (SELECT 1 FROM indicador)
    OR EXISTS (SELECT 1 FROM observacao_indicador)
    OR EXISTS (SELECT 1 FROM ods)
    OR EXISTS (SELECT 1 FROM indicador_ods)
    OR EXISTS (SELECT 1 FROM erro_importacao)
    OR EXISTS (SELECT 1 FROM exportacao)
    OR EXISTS (SELECT 1 FROM relatorio_lote)
    OR EXISTS (SELECT 1 FROM relatorio)
  THEN
    RAISE EXCEPTION 'Seed demonstrativo interrompido: banco nao esta vazio. Nada foi apagado.';
  END IF;
END $$;

INSERT INTO categoria_inventario (id,nome) VALUES
(1,'Meios de hospedagem'), (2,'Alimentacao'), (3,'Atrativos turisticos');

-- Localizacoes apenas simuladas para testar o mapa; nao correspondem a cadastros oficiais.
INSERT INTO registro_inventario
 (id,categoria_id,nome,descricao,endereco,bairro,latitude,longitude)
SELECT i, 1, 'Hospedagem Ficticia '||LPAD(i::text,2,'0'),
       'REGISTRO FICTICIO PARA DEMONSTRACAO',
       'Endereco de teste, '||i, 'Bairro Exemplo',
       ROUND((-20.75 + i * 0.003)::numeric,6),
       ROUND((-48.92 + i * 0.004)::numeric,6)
FROM generate_series(1,6) AS s(i);
INSERT INTO registro_inventario
 (id,categoria_id,nome,descricao,endereco,bairro,latitude,longitude) VALUES
(7,2,'Restaurante Ficticio 01','REGISTRO FICTICIO PARA DEMONSTRACAO',NULL,NULL,NULL,NULL),
(8,3,'Atrativo Ficticio 01','REGISTRO FICTICIO PARA DEMONSTRACAO',NULL,NULL,NULL,NULL);

INSERT INTO fonte_dados (id,nome,descricao,situacao_carga) VALUES
(1,'Fonte ficticia - Demanda','Exemplo de origem para testes; nao e arquivo real.','demonstracao'),
(2,'Fonte ficticia - Ocupacao e fluxo','Exemplo de origem para testes; nao e arquivo real.','demonstracao'),
(3,'Fonte ficticia - Diaria media','Exemplo de origem para testes; nao e arquivo real.','demonstracao'),
(4,'Fonte ficticia - Controle','Exemplo de origem para testes; nao e arquivo real.','demonstracao'),
(5,'Fonte ficticia - Inventario','Exemplo de origem para testes; nao e arquivo real.','demonstracao');

INSERT INTO conjunto_pesquisa (id,codigo,nome,descricao) VALUES
(1,'DEMANDA','Demanda Turistica','Estrutura ilustrativa, sem colunas oficiais validadas.'),
(2,'OCUPACAO','Taxa de Ocupacao e Fluxo','Consolidado e expectativa demonstrativos.'),
(3,'DIARIA','Diaria Media','Valores em reais demonstrativos.'),
(4,'CONTROLE','Controle de Pesquisas','Controle demonstrativo.');

INSERT INTO usuario (id,nome,identificador,ativo)
VALUES (1,'Operador Ficticio de Testes','operador@exemplo.invalid',true);

-- Um lote simulado possui 80 linhas, das quais 72 persistidas e 8 pendencias.
INSERT INTO importacao
 (id,fonte_id,conjunto_id,usuario_responsavel_id,referencia,nome_arquivo,status,linhas_total,linhas_validas,linhas_pendentes)
VALUES
(1,1,1,1,'2026-01 a 2026-06','FICTICIO_demanda.csv','validada',480,480,0),
(2,2,2,1,'2026-01 a 2026-06','FICTICIO_ocupacao.csv','pendencias',80,72,8),
(3,3,3,1,'2026-01 a 2026-06','FICTICIO_diaria.csv','validada',36,36,0),
(4,4,4,1,'2026-01 a 2026-06','FICTICIO_controle.csv','validada',4,4,0),
(5,5,NULL,1,'2026-01','FICTICIO_inventario.csv','validada',8,8,0);

INSERT INTO erro_importacao (id,lote_id,linha,campo,tipo,descricao)
SELECT i-72,2,i,'ocupacao_percentual','valor_invalido',
       'Linha ficticia pendente: percentual fora do intervalo permitido.'
FROM generate_series(73,80) AS s(i);

-- 72 observacoes = 6 meses * 6 hospedagens * 2 modalidades.
INSERT INTO ocupacao_fluxo
 (id,lote_id,estabelecimento_id,mes_referencia,ocupacao_percentual,fluxo_pessoas,tipo_dado,linha_origem,dados_originais)
SELECT ROW_NUMBER() OVER(ORDER BY mes,hotel,modalidade),
       2,
       hotel,
       MAKE_DATE(2026,mes,1),
       (52 + mes*2 + hotel + modalidade*3)::numeric(5,2),
       (80 + mes*15 + hotel*7 + modalidade*5)::integer,
       CASE WHEN modalidade=1 THEN 'consolidado' ELSE 'expectativa' END,
       ROW_NUMBER() OVER(ORDER BY mes,hotel,modalidade),
       jsonb_build_object('registro','FICTICIO','periodo',to_char(MAKE_DATE(2026,mes,1),'YYYY-MM'))
FROM generate_series(1,6) AS m(mes)
CROSS JOIN generate_series(1,6) AS h(hotel)
CROSS JOIN generate_series(1,2) AS t(modalidade);

-- 36 observacoes = 6 meses * 6 hospedagens.
INSERT INTO diaria_media
 (id,lote_id,estabelecimento_id,mes_referencia,valor,linha_origem,dados_originais)
SELECT ROW_NUMBER() OVER(ORDER BY mes,hotel),
       3,hotel,MAKE_DATE(2026,mes,1),
       (180 + mes*12 + hotel*9)::numeric(12,2),
       ROW_NUMBER() OVER(ORDER BY mes,hotel),
       jsonb_build_object('registro','FICTICIO','tipo','preco_simulado')
FROM generate_series(1,6) AS m(mes)
CROSS JOIN generate_series(1,6) AS h(hotel);

-- 480 respostas ficticias = 6 meses * 80 respondentes sem dados pessoais.
-- JSONB e usado aqui somente como suporte temporario de testes;
-- os campos oficiais serao tipados apos receber o dicionario do Daniel.
INSERT INTO demanda_turistica (id,lote_id,referencia,origem_uf,linha_origem,dados_originais)
SELECT n,1,to_char(MAKE_DATE(2026,1 + (n-1)/80,1),'YYYY-MM'),
       (ARRAY['SP','MG','RJ','PR','GO','MS','DF','SC'])[((n-1)%8)+1],
       n,
       jsonb_build_object(
         'ficticio',true,
         'faixa_etaria_simulada', (ARRAY['18-29','30-44','45-59','60+'])[((n-1)%4)+1],
         'pernoites_simulados',((n-1)%5)+1,
         'gasto_diario_simulado',(100 + ((n-1)%12)*25),
         'nota_experiencia_simulada', ((n-1)%11)
       )
FROM generate_series(1,480) AS g(n);

INSERT INTO controle_pesquisa
 (id,lote_id,conjunto_id,referencia,linha_origem,dados_originais)
SELECT i,4,i,'2026-01 a 2026-06',i,
       jsonb_build_object('ficticio',true,'status','controle_demonstração')
FROM generate_series(1,4) AS g(i);

-- Indicadores agregados de demonstração (não calculados a partir dos registros brutos).
-- Valores mensais ficticios, sem qualquer atribuicao oficial ao OTO.
INSERT INTO indicador (id,nome,unidade,metodologia) VALUES
(1,'Fluxo turistico demonstrativo','pessoas','Serie sintetica para testes da interface.'),
(2,'Taxa de ocupacao demonstrativa','percentual','Serie sintetica para testes da interface.'),
(3,'Diaria media demonstrativa','BRL','Serie sintetica para testes da interface.');

INSERT INTO observacao_indicador (indicador_id,fonte_id,lote_id,referencia,valor)
SELECT 1,2,2,to_char(MAKE_DATE(2026,mes,1),'YYYY-MM'),
       (ARRAY[15000,17000,19000,21000,23000,25000])[mes]::numeric
FROM generate_series(1,6) AS m(mes);
INSERT INTO observacao_indicador (indicador_id,fonte_id,lote_id,referencia,valor)
SELECT 2,2,2,to_char(MAKE_DATE(2026,mes,1),'YYYY-MM'),
       (ARRAY[62,64,65,66,68,71])[mes]::numeric
FROM generate_series(1,6) AS m(mes);
INSERT INTO observacao_indicador (indicador_id,fonte_id,lote_id,referencia,valor)
SELECT 3,3,3,to_char(MAKE_DATE(2026,mes,1),'YYYY-MM'),
       (ARRAY[290,305,315,325,335,350])[mes]::numeric
FROM generate_series(1,6) AS m(mes);

-- Associacao ODS e puramente ilustrativa.
INSERT INTO ods (id,numero,nome) VALUES
(1,8,'Trabalho decente e crescimento economico'),
(2,11,'Cidades e comunidades sustentaveis'),
(3,12,'Consumo e producao responsaveis');
INSERT INTO indicador_ods (indicador_id,ods_id,justificativa) VALUES
(1,1,'Associacao ficticia, pendente de aprovacao pelo OTO.'),
(2,2,'Associacao ficticia, pendente de aprovacao pelo OTO.'),
(3,3,'Associacao ficticia, pendente de aprovacao pelo OTO.');

-- Corrigir as sequencias para futuras insercoes automáticas.
SELECT setval(pg_get_serial_sequence('categoria_inventario','id'),3,true);
SELECT setval(pg_get_serial_sequence('registro_inventario','id'),8,true);
SELECT setval(pg_get_serial_sequence('fonte_dados','id'),5,true);
SELECT setval(pg_get_serial_sequence('conjunto_pesquisa','id'),4,true);
SELECT setval(pg_get_serial_sequence('usuario','id'),1,true);
SELECT setval(pg_get_serial_sequence('importacao','id'),5,true);
SELECT setval(pg_get_serial_sequence('erro_importacao','id'),8,true);
SELECT setval(pg_get_serial_sequence('ocupacao_fluxo','id'),72,true);
SELECT setval(pg_get_serial_sequence('diaria_media','id'),36,true);
SELECT setval(pg_get_serial_sequence('demanda_turistica','id'),480,true);
SELECT setval(pg_get_serial_sequence('controle_pesquisa','id'),4,true);
SELECT setval(pg_get_serial_sequence('indicador','id'),3,true);
SELECT setval(pg_get_serial_sequence('ods','id'),3,true);
SELECT setval(pg_get_serial_sequence('observacao_indicador','id'),18,true);

COMMIT;

-- Checagem rapida, nao altera dados:
SELECT 'registro_inventario' AS tabela, COUNT(*) AS registros FROM registro_inventario
UNION ALL SELECT 'demanda_turistica',COUNT(*) FROM demanda_turistica
UNION ALL SELECT 'ocupacao_fluxo',COUNT(*) FROM ocupacao_fluxo
UNION ALL SELECT 'diaria_media',COUNT(*) FROM diaria_media
UNION ALL SELECT 'controle_pesquisa',COUNT(*) FROM controle_pesquisa
UNION ALL SELECT 'erro_importacao',COUNT(*) FROM erro_importacao;
