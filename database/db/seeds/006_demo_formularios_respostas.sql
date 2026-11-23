-- OTO | Seed 006 - Formulários e respostas das hospedagens (TOTALMENTE FICTÍCIO)
-- Cria 3 formulários (um com prazo encerrado) e respostas em vários estados:
-- enviado, rascunho e sem resposta, para as hospedagens 2011, 2012 e 2013 (seed 003).
--
-- REQUER o seed 003. Não cria usuários: para enxergar estas respostas pela tela, crie na interface
-- "Usuários e acessos" uma conta de perfil HOSPEDAGEM vinculada a um desses cadastros
-- (por exemplo, "FICTICIO - Pousada Ipê Branco", id 2011).
-- Perguntas e respostas seguem as regras da API (chave minúscula, tipos texto/inteiro/percentual/decimal/booleano).
-- Nunca apaga dados. Se os formulários "FICTICIO2 - ..." já existirem, interrompe sem alterar nada.
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM formulario WHERE titulo LIKE 'FICTICIO2 - %') THEN
    RAISE EXCEPTION 'Seed 006 já carregado (formulários "FICTICIO2 - ..." existem). Nada foi alterado.';
  END IF;
  IF (SELECT COUNT(*) FROM registro_inventario WHERE id IN (2011,2012,2013)) < 3 THEN
    RAISE EXCEPTION 'Carregue antes o seed 003 (hospedagens 2011, 2012 e 2013 não encontradas).';
  END IF;
END $$;

INSERT INTO formulario (titulo,referencia,prazo,perguntas,criado_em) VALUES
('FICTICIO2 - Pesquisa mensal de ocupação (2026-10)','2026-10',DATE '2027-01-31',
 $json$[
  {"chave":"ocupacao_mes","titulo":"Taxa de ocupação no mês (%)","tipo":"percentual","obrigatoria":true},
  {"chave":"hospedes_mes","titulo":"Total de hóspedes no mês","tipo":"inteiro","obrigatoria":true},
  {"chave":"diaria_media","titulo":"Diária média praticada (R$)","tipo":"decimal","obrigatoria":true},
  {"chave":"teve_evento","titulo":"Houve evento na cidade que impactou a ocupação?","tipo":"booleano","obrigatoria":false},
  {"chave":"observacoes","titulo":"Observações","tipo":"texto","obrigatoria":false}
 ]$json$::jsonb, TIMESTAMPTZ '2026-11-03 09:00:00-03'),
('FICTICIO2 - Perfil do estabelecimento (2026-S1)','2026-S1',DATE '2026-06-30',
 $json$[
  {"chave":"funcionarios_fixos","titulo":"Funcionários fixos","tipo":"inteiro","obrigatoria":true},
  {"chave":"funcionarios_temporarios","titulo":"Funcionários temporários","tipo":"inteiro","obrigatoria":false},
  {"chave":"possui_acessibilidade","titulo":"Possui unidade habitacional acessível?","tipo":"booleano","obrigatoria":true},
  {"chave":"clientes_estrangeiros_pct","titulo":"Clientes estrangeiros (%)","tipo":"percentual","obrigatoria":false},
  {"chave":"descricao_servicos","titulo":"Descrição dos serviços oferecidos","tipo":"texto","obrigatoria":false}
 ]$json$::jsonb, TIMESTAMPTZ '2026-04-06 09:00:00-03'),
('FICTICIO2 - Sustentabilidade na hospedagem (2026-11)','2026-11',DATE '2027-03-31',
 $json$[
  {"chave":"coleta_seletiva","titulo":"Realiza coleta seletiva?","tipo":"booleano","obrigatoria":true},
  {"chave":"consumo_agua_m3","titulo":"Consumo de água no mês (m³)","tipo":"decimal","obrigatoria":false},
  {"chave":"energia_renovavel_pct","titulo":"Energia renovável no consumo (%)","tipo":"percentual","obrigatoria":false},
  {"chave":"acoes_ambientais","titulo":"Ações ambientais realizadas","tipo":"texto","obrigatoria":false}
 ]$json$::jsonb, TIMESTAMPTZ '2026-11-10 09:00:00-03');

