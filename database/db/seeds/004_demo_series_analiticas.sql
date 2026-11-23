-- OTO | Seed 004 - Séries analíticas de 2025 (TOTALMENTE FICTÍCIO)
-- Cria fontes, conjuntos, lotes de importação e os dados que alimentam as telas de análise:
--   ocupação/fluxo (consolidado e expectativa), diária média, demanda por UF, controle de pesquisa
--   e observações externas (ISSQN, CAGED, veículos, fretamento), com "linhas de origem" e pendências.
--
-- REQUER o seed 003 (usa os hospedagens 2011, 2012 e 2013). Não depende do 002 nem da tabela "usuario"
-- (se existir uma conta SECRETARIA, o lote é atribuído a ela).
-- Usa só o ano de 2025 para não colidir com os CSVs de exemplo (2026) nem com a regra de mês duplicado.
-- ATENÇÃO: depois deste seed, os totais SEM filtro de datas na Visão geral deixam de ser os dos CSVs de
-- exemplo (fluxo 233.700 / ocupação 74,6% / diária R$ 354). Para conferir aqueles números, use um banco sem este seed.
-- Nunca apaga dados. Se os lotes FICTICIO2_* já existirem, interrompe sem alterar nada.
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM importacao WHERE nome_arquivo LIKE 'FICTICIO2\_%') THEN
    RAISE EXCEPTION 'Seed 004 já carregado (lotes FICTICIO2_* existem). Nada foi alterado.';
  END IF;
  IF (SELECT COUNT(*) FROM registro_inventario WHERE id IN (2011,2012,2013)) < 3 THEN
    RAISE EXCEPTION 'Carregue antes o seed 003 (hospedagens 2011, 2012 e 2013 não encontradas).';
  END IF;
END $$;

-- Fontes e conjuntos (os códigos seguem o que a própria importação cria: tipo em maiúsculas).
INSERT INTO fonte_dados (nome,descricao,situacao_carga)
SELECT 'Fonte fictícia 2 — '||t, 'Origem sintética para demonstração (seed 004); não é arquivo real.', 'demonstracao'
FROM unnest(ARRAY['ocupacao','diaria','demanda','controle','issqn','caged','veiculos','fretamento']) AS t;

INSERT INTO conjunto_pesquisa (nome,codigo)
SELECT t, upper(t)
FROM unnest(ARRAY['ocupacao','diaria','demanda','controle','issqn','caged','veiculos','fretamento']) AS t
ON CONFLICT (codigo) DO NOTHING;

-- Lotes. A ocupação tem 75 linhas: 72 válidas e 3 pendências (registradas adiante).
INSERT INTO importacao
  (fonte_id,conjunto_id,usuario_responsavel_id,referencia,nome_arquivo,hash_arquivo,status,
   linhas_total,linhas_validas,linhas_pendentes,data_importacao,tipo_importacao)
SELECT f.id, c.id,
       (SELECT id FROM usuario WHERE perfil='SECRETARIA' ORDER BY id LIMIT 1),
       t.ref, t.arq, md5('fict2-'||t.tipo)||md5('arquivo-'||t.tipo), t.st,
       t.total, t.validas, t.total - t.validas, t.quando, t.tipo
FROM (VALUES
  ('ocupacao','2025-01 a 2025-12','FICTICIO2_ocupacao_2025.csv','pendencias',75,72,TIMESTAMPTZ '2026-01-20 10:00:00-03'),
  ('diaria','2025-01 a 2025-12','FICTICIO2_diaria_2025.csv','validada',36,36,TIMESTAMPTZ '2026-01-20 10:30:00-03'),
  ('demanda','2025-01 a 2025-12','FICTICIO2_demanda_2025.csv','validada',720,720,TIMESTAMPTZ '2026-01-21 09:00:00-03'),
  ('controle','2025-01 a 2025-12','FICTICIO2_controle_2025.csv','validada',12,12,TIMESTAMPTZ '2026-01-21 09:30:00-03'),
  ('issqn','2025-01 a 2025-12','FICTICIO2_issqn_2025.csv','validada',12,12,TIMESTAMPTZ '2026-01-22 14:00:00-03'),
  ('caged','2025-01 a 2025-12','FICTICIO2_caged_2025.csv','validada',12,12,TIMESTAMPTZ '2026-01-22 14:20:00-03'),
  ('veiculos','2025-01 a 2025-12','FICTICIO2_veiculos_2025.csv','validada',12,12,TIMESTAMPTZ '2026-01-22 14:40:00-03'),
  ('fretamento','2025-01 a 2025-12','FICTICIO2_fretamento_2025.csv','validada',12,12,TIMESTAMPTZ '2026-01-22 15:00:00-03')
) AS t(tipo,ref,arq,st,total,validas,quando)
JOIN fonte_dados f ON f.nome='Fonte fictícia 2 — '||t.tipo
JOIN conjunto_pesquisa c ON c.codigo=upper(t.tipo);

