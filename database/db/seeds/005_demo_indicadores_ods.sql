-- OTO | Seed 005 - Indicadores de sustentabilidade e ODS (TOTALMENTE FICTÍCIO)
-- Cria 6 indicadores com vínculos aos ODS e 12 observações mensais de 2025 (referência AAAA-MM),
-- com algumas lacunas de propósito (ausência de observação não é zero).
-- Independe dos outros seeds e da tabela "usuario". Pode rodar em qualquer ordem.
-- Os vínculos aos ODS são ilustrativos e NÃO representam certificação nem progresso oficial do município.
-- Nunca apaga dados. Se os indicadores "(demonstrativo 2)" já existirem, interrompe sem alterar nada.
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM indicador WHERE nome LIKE '%(demonstrativo 2)') THEN
    RAISE EXCEPTION 'Seed 005 já carregado (indicadores "(demonstrativo 2)" existem). Nada foi alterado.';
  END IF;
END $$;

-- Objetivos de Desenvolvimento Sustentável usados aqui. Se o número já existir, o nome atual é mantido.
INSERT INTO ods (numero,nome) VALUES
  (6,'Água potável e saneamento'),
  (7,'Energia limpa e acessível'),
  (8,'Trabalho decente e crescimento econômico'),
  (10,'Redução das desigualdades'),
  (11,'Cidades e comunidades sustentáveis'),
  (12,'Consumo e produção responsáveis'),
  (13,'Ação contra a mudança global do clima'),
  (15,'Vida terrestre')
ON CONFLICT (numero) DO NOTHING;

INSERT INTO indicador (nome,unidade,metodologia) VALUES
 ('Hospedagens com coleta seletiva (demonstrativo 2)','percentual',
  'Série sintética (seed 005). Hospedagens com coleta seletiva / total de hospedagens pesquisadas × 100.'),
 ('Consumo de água por hóspede-diária (demonstrativo 2)','litros',
  'Série sintética (seed 005). Volume de água consumido no mês / total de hóspede-diárias do mês.'),
 ('Participação de energia renovável (demonstrativo 2)','percentual',
  'Série sintética (seed 005). Energia de fonte renovável / energia total consumida × 100.'),
 ('Hospedagens com acessibilidade para PCD (demonstrativo 2)','percentual',
  'Série sintética (seed 005). Hospedagens com unidade habitacional acessível / total pesquisado × 100.'),
 ('Empregos formais no turismo (demonstrativo 2)','pessoas',
  'Série sintética (seed 005). Estoque de vínculos formais nos setores selecionados do turismo. Não substitui o CAGED.'),
 ('Visitantes em atrativos naturais (demonstrativo 2)','pessoas',
  'Série sintética (seed 005). Total mensal de visitantes informado pelos atrativos naturais cadastrados.');

INSERT INTO indicador_ods (indicador_id,ods_id,justificativa)
SELECT i.id, d.id, 'Associação fictícia para demonstração; validar com a equipe antes de qualquer uso oficial.'
FROM (VALUES
  ('Hospedagens com coleta seletiva (demonstrativo 2)',12),
  ('Hospedagens com coleta seletiva (demonstrativo 2)',11),
  ('Consumo de água por hóspede-diária (demonstrativo 2)',6),
  ('Consumo de água por hóspede-diária (demonstrativo 2)',12),
  ('Participação de energia renovável (demonstrativo 2)',7),
  ('Participação de energia renovável (demonstrativo 2)',13),
  ('Hospedagens com acessibilidade para PCD (demonstrativo 2)',10),
  ('Hospedagens com acessibilidade para PCD (demonstrativo 2)',11),
  ('Empregos formais no turismo (demonstrativo 2)',8),
  ('Visitantes em atrativos naturais (demonstrativo 2)',15),
  ('Visitantes em atrativos naturais (demonstrativo 2)',8)
) AS x(nome,numero)
JOIN indicador i ON i.nome=x.nome
JOIN ods d ON d.numero=x.numero;

-- Uma fonte manual para todas as observações.
INSERT INTO fonte_dados (nome,descricao,situacao_carga)
VALUES ('Fonte fictícia 2 — indicadores demonstrativos','Valores sintéticos para demonstração (seed 005).','manual');

-- Observações mensais em ordem de mês (a tela mostra a última inserida de cada indicador).
-- Lacunas: água em 2025-03 e 2025-04; acessibilidade só a cada três meses.
INSERT INTO observacao_indicador (indicador_id,fonte_id,lote_id,referencia,valor)
SELECT i.id,
       (SELECT id FROM fonte_dados WHERE nome='Fonte fictícia 2 — indicadores demonstrativos'),
       NULL,
       '2025-'||LPAD(m.n::text,2,'0'),
       s.valores[m.n]
FROM generate_series(1,12) AS m(n)
JOIN (VALUES
  ('Hospedagens com coleta seletiva (demonstrativo 2)', ARRAY[38,40,41,43,45,46,48,50,52,53,55,58]::numeric[]),
  ('Consumo de água por hóspede-diária (demonstrativo 2)', ARRAY[210,205,NULL,NULL,196,194,190,188,185,183,180,178]::numeric[]),
  ('Participação de energia renovável (demonstrativo 2)', ARRAY[12,12,13,14,15,15,17,18,20,22,24,25]::numeric[]),
  ('Hospedagens com acessibilidade para PCD (demonstrativo 2)', ARRAY[30,NULL,NULL,32,NULL,NULL,35,NULL,NULL,37,NULL,NULL]::numeric[]),
  ('Empregos formais no turismo (demonstrativo 2)', ARRAY[1850,1862,1867,1859,1861,1865,1890,1900,1903,1901,1910,1941]::numeric[]),
  ('Visitantes em atrativos naturais (demonstrativo 2)', ARRAY[3200,2800,2600,2900,2500,2700,6100,3800,3000,3100,3500,5900]::numeric[])
) AS s(nome,valores) ON TRUE
JOIN indicador i ON i.nome=s.nome
WHERE s.valores[m.n] IS NOT NULL
ORDER BY m.n, i.id;

COMMIT;

-- Conferência rápida (não altera dados). Esperado: 6 indicadores; 11 vínculos ODS; 62 observações.
SELECT 'indicadores' AS item, COUNT(*) AS total FROM indicador WHERE nome LIKE '%(demonstrativo 2)'
UNION ALL SELECT 'vinculos ODS', COUNT(*) FROM indicador_ods io JOIN indicador i ON i.id=io.indicador_id WHERE i.nome LIKE '%(demonstrativo 2)'
UNION ALL SELECT 'observacoes', COUNT(*) FROM observacao_indicador o JOIN indicador i ON i.id=o.indicador_id WHERE i.nome LIKE '%(demonstrativo 2)';
