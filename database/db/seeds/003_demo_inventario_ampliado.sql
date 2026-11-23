-- OTO | Seed 003 - Inventário ampliado (TOTALMENTE FICTÍCIO)
-- Cria 29 cadastros (3 por segmento + 2 multissegmento) com ids 2011..2992, vínculos de segmento,
-- canais de contato, atividades (CNAE), CADASTUR, profissionais (guias) e respostas tipadas do catálogo.
--
-- Não depende do 002_demo_inventario.sql (ids diferentes: 2000-2999), mas se você quiser os dois,
-- rode o 002 PRIMEIRO: ele se recusa a rodar quando já existe qualquer vínculo de inventário.
-- NÃO usa a tabela "usuario" (contas são criadas pela interface "Usuários e acessos").
-- Nunca apaga dados. Se já houver cadastros com id entre 2000 e 2999, interrompe sem alterar nada.
-- Requer o catálogo (migração 003 / Flyway V3) com os 9 segmentos.
-- Todos os nomes começam com "FICTICIO - ". Nada aqui vem de dados reais da Prefeitura.
BEGIN;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM inventario_segmento) < 9 THEN
    RAISE EXCEPTION 'Catálogo de segmentos ausente: aplique as migrações (V1 a V3) antes deste seed.';
  END IF;
  IF EXISTS (SELECT 1 FROM registro_inventario WHERE id BETWEEN 2000 AND 2999) THEN
    RAISE EXCEPTION 'Seed 003 já carregado (existem cadastros com id 2000-2999). Nada foi alterado.';
  END IF;
END $$;

-- Tabela auxiliar (some ao final da transação): um cadastro por linha.
CREATE TEMP TABLE seed_reg (
  id BIGINT, seg TEXT, nome TEXT, razao TEXT, tipo TEXT, descr TEXT,
  endereco TEXT, bairro TEXT, conf TEXT
) ON COMMIT DROP;