-- Respostas. Combinações (formulário, hospedagem) sem linha = ainda sem resposta salva.
INSERT INTO formulario_resposta (formulario_id,estabelecimento_id,respostas,status,atualizado_em,enviado_em)
SELECT f.id, x.est, x.resp::jsonb, x.st, x.atualizado, x.enviado
FROM (VALUES
  -- Pesquisa mensal de ocupação: 2011 enviou, 2012 tem rascunho, 2013 não respondeu.
  ('FICTICIO2 - Pesquisa mensal de ocupação (2026-10)',2011,
   '{"ocupacao_mes":74.5,"hospedes_mes":1380,"diaria_media":352.9,"teve_evento":true,"observacoes":"Feriado prolongado aumentou a procura (texto fictício)."}',
   'enviado',TIMESTAMPTZ '2026-11-08 15:20:00-03',TIMESTAMPTZ '2026-11-08 15:20:00-03'),
  ('FICTICIO2 - Pesquisa mensal de ocupação (2026-10)',2012,
   '{"ocupacao_mes":68,"hospedes_mes":1710}',
   'rascunho',TIMESTAMPTZ '2026-11-09 11:05:00-03',NULL),
  -- Perfil (prazo encerrado): 2011 e 2012 enviaram; 2013 ficou em rascunho e não pode mais salvar nem enviar.
  ('FICTICIO2 - Perfil do estabelecimento (2026-S1)',2011,
   '{"funcionarios_fixos":22,"funcionarios_temporarios":6,"possui_acessibilidade":true,"clientes_estrangeiros_pct":8.5,"descricao_servicos":"Café da manhã, estacionamento e área de lazer (texto fictício)."}',
   'enviado',TIMESTAMPTZ '2026-06-20 10:00:00-03',TIMESTAMPTZ '2026-06-20 10:00:00-03'),
  ('FICTICIO2 - Perfil do estabelecimento (2026-S1)',2012,
   '{"funcionarios_fixos":35,"possui_acessibilidade":false,"clientes_estrangeiros_pct":0}',
   'enviado',TIMESTAMPTZ '2026-06-25 16:40:00-03',TIMESTAMPTZ '2026-06-25 16:40:00-03'),
  ('FICTICIO2 - Perfil do estabelecimento (2026-S1)',2013,
   '{"funcionarios_fixos":9}',
   'rascunho',TIMESTAMPTZ '2026-06-10 09:30:00-03',NULL),
  -- Sustentabilidade: 2011 tem rascunho; 2012 e 2013 ainda não responderam.
  ('FICTICIO2 - Sustentabilidade na hospedagem (2026-11)',2011,
   '{"coleta_seletiva":true,"energia_renovavel_pct":0}',
   'rascunho',TIMESTAMPTZ '2026-11-12 14:15:00-03',NULL)
) AS x(titulo,est,resp,st,atualizado,enviado)
JOIN formulario f ON f.titulo=x.titulo;

COMMIT;

-- Conferência rápida (não altera dados). Esperado: 3 formulários; 6 respostas (3 enviadas e 3 rascunhos).
SELECT 'formularios' AS item, COUNT(*) AS total FROM formulario WHERE titulo LIKE 'FICTICIO2 - %'
UNION ALL SELECT 'respostas enviadas', COUNT(*) FROM formulario_resposta r JOIN formulario f ON f.id=r.formulario_id WHERE f.titulo LIKE 'FICTICIO2 - %' AND r.status='enviado'
UNION ALL SELECT 'respostas em rascunho', COUNT(*) FROM formulario_resposta r JOIN formulario f ON f.id=r.formulario_id WHERE f.titulo LIKE 'FICTICIO2 - %' AND r.status='rascunho';