-- Ocupação e fluxo: 12 meses x 3 hospedagens x 2 modalidades = 72 linhas.
-- Alta temporada em julho e dezembro; a expectativa fica 3 pontos acima do consolidado.
INSERT INTO ocupacao_fluxo
  (lote_id,estabelecimento_id,mes_referencia,ocupacao_percentual,fluxo_pessoas,tipo_dado,linha_origem,dados_originais)
SELECT (SELECT id FROM importacao WHERE nome_arquivo='FICTICIO2_ocupacao_2025.csv'),
       q.est, q.mes, q.occ, q.fluxo, q.tipo,
       ROW_NUMBER() OVER (ORDER BY q.mes, q.est, q.tipo DESC),
       jsonb_build_object('mes_referencia',to_char(q.mes,'YYYY-MM-DD'),
                          'estabelecimento_id',q.est::text,
                          'ocupacao_percentual',q.occ::text,
                          'fluxo_pessoas',q.fluxo::text,
                          'tipo_dado',q.tipo)
FROM (
  SELECT e.id AS est,
         MAKE_DATE(2025,m.n,1) AS mes,
         t.tipo,
         ((ARRAY[72,66,60,58,55,57,82,70,63,61,66,84])[m.n] + e.ajuste + CASE WHEN t.tipo='expectativa' THEN 3 ELSE 0 END)::numeric(5,2) AS occ,
         (((ARRAY[72,66,60,58,55,57,82,70,63,61,66,84])[m.n] + e.ajuste + CASE WHEN t.tipo='expectativa' THEN 3 ELSE 0 END) * (35 + 8*e.k))::integer AS fluxo
  FROM (VALUES (2011,1,4),(2012,2,0),(2013,3,-6)) AS e(id,k,ajuste)
  CROSS JOIN generate_series(1,12) AS m(n)
  CROSS JOIN (VALUES ('consolidado'),('expectativa')) AS t(tipo)
) q;

-- Linhas de origem do lote de ocupação: as 72 válidas + 3 pendências (valida = false).
INSERT INTO importacao_linha (lote_id,linha,dados_originais,valida)
SELECT lote_id, linha_origem, dados_originais, TRUE
FROM ocupacao_fluxo WHERE lote_id=(SELECT id FROM importacao WHERE nome_arquivo='FICTICIO2_ocupacao_2025.csv');
INSERT INTO importacao_linha (lote_id,linha,dados_originais,valida)
SELECT (SELECT id FROM importacao WHERE nome_arquivo='FICTICIO2_ocupacao_2025.csv'), x.linha, x.dados::jsonb, FALSE
FROM (VALUES
  (73,'{"mes_referencia":"2025-03-01","estabelecimento_id":"2011","ocupacao_percentual":"101","fluxo_pessoas":"3000","tipo_dado":"consolidado"}'),
  (74,'{"mes_referencia":"2025-04-15","estabelecimento_id":"2012","ocupacao_percentual":"60","fluxo_pessoas":"2500","tipo_dado":"consolidado"}'),
  (75,'{"mes_referencia":"2025-05-01","estabelecimento_id":"2013","ocupacao_percentual":"55","fluxo_pessoas":"2100","tipo_dado":"realizado"}')
) AS x(linha,dados);
INSERT INTO erro_importacao (lote_id,linha,campo,tipo,descricao)
SELECT (SELECT id FROM importacao WHERE nome_arquivo='FICTICIO2_ocupacao_2025.csv'), x.linha, x.campo, 'validacao', x.descr
FROM (VALUES
  (73,'ocupacao_percentual','Linha fictícia pendente: percentual fora do intervalo de 0 a 100.'),
  (74,'mes_referencia','Linha fictícia pendente: o mês de referência deve cair no dia 01.'),
  (75,'tipo_dado','Linha fictícia pendente: modalidade desconhecida (use consolidado ou expectativa).')
) AS x(linha,campo,descr);