INSERT INTO seed_reg VALUES
-- Hospedagem
(2011,'hospedagem','FICTICIO - Pousada Ipê Branco','Pousada Ipê Branco Modelo LTDA (fictícia)','estabelecimento','Pousada familiar fictícia, usada para demonstrar cadastro conferido.','Rua das Palmeiras Exemplo, 110','Centro','conferido'),
(2012,'hospedagem','FICTICIO - Hotel Praça Central Modelo','Hotel Praça Central Modelo S/A (fictícia)','estabelecimento','Hotel fictício; mesma coordenada do cadastro 2011 para testar o agrupamento de marcadores no mapa.','Avenida Exemplo, 250','Centro','conferido'),
(2013,'hospedagem','FICTICIO - Chalés Recanto das Águas','Recanto das Águas Hospedagem Modelo LTDA (fictícia)','estabelecimento','Chalés fictícios em área residencial.','Rua dos Lírios Exemplo, 45','Jardim das Flores','parcial'),
-- Alimentação e bebidas
(2021,'alimentacao','FICTICIO - Restaurante Sabor da Terra Modelo','Sabor da Terra Alimentos Modelo LTDA (fictícia)','estabelecimento','Restaurante fictício de comida regional.','Rua do Comércio Exemplo, 320','Centro','conferido'),
(2022,'alimentacao','FICTICIO - Lanchonete Ponto Exemplo','Ponto Exemplo Lanches ME (fictícia)','estabelecimento','Lanchonete fictícia de bairro.','Rua Nova Exemplo, 78','Vila Nova','pendente'),
(2023,'alimentacao','FICTICIO - Sorveteria Gelo Fino Modelo','Gelo Fino Sorvetes Modelo ME (fictícia)','estabelecimento','Sorveteria fictícia.','Alameda Aurora Exemplo, 15','Parque Aurora','parcial'),
-- Agências e operadoras
(2031,'agencias','FICTICIO - Agência Rota Modelo Viagens','Rota Modelo Viagens e Turismo LTDA (fictícia)','estabelecimento','Agência de viagens fictícia.','Rua Central Exemplo, 400, sala 2','Centro','conferido'),
(2032,'agencias','FICTICIO - Operadora Horizonte Exemplo','Horizonte Exemplo Operadora de Turismo LTDA (fictícia)','estabelecimento','Operadora fictícia de pacotes.','Avenida Horizonte Exemplo, 900','Parque Aurora','parcial'),
(2033,'agencias','FICTICIO - Receptivo Caminhos Fictícios','Caminhos Fictícios Receptivo ME (fictícia)','estabelecimento','Receptivo fictício.','Rua dos Ipês Exemplo, 66','Residencial Ipê','pendente'),
-- Atrativos, lazer e entretenimento
(2041,'atrativos','FICTICIO - Parque Aquático Exemplo','Parque Aquático Exemplo Entretenimento S/A (fictícia)','estabelecimento','Atrativo fictício de grande porte.','Rodovia Exemplo, km 5','Zona Rural Exemplo','conferido'),
(2042,'atrativos','FICTICIO - Museu Municipal Modelo','Prefeitura Fictícia (equipamento público de teste)','equipamento_publico','Equipamento público fictício.','Praça Cívica Exemplo, 1','Centro','conferido'),
(2043,'atrativos','FICTICIO - Praça da Fonte Exemplo','Prefeitura Fictícia (equipamento público de teste)','equipamento_publico','Praça fictícia SEM coordenadas, para testar cadastro sem posição no mapa.','Praça da Fonte Exemplo, s/n','Centro','pendente'),
-- Locadoras e transporte turístico
(2051,'transporte','FICTICIO - Locadora Estrada Livre Modelo','Estrada Livre Locações Modelo LTDA (fictícia)','estabelecimento','Locadora de veículos fictícia.','Avenida das Nações Exemplo, 1200','Distrito Industrial','conferido'),
(2052,'transporte','FICTICIO - Transporte Turístico Vale Exemplo','Vale Exemplo Transportes LTDA (fictícia)','estabelecimento','Coordenada fictícia DISTANTE (>80 km) para testar o aviso do mapa.','Rua do Terminal Exemplo, 30','Distrito Industrial','parcial'),
(2053,'transporte','FICTICIO - Fretamento Rota Segura Modelo','Rota Segura Fretamentos Modelo LTDA (fictícia)','estabelecimento','Empresa fictícia de fretamento.','Rua dos Motoristas Exemplo, 80','Distrito Industrial','pendente'),
-- Espaços para eventos
(2061,'espacos_eventos','FICTICIO - Centro de Convenções Exemplo','Centro de Convenções Exemplo S/A (fictícia)','estabelecimento','Centro de convenções fictício.','Avenida dos Congressos Exemplo, 500','Parque Aurora','conferido'),
(2062,'espacos_eventos','FICTICIO - Salão Jardim Modelo','Salão Jardim Modelo Eventos ME (fictícia)','estabelecimento','Salão de festas fictício.','Rua das Rosas Exemplo, 210','Jardim das Flores','parcial'),
(2063,'espacos_eventos','FICTICIO - Espaço Rural Eventos Exemplo','Espaço Rural Exemplo Eventos ME (fictícia)','indefinido','Cadastro fictício REJEITADO, para testar o filtro de conferência.','Estrada Rural Exemplo, km 12','Zona Rural Exemplo','rejeitado'),
-- Organizadores e serviços para eventos
(2071,'servicos_eventos','FICTICIO - Cerimonial Encanto Modelo','Encanto Modelo Cerimonial ME (fictícia)','estabelecimento','Cerimonial fictício.','Rua do Cerimonial Exemplo, 18','Centro','conferido'),
(2072,'servicos_eventos','FICTICIO - Buffet Festa Boa Exemplo','Festa Boa Exemplo Buffet LTDA (fictícia)','estabelecimento','Buffet fictício.','Rua do Buffet Exemplo, 92','Vila Nova','parcial'),
(2073,'servicos_eventos','FICTICIO - Som e Luz Palco Modelo','Palco Modelo Sonorização ME (fictícia)','estabelecimento','Sonorização e iluminação fictícia.','Rua da Música Exemplo, 7','Residencial Ipê','pendente'),
-- Guias de turismo (profissionais)
(2081,'guias','FICTICIO - Guia Ana Exemplo','Guia Ana Exemplo (profissional fictício)','profissional','Guia fictício; sem dados pessoais reais.',NULL,'Centro','conferido'),
(2082,'guias','FICTICIO - Guia Bruno Modelo','Guia Bruno Modelo (profissional fictício)','profissional','Guia fictício; sem dados pessoais reais.',NULL,'Vila Nova','parcial'),
(2083,'guias','FICTICIO - Guia Carla Exemplo','Guia Carla Exemplo (profissional fictício)','profissional','Guia fictício; sem dados pessoais reais.',NULL,'Jardim das Flores','pendente'),
-- Artesanato e comércio diferenciado
(2091,'artesanato','FICTICIO - Ateliê Mãos de Barro Modelo','Mãos de Barro Ateliê Modelo ME (fictícia)','estabelecimento','Ateliê fictício de cerâmica.','Rua dos Artesãos Exemplo, 33','Centro','conferido'),
(2092,'artesanato','FICTICIO - Feira de Artesanato Exemplo','Associação Fictícia de Artesãos (teste)','estabelecimento','Feira fictícia.','Praça da Feira Exemplo, s/n','Centro','parcial'),
(2093,'artesanato','FICTICIO - Doces Caseiros Fazenda Modelo','Doces da Fazenda Modelo ME (fictícia)','estabelecimento','Comércio diferenciado fictício.','Estrada da Fazenda Exemplo, km 3','Zona Rural Exemplo','pendente'),
-- Multissegmento (o vínculo principal está aqui; os demais são inseridos adiante)
(2991,'hospedagem','FICTICIO - Complexo Turístico Multissegmento Modelo','Complexo Turístico Modelo S/A (fictícia)','estabelecimento','Teste muitos-para-muitos: hospedagem + alimentação + atrativos.','Rodovia Exemplo, km 8','Zona Rural Exemplo','conferido'),
(2992,'hospedagem','FICTICIO - Hotel Fazenda Multissegmento Exemplo','Hotel Fazenda Exemplo LTDA (fictícia)','estabelecimento','Teste muitos-para-muitos: hospedagem + espaços para eventos.','Estrada Rural Exemplo, km 20','Zona Rural Exemplo','parcial');

