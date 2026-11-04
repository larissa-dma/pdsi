-- Consultas sobre o banco de demonstração OTO (somente dados sintéticos)
-- Executar no banco oto, por exemplo via pgAdmin/DBeaver.

-- 1. Quantos registros há?
SELECT COUNT(*) AS cadastros_de_teste FROM registro_inventario WHERE nome LIKE 'FICTICIO -%';

-- 2. Listar segmentos, inclusive os que tenham zero cadastros
SELECT s.nome AS segmento, COUNT(DISTINCT v.registro_id) AS cadastros
FROM inventario_segmento s
LEFT JOIN inventario_vinculo_segmento v ON v.segmento_id = s.id
GROUP BY s.id, s.nome ORDER BY s.nome;

-- 3. Dicionário de colunas: aba, campo e tipo recomendado
SELECT aba_original, coluna_excel, grupo_original, campo_original,
       tipo_recomendado, tipo_sql_sugerido
FROM inventario_campo
WHERE segmento_id = (SELECT id FROM inventario_segmento WHERE codigo='hospedagem')
ORDER BY id LIMIT 30;

-- 4. Exemplos de leitos, UHs e UHs PCD
SELECT r.nome, h.unidades_habitacionais, h.leitos, h.unidades_habitacionais_pcd
FROM vw_hospedagem_capacidade h
JOIN registro_inventario r ON r.id = h.registro_id
ORDER BY r.nome;

-- 5. Valores simulados de inventario_resposta, com nomes de colunas
SELECT r.nome, c.campo_original, c.tipo_logico, COALESCE(
   i.valor_texto,i.valor_inteiro::text,i.valor_decimal::text,
   i.valor_booleano::text,i.valor_data::text,i.valor_ano::text,
   array_to_string(i.valor_lista, ', '),
   CASE WHEN i.latitude IS NOT NULL THEN i.latitude::text || ', ' || i.longitude::text END
) AS exemplo_sintetico
FROM inventario_resposta i
JOIN inventario_vinculo_segmento v ON v.id=i.vinculo_id
JOIN registro_inventario r ON r.id=v.registro_id
JOIN inventario_campo c ON c.id=i.campo_id
WHERE r.id=1011 ORDER BY c.id LIMIT 40;