-- Diária média: 12 meses x 3 hospedagens = 36 linhas.
INSERT INTO diaria_media (lote_id,estabelecimento_id,mes_referencia,valor,linha_origem,dados_originais)
SELECT (SELECT id FROM importacao WHERE nome_arquivo='FICTICIO2_diaria_2025.csv'),
       e.id, MAKE_DATE(2025,m.n,1),
       ((ARRAY[240,232,225,222,218,224,310,265,238,236,252,335])[m.n] + e.ajuste)::numeric(12,2),
       ROW_NUMBER() OVER (ORDER BY m.n, e.id),
       jsonb_build_object('mes_referencia',to_char(MAKE_DATE(2025,m.n,1),'YYYY-MM-DD'),
                          'estabelecimento_id',e.id::text,
                          'valor',((ARRAY[240,232,225,222,218,224,310,265,238,236,252,335])[m.n] + e.ajuste)::text)
FROM (VALUES (2011,35),(2012,0),(2013,-20)) AS e(id,ajuste)
CROSS JOIN generate_series(1,12) AS m(n);
INSERT INTO importacao_linha (lote_id,linha,dados_originais,valida)
SELECT lote_id, linha_origem, dados_originais, TRUE
FROM diaria_media WHERE lote_id=(SELECT id FROM importacao WHERE nome_arquivo='FICTICIO2_diaria_2025.csv');

-- Demanda por origem (UF): 60 respondentes por mês x 12 = 720 linhas; SP 45%, MG 15%, PR 10% etc.
INSERT INTO demanda_turistica (lote_id,referencia,origem_uf,linha_origem,dados_originais)
SELECT (SELECT id FROM importacao WHERE nome_arquivo='FICTICIO2_demanda_2025.csv'),
       to_char(MAKE_DATE(2025,1+(n-1)/60,1),'YYYY-MM'),
       uf, n,
       jsonb_build_object('referencia',to_char(MAKE_DATE(2025,1+(n-1)/60,1),'YYYY-MM'),'origem_uf',uf)
FROM (
  SELECT n, (ARRAY['SP','SP','SP','SP','SP','SP','SP','SP','SP','MG','MG','MG','RJ','PR','PR','GO','MS','DF','SC','BA'])[((n*7)%20)+1] AS uf
  FROM generate_series(1,720) AS g(n)
) d;
INSERT INTO importacao_linha (lote_id,linha,dados_originais,valida)
SELECT lote_id, linha_origem, dados_originais, TRUE
FROM demanda_turistica WHERE lote_id=(SELECT id FROM importacao WHERE nome_arquivo='FICTICIO2_demanda_2025.csv');

-- Controle de pesquisa: uma linha por mês.
INSERT INTO controle_pesquisa (lote_id,conjunto_id,referencia,linha_origem,dados_originais)
SELECT (SELECT id FROM importacao WHERE nome_arquivo='FICTICIO2_controle_2025.csv'),
       (SELECT id FROM conjunto_pesquisa WHERE codigo='CONTROLE'),
       to_char(MAKE_DATE(2025,m.n,1),'YYYY-MM'), m.n,
       jsonb_build_object('referencia',to_char(MAKE_DATE(2025,m.n,1),'YYYY-MM'),
                          'respondentes',60,'meta',60,'ficticio',TRUE)