-- Coordenadas fictícias espalhadas em torno de um ponto central (sem relação com endereços reais).
INSERT INTO registro_inventario
  (id,categoria_id,nome,descricao,endereco,bairro,latitude,longitude,tipo_cadastro,
   razao_social,situacao_conferencia,data_ultima_revisao)
SELECT id, NULL, nome, descr, endereco, bairro,
       ROUND((-20.7370 + (((id*37)%100)-50)/2000.0)::numeric,6),
       ROUND((-48.9150 + (((id*53)%100)-50)/2000.0)::numeric,6),
       tipo, razao, conf,
       CASE WHEN conf='conferido' THEN TIMESTAMPTZ '2026-10-15 09:00:00-03' + (id%20)*INTERVAL '1 day' END
FROM seed_reg;

-- Casos de borda para o mapa.
UPDATE registro_inventario SET latitude=NULL, longitude=NULL WHERE id=2043;               -- sem coordenadas
UPDATE registro_inventario SET latitude=-21.170000, longitude=-47.810000 WHERE id=2052;   -- distante (> 80 km)
UPDATE registro_inventario r SET latitude=b.latitude, longitude=b.longitude               -- mesmo ponto (agrupamento)
  FROM registro_inventario b WHERE r.id=2012 AND b.id=2011;

-- Vínculos com segmentos (id do vínculo = id do cadastro, como no seed 002).
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia)
SELECT r.id, r.id, s.id, r.conf FROM seed_reg r JOIN inventario_segmento s ON s.codigo=r.seg;
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia)
SELECT x.vid, x.rid, s.id, x.conf
FROM (VALUES (2981,2991,'alimentacao','conferido'),
             (2982,2991,'atrativos','parcial'),
             (2983,2992,'espacos_eventos','parcial')) AS x(vid,rid,seg,conf)
