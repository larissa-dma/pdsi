-- OTO | 099 - Remove SOMENTE os dados criados pelos seeds 003 a 006 (opcional)
-- Serve para recarregar os seeds depois de ajustá-los, sem recriar o banco inteiro.
--
-- ATENÇÃO: este arquivo APAGA dados, mas só estes:
--   * cadastros com id 2000-2999 (e vínculos, respostas tipadas, canais, atividades, CADASTUR, profissionais);
--   * lotes "FICTICIO2_*" e tudo que eles carregaram (ocupação, diária, demanda, controle, externas, erros, linhas de origem);
--   * formulários "FICTICIO2 - ..." e todas as respostas deles;
--   * indicadores "(demonstrativo 2)", suas observações/vínculos ODS e a fonte deles.
-- NÃO mexe nos seeds 001/002, nas suas contas, nos seus lotes reais nem nos conjuntos de pesquisa e ODS
-- (esses ficam, pois também são criados pela própria aplicação).
-- Se algo de fora ainda aponta para esses cadastros (por exemplo, uma conta de hospedagem vinculada ao 2011),
-- o script PARA com uma mensagem e não apaga nada. Resolva e rode de novo.
-- Em caso de dúvida, não rode: para recomeçar do zero use "docker compose down -v" (apaga TODO o banco).
BEGIN;

DO $$
DECLARE n BIGINT;
BEGIN
  SELECT COUNT(*) INTO n FROM usuario WHERE estabelecimento_id BETWEEN 2000 AND 2999;
  IF n > 0 THEN
    RAISE EXCEPTION 'Existem % conta(s) vinculada(s) a cadastros 2000-2999. Desative/exclua ou re-vincule antes. Nada foi apagado.', n;
  END IF;
  SELECT COUNT(*) INTO n FROM formulario_resposta r JOIN formulario f ON f.id=r.formulario_id
    WHERE r.estabelecimento_id BETWEEN 2000 AND 2999 AND f.titulo NOT LIKE 'FICTICIO2 - %';
  IF n > 0 THEN
    RAISE EXCEPTION 'Existem % resposta(s) de formulários seus para cadastros 2000-2999. Nada foi apagado.', n;
  END IF;
  SELECT COUNT(*) INTO n FROM (
    SELECT lote_id,estabelecimento_id FROM ocupacao_fluxo UNION ALL SELECT lote_id,estabelecimento_id FROM diaria_media
  ) x JOIN importacao i ON i.id=x.lote_id
  WHERE x.estabelecimento_id BETWEEN 2000 AND 2999 AND i.nome_arquivo NOT LIKE 'FICTICIO2\_%';
  IF n > 0 THEN
    RAISE EXCEPTION 'Existem % linha(s) de ocupação/diária de outros lotes ligadas a cadastros 2000-2999. Nada foi apagado.', n;
  END IF;
END $$;

-- 1) Formulários demonstrativos.
DELETE FROM formulario_resposta WHERE formulario_id IN (SELECT id FROM formulario WHERE titulo LIKE 'FICTICIO2 - %');
DELETE FROM formulario WHERE titulo LIKE 'FICTICIO2 - %';

-- 2) Indicadores demonstrativos.
DELETE FROM observacao_indicador WHERE indicador_id IN (SELECT id FROM indicador WHERE nome LIKE '%(demonstrativo 2)');
DELETE FROM indicador_ods       WHERE indicador_id IN (SELECT id FROM indicador WHERE nome LIKE '%(demonstrativo 2)');
DELETE FROM indicador           WHERE nome LIKE '%(demonstrativo 2)';

-- 3) Lotes demonstrativos e o que eles carregaram.
CREATE TEMP TABLE seed_lotes ON COMMIT DROP AS SELECT id FROM importacao WHERE nome_arquivo LIKE 'FICTICIO2\_%';
DELETE FROM observacao_externa WHERE lote_id IN (SELECT id FROM seed_lotes);
DELETE FROM ocupacao_fluxo     WHERE lote_id IN (SELECT id FROM seed_lotes);
DELETE FROM diaria_media       WHERE lote_id IN (SELECT id FROM seed_lotes);
DELETE FROM demanda_turistica  WHERE lote_id IN (SELECT id FROM seed_lotes);
DELETE FROM controle_pesquisa  WHERE lote_id IN (SELECT id FROM seed_lotes);
DELETE FROM erro_importacao    WHERE lote_id IN (SELECT id FROM seed_lotes);
DELETE FROM importacao_linha   WHERE lote_id IN (SELECT id FROM seed_lotes);
DELETE FROM importacao         WHERE id IN (SELECT id FROM seed_lotes);
DELETE FROM fonte_dados        WHERE nome LIKE 'Fonte fictícia 2 — %';

-- 4) Inventário demonstrativo (as respostas tipadas, canais, atividades, CADASTUR e profissionais saem em cascata).
DELETE FROM inventario_vinculo_segmento WHERE registro_id BETWEEN 2000 AND 2999;
DELETE FROM registro_inventario         WHERE id BETWEEN 2000 AND 2999;

COMMIT;

-- Conferência rápida (não altera dados). Tudo deve estar em 0.
SELECT 'cadastros 2000-2999' AS item, COUNT(*) AS restante FROM registro_inventario WHERE id BETWEEN 2000 AND 2999
UNION ALL SELECT 'lotes FICTICIO2', COUNT(*) FROM importacao WHERE nome_arquivo LIKE 'FICTICIO2\_%'
UNION ALL SELECT 'formularios FICTICIO2', COUNT(*) FROM formulario WHERE titulo LIKE 'FICTICIO2 - %'
UNION ALL SELECT 'indicadores demonstrativo 2', COUNT(*) FROM indicador WHERE nome LIKE '%(demonstrativo 2)';