FROM generate_series(1,12) AS m(n);
INSERT INTO importacao_linha (lote_id,linha,dados_originais,valida)
SELECT lote_id, linha_origem, dados_originais, TRUE
FROM controle_pesquisa WHERE lote_id=(SELECT id FROM importacao WHERE nome_arquivo='FICTICIO2_controle_2025.csv');

-- Fontes externas: 12 meses por tipo. ISSQN não é renda turística e CAGED não se soma a outras medidas (ver README).
INSERT INTO observacao_externa (lote_id,tipo,mes_referencia,medida,unidade,recorte,valor,linha_origem)
SELECT (SELECT id FROM importacao WHERE nome_arquivo='FICTICIO2_'||x.tipo||'_2025.csv'),
       x.tipo, MAKE_DATE(2025,m.n,1), x.medida, x.unidade, x.recorte, x.valores[m.n], m.n
FROM (VALUES
  ('issqn','arrecadacao_issqn_hospedagem','BRL','Hospedagem',
     ARRAY[182000,171000,166000,160000,158000,163000,241000,196000,174000,170000,188000,259000]::numeric[]),
  ('caged','saldo_admissoes_desligamentos','vagas','Turismo (setores selecionados)',
     ARRAY[12,5,-3,-8,2,4,25,10,3,-2,9,31]::numeric[]),
  ('veiculos','frota_licenciada','veículos','Fretamento turístico municipal',
     ARRAY[40,40,41,41,41,42,44,44,45,45,46,46]::numeric[]),
  ('fretamento','viagens_fretadas','viagens','Municipal',
     ARRAY[135,128,120,118,115,122,260,170,140,138,150,245]::numeric[])
) AS x(tipo,medida,unidade,recorte,valores)
CROSS JOIN generate_series(1,12) AS m(n);
INSERT INTO importacao_linha (lote_id,linha,dados_originais,valida)
SELECT o.lote_id, o.linha_origem,
       jsonb_build_object('mes_referencia',to_char(o.mes_referencia,'YYYY-MM-DD'),'medida',o.medida,
                          'unidade',o.unidade,'recorte',o.recorte,'valor',o.valor::text),
       TRUE
FROM observacao_externa o
WHERE o.lote_id IN (SELECT id FROM importacao WHERE nome_arquivo LIKE 'FICTICIO2\_%');

COMMIT;

-- Conferência rápida (não altera dados). Esperado: 8 lotes; 72 ocupação; 36 diária; 720 demanda; 12 controle; 48 externas; 3 pendências.
SELECT 'lotes FICTICIO2' AS item, COUNT(*) AS total FROM importacao WHERE nome_arquivo LIKE 'FICTICIO2\_%'
UNION ALL SELECT 'ocupacao_fluxo', COUNT(*) FROM ocupacao_fluxo o JOIN importacao i ON i.id=o.lote_id WHERE i.nome_arquivo LIKE 'FICTICIO2\_%'
UNION ALL SELECT 'diaria_media', COUNT(*) FROM diaria_media o JOIN importacao i ON i.id=o.lote_id WHERE i.nome_arquivo LIKE 'FICTICIO2\_%'
UNION ALL SELECT 'demanda_turistica', COUNT(*) FROM demanda_turistica o JOIN importacao i ON i.id=o.lote_id WHERE i.nome_arquivo LIKE 'FICTICIO2\_%'
UNION ALL SELECT 'controle_pesquisa', COUNT(*) FROM controle_pesquisa o JOIN importacao i ON i.id=o.lote_id WHERE i.nome_arquivo LIKE 'FICTICIO2\_%'
UNION ALL SELECT 'observacao_externa', COUNT(*) FROM observacao_externa o JOIN importacao i ON i.id=o.lote_id WHERE i.nome_arquivo LIKE 'FICTICIO2\_%'
UNION ALL SELECT 'erros de importação', COUNT(*) FROM erro_importacao o JOIN importacao i ON i.id=o.lote_id WHERE i.nome_arquivo LIKE 'FICTICIO2\_%'
UNION ALL SELECT 'linhas de origem', COUNT(*) FROM importacao_linha o JOIN importacao i ON i.id=o.lote_id WHERE i.nome_arquivo LIKE 'FICTICIO2\_%';