JOIN inventario_segmento s ON s.codigo=x.seg;

-- Contatos: e-mail sempre interno (publico=false), como pede a regra de privacidade do projeto.
INSERT INTO inventario_canal (registro_id,tipo,valor,responsavel,publico,ficticio)
SELECT id,'telefone','(17) 5550-'||LPAD((id%10000)::text,4,'0'),'Recepção fictícia',(id%2=0),TRUE FROM seed_reg
UNION ALL
SELECT id,'email','contato'||id||'@exemplo.invalid','Equipe fictícia',FALSE,TRUE FROM seed_reg
UNION ALL
SELECT id,'site','https://exemplo-'||id||'.invalid','Marketing fictício',TRUE,TRUE FROM seed_reg
UNION ALL
SELECT id,'rede_social','@ficticio_'||id,'Marketing fictício',(id%3=0),TRUE FROM seed_reg WHERE id%2=1;

-- Atividades econômicas (códigos CNAE reais, usados apenas como exemplo de preenchimento).
INSERT INTO inventario_atividade (registro_id,cnae,descricao)
SELECT r.id, a.cnae, a.descr
FROM seed_reg r
JOIN (VALUES
  ('hospedagem','5510-8/01','Hotéis'),
  ('hospedagem','5590-6/03','Pensões (alojamento)'),
  ('alimentacao','5611-2/01','Restaurantes e similares'),
  ('alimentacao','5611-2/03','Lanchonetes, casas de chá, de sucos e similares'),
  ('agencias','7911-2/00','Agências de viagens'),
  ('agencias','7912-1/00','Operadores turísticos'),
  ('atrativos','9329-8/99','Outras atividades de recreação e lazer'),
  ('atrativos','9102-3/01','Museus e exploração de lugares e prédios históricos'),
  ('transporte','7711-0/00','Locação de automóveis sem condutor'),
  ('espacos_eventos','8230-0/02','Casas de festas e eventos'),
  ('servicos_eventos','8230-0/01','Organização de feiras, congressos, exposições e festas'),
  ('guias','7990-2/00','Serviços de reservas e outros serviços de turismo'),
  ('artesanato','4789-0/99','Comércio varejista de outros produtos')
) AS a(seg,cnae,descr) ON a.seg=r.seg;

-- CADASTUR com os quatro estados: obrigatório sem registro, registrado válido, registrado vencido e não consta.
INSERT INTO inventario_cadastur (registro_id,obrigatoriedade,registrado,numero,vencimento,atividade,observacao)
SELECT id,
       CASE id%4 WHEN 0 THEN 1 WHEN 1 THEN 1 WHEN 2 THEN 2 ELSE 3 END,
       CASE id%4 WHEN 0 THEN TRUE WHEN 1 THEN FALSE WHEN 2 THEN TRUE ELSE NULL END,
       CASE WHEN id%4 IN (0,2) THEN 'FICT-'||id END,
       CASE id%4 WHEN 0 THEN DATE '2027-03-31' WHEN 2 THEN DATE '2026-08-15' END,
       seg,
       'Dado inventado somente para testar os estados do CADASTUR'
FROM seed_reg
WHERE seg IN ('hospedagem','alimentacao','agencias','atrativos','transporte');

INSERT INTO inventario_profissional (registro_id,cpf,categorias_atuacao,classificacao)
SELECT id, NULL,
       CASE id%3 WHEN 0 THEN ARRAY['Guia regional'] WHEN 1 THEN ARRAY['Guia regional','Guia de excursão nacional'] ELSE ARRAY['Guia de atrativo natural'] END,
       'Fictício'
FROM seed_reg WHERE seg='guias';

-- Respostas tipadas (inventario_resposta). Ausência de linha = NÃO INFORMADO (não é zero nem "Não").
-- Cobre cerca de 65% dos campos de cada segmento, com valores variados e coerentes com o cadastro.
-- Os valores respeitam o gatilho validar_resposta_inventario (um valor por tipo lógico).
INSERT INTO inventario_resposta
  (vinculo_id,campo_id,valor_texto,valor_inteiro,valor_decimal,valor_booleano,valor_data,
   valor_ano,valor_lista,latitude,longitude,texto_original,observacao,situacao_validacao,ficticio)
SELECT b.vid, b.cid,
  CASE b.t
    WHEN 'texto' THEN CASE
      WHEN b.f ILIKE '%NOME FANTASIA%' THEN b.nome
      WHEN b.f ILIKE '%RAZÃO SOCIAL%' THEN COALESCE(b.razao,'Informação fictícia')
      WHEN b.f ILIKE '%CNPJ%' THEN '00.000.000/'||LPAD((b.rid%10000)::text,4,'0')||'-00'
      WHEN b.f ILIKE '%ENDEREÇO%' THEN COALESCE(b.endereco,'Rua Exemplo, 000')
      WHEN b.f ILIKE 'BAIRRO%' THEN COALESCE(b.bairro,'Centro')
      WHEN b.f ILIKE '%EMAIL%' OR b.f ILIKE '%E-MAIL%' THEN 'contato'||b.rid||'@exemplo.invalid'
      WHEN b.f ILIKE '%TELEFONE%' OR b.f ILIKE '%FONE%' THEN '(17) 5550-'||LPAD((b.rid%10000)::text,4,'0')
      WHEN b.f ILIKE '%SITE%' THEN 'https://exemplo-'||b.rid||'.invalid'
      WHEN b.f ILIKE '%INSTAGRAM%' OR b.f ILIKE '%FACEBOOK%' THEN '@ficticio_'||b.rid
      WHEN b.f ILIKE '%CNAE%' THEN '0000-0/00'
      WHEN b.f ILIKE '%CADASTUR%' THEN 'FICT-'||b.rid
      WHEN b.f ILIKE 'ID' THEN b.rid::text
      ELSE 'Informação fictícia '||(b.hv%90+10) END
    WHEN 'selecao' THEN (ARRAY['Opção fictícia A','Opção fictícia B','Opção fictícia C'])[(b.hv%3)+1]
    WHEN 'booleano_detalhe' THEN CASE WHEN b.hv%100 < 50 THEN 'Detalhe fictício' END
    WHEN 'texto_indicacao' THEN 'Indicação fictícia'
  END,
  CASE WHEN b.t='inteiro' THEN CASE
      WHEN b.seg='hospedagem' AND b.col='AA' THEN 10 + (b.rid%7)*8
      WHEN b.seg='hospedagem' AND b.col='AB' THEN 2*(10 + (b.rid%7)*8) + (b.rid%3)*2
      WHEN b.seg='hospedagem' AND b.col='AC' THEN 1 + (b.rid%3)
      WHEN b.f ILIKE '%FIXOS%' THEN 3 + (b.hv%38)
      WHEN b.f ILIKE '%TEMP%' THEN (b.hv%16)
      WHEN b.f ILIKE '%LEITO%' THEN 20 + (b.hv%80)
      WHEN b.f ILIKE '%UH%' THEN 8 + (b.hv%60)
      WHEN b.f ILIKE '%VAGA%' THEN 5 + (b.hv%60)
      WHEN b.f ILIKE '%CAPACIDADE%' THEN 50 + (b.hv%450)
      ELSE 1 + (b.hv%40) END END,
  CASE WHEN b.t='percentual' THEN (b.hv%101)::numeric
       WHEN b.t='decimal' THEN ROUND((b.hv%50000)/100.0,2) END,
  CASE WHEN b.t='booleano' THEN (b.hv%100 < 60)
       WHEN b.t='booleano_detalhe' THEN (b.hv%100 < 50)
       WHEN b.t='texto_indicacao' THEN TRUE END,
  CASE WHEN b.t='data' THEN DATE '2020-01-01' + (b.hv%2400)::int
       WHEN b.t='data_ou_ano' AND b.hv%2=0 THEN DATE '2018-01-01' + (b.hv%2800)::int END,
  CASE WHEN b.t='data_ou_ano' AND b.hv%2=1 THEN (1990 + (b.hv%36))::smallint END,
  CASE WHEN b.t='lista_texto' THEN
       CASE b.hv%3 WHEN 0 THEN ARRAY['Item fictício A']
                  WHEN 1 THEN ARRAY['Item fictício A','Item fictício B']
                  ELSE ARRAY['Item fictício A','Item fictício B','Item fictício C'] END END,
  CASE WHEN b.t='coordenadas' THEN b.lat END,
  CASE WHEN b.t='coordenadas' THEN b.lon END,
  NULL,
  'SINTÉTICO: valor inventado para demonstração',
  (ARRAY['valido','valido','pendente','revisar'])[(b.hv%4)+1],
  TRUE
FROM (
  SELECT v.id AS vid, v.registro_id AS rid, c.id AS cid, c.tipo_logico AS t,
         c.campo_original AS f, c.coluna_excel AS col, s.codigo AS seg,
         g.nome, g.razao_social AS razao, g.endereco, g.bairro,
         g.latitude AS lat, g.longitude AS lon,
         ABS(hashtext(v.id::text||'|'||c.chave_tecnica)::bigint) AS h,
         ABS(hashtext(v.id::text||'#'||c.chave_tecnica)::bigint) AS hv
  FROM inventario_vinculo_segmento v
  JOIN inventario_segmento s ON s.id=v.segmento_id
  JOIN registro_inventario g ON g.id=v.registro_id
  JOIN inventario_campo c ON c.segmento_id=v.segmento_id
  WHERE v.registro_id BETWEEN 2000 AND 2999
    AND c.tipo_logico <> 'sem_definicao'
) b
WHERE NOT (b.t='coordenadas' AND b.lat IS NULL)
  AND ( b.t='coordenadas'
     OR b.f ILIKE ANY (ARRAY['%NOME FANTASIA%','%RAZÃO SOCIAL%','%CNPJ%','%ENDEREÇO%','BAIRRO%'])
     OR (b.seg='hospedagem' AND b.col IN ('AA','AB','AC'))
     OR b.h%100 < 65 );

-- Ajusta as sequências depois dos ids explícitos.
SELECT setval(pg_get_serial_sequence('registro_inventario','id'),
              GREATEST((SELECT COALESCE(MAX(id),1) FROM registro_inventario),1));
SELECT setval(pg_get_serial_sequence('inventario_vinculo_segmento','id'),
              GREATEST((SELECT COALESCE(MAX(id),1) FROM inventario_vinculo_segmento),1));
COMMIT;

-- Conferência rápida (não altera dados). Esperado: 29 cadastros, 32 vínculos.
SELECT 'registros (2000-2999)' AS item, COUNT(*) AS total FROM registro_inventario WHERE id BETWEEN 2000 AND 2999
UNION ALL SELECT 'vinculos', COUNT(*) FROM inventario_vinculo_segmento WHERE registro_id BETWEEN 2000 AND 2999
UNION ALL SELECT 'canais', COUNT(*) FROM inventario_canal WHERE registro_id BETWEEN 2000 AND 2999
UNION ALL SELECT 'atividades', COUNT(*) FROM inventario_atividade WHERE registro_id BETWEEN 2000 AND 2999
UNION ALL SELECT 'cadastur', COUNT(*) FROM inventario_cadastur WHERE registro_id BETWEEN 2000 AND 2999
UNION ALL SELECT 'profissionais', COUNT(*) FROM inventario_profissional WHERE registro_id BETWEEN 2000 AND 2999
UNION ALL SELECT 'respostas tipadas', COUNT(*) FROM inventario_resposta r JOIN inventario_vinculo_segmento v ON v.id=r.vinculo_id WHERE v.registro_id BETWEEN 2000 AND 2999;
