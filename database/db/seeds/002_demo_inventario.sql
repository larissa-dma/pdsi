-- Dados TOTALMENTE FICTÍCIOS - NÃO incluem valores, nomes ou documentos do arquivo da Prefeitura.
-- Executar só em ambiente de desenvolvimento em banco sem registros na tabela inventario_vinculo_segmento.
BEGIN;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM inventario_vinculo_segmento) THEN RAISE EXCEPTION 'Já existem vínculos no inventário: seed interrompido'; END IF; END $$;
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1011,NULL,'FICTICIO - Meios de hospedagem 01','estabelecimento','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1011,1011,id,'parcial' FROM inventario_segmento WHERE codigo='hospedagem';
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1012,NULL,'FICTICIO - Meios de hospedagem 02','estabelecimento','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1012,1012,id,'parcial' FROM inventario_segmento WHERE codigo='hospedagem';
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1021,NULL,'FICTICIO - Meios de alimentação e bebidas 01','estabelecimento','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1021,1021,id,'parcial' FROM inventario_segmento WHERE codigo='alimentacao';
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1022,NULL,'FICTICIO - Meios de alimentação e bebidas 02','estabelecimento','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1022,1022,id,'parcial' FROM inventario_segmento WHERE codigo='alimentacao';
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1031,NULL,'FICTICIO - Agências e operadoras de turismo 01','estabelecimento','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1031,1031,id,'parcial' FROM inventario_segmento WHERE codigo='agencias';
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1032,NULL,'FICTICIO - Agências e operadoras de turismo 02','estabelecimento','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1032,1032,id,'parcial' FROM inventario_segmento WHERE codigo='agencias';
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1041,NULL,'FICTICIO - Atrativos lazer e entretenimento 01','estabelecimento','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1041,1041,id,'parcial' FROM inventario_segmento WHERE codigo='atrativos';
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1042,NULL,'FICTICIO - Atrativos lazer e entretenimento 02','estabelecimento','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1042,1042,id,'parcial' FROM inventario_segmento WHERE codigo='atrativos';
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1051,NULL,'FICTICIO - Locadoras de veículos e transporte turístico 01','estabelecimento','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1051,1051,id,'parcial' FROM inventario_segmento WHERE codigo='transporte';
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1052,NULL,'FICTICIO - Locadoras de veículos e transporte turístico 02','estabelecimento','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1052,1052,id,'parcial' FROM inventario_segmento WHERE codigo='transporte';
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1061,NULL,'FICTICIO - Espaços para eventos 01','estabelecimento','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1061,1061,id,'parcial' FROM inventario_segmento WHERE codigo='espacos_eventos';
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1062,NULL,'FICTICIO - Espaços para eventos 02','estabelecimento','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1062,1062,id,'parcial' FROM inventario_segmento WHERE codigo='espacos_eventos';
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1071,NULL,'FICTICIO - Organizadores e serviços para eventos 01','estabelecimento','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1071,1071,id,'parcial' FROM inventario_segmento WHERE codigo='servicos_eventos';
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1072,NULL,'FICTICIO - Organizadores e serviços para eventos 02','estabelecimento','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1072,1072,id,'parcial' FROM inventario_segmento WHERE codigo='servicos_eventos';
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1081,NULL,'FICTICIO - Guias de turismo 01','profissional','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1081,1081,id,'parcial' FROM inventario_segmento WHERE codigo='guias';
INSERT INTO inventario_profissional(registro_id,categorias_atuacao,classificacao) VALUES (1081,ARRAY['Categoria fictícia'], 'Fictício');
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1082,NULL,'FICTICIO - Guias de turismo 02','profissional','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1082,1082,id,'parcial' FROM inventario_segmento WHERE codigo='guias';
INSERT INTO inventario_profissional(registro_id,categorias_atuacao,classificacao) VALUES (1082,ARRAY['Categoria fictícia'], 'Fictício');
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1091,NULL,'FICTICIO - Artesanato e comércio diferenciado 01','estabelecimento','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1091,1091,id,'parcial' FROM inventario_segmento WHERE codigo='artesanato';
INSERT INTO registro_inventario (id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1092,NULL,'FICTICIO - Artesanato e comércio diferenciado 02','estabelecimento','REGISTRO SINTÉTICO PARA TESTE','parcial');
INSERT INTO inventario_vinculo_segmento (id,registro_id,segmento_id,situacao_conferencia) SELECT 1092,1092,id,'parcial' FROM inventario_segmento WHERE codigo='artesanato';
INSERT INTO registro_inventario(id,categoria_id,nome,tipo_cadastro,descricao,situacao_conferencia) VALUES (1999,NULL,'FICTICIO - Empreendimento Multissegmento','estabelecimento','Exemplo exclusivo de teste de cardinalidade muitos-para-muitos','parcial');
INSERT INTO inventario_vinculo_segmento(id,registro_id,segmento_id,situacao_conferencia) SELECT 1901,1999,id,'parcial' FROM inventario_segmento WHERE codigo='hospedagem';
INSERT INTO inventario_vinculo_segmento(id,registro_id,segmento_id,situacao_conferencia) SELECT 1902,1999,id,'parcial' FROM inventario_segmento WHERE codigo='alimentacao';
-- Respostas sintéticas para parte das colunas de cada segmento. Ausência de linha significa NÃO INFORMADO, não zero.
-- Sem copiar células reais; tipos derivam do dicionário e as opções são somente para teste.
INSERT INTO inventario_resposta
  (vinculo_id,campo_id,valor_texto,valor_inteiro,valor_decimal,valor_booleano,valor_data,
   valor_ano,valor_lista,latitude,longitude,texto_original,observacao,situacao_validacao,ficticio)
SELECT v.id, c.id,
  CASE WHEN c.tipo_logico='texto' THEN
      CASE WHEN c.campo_original ILIKE '%CNPJ%' THEN '00.000.000/0000-00'
           WHEN c.campo_original ILIKE '%CPF%' THEN '000.000.000-00'
           WHEN c.campo_original ILIKE '%EMAIL%' OR c.campo_original ILIKE '%E-MAIL%' THEN 'ficticio@exemplo.invalid'
           WHEN c.campo_original ILIKE '%TELEFONE%' OR c.campo_original ILIKE '%FONE%' THEN '(00) 0000-0000'
           WHEN c.campo_original ILIKE '%SITE%' THEN 'https://example.invalid'
           WHEN c.campo_original ILIKE '%ENDEREÇO%' THEN 'Rua Exemplo, 000 - Fictício'
           ELSE 'Informação fictícia' END
    WHEN c.tipo_logico='selecao' THEN 'Opção fictícia (não validada)' 
    WHEN c.tipo_logico IN ('booleano_detalhe','texto_indicacao') THEN 'Detalhe fictício' END AS valor_texto,
  CASE WHEN c.tipo_logico='inteiro' THEN
      CASE WHEN c.campo_original ILIKE '%LEITO%' THEN 70
           WHEN c.campo_original ILIKE '%UH%' THEN 35
           ELSE 12 END END AS valor_inteiro,
  CASE WHEN c.tipo_logico='percentual' THEN
      CASE WHEN c.campo_original ILIKE '%TURISTA%' THEN 60.00
           WHEN c.campo_original ILIKE '%COMUNIDADE%' THEN 40.00 ELSE 25.00 END
       WHEN c.tipo_logico='decimal' THEN 145.50 END AS valor_decimal,
  CASE WHEN c.tipo_logico IN ('booleano','booleano_detalhe','texto_indicacao') THEN TRUE END AS valor_booleano,
  CASE WHEN c.tipo_logico='data' THEN DATE '2025-01-15' END AS valor_data,
  CASE WHEN c.tipo_logico='data_ou_ano' THEN 2025 END AS valor_ano,
  CASE WHEN c.tipo_logico='lista_texto' THEN ARRAY['Item fictício','Outro item fictício']::text[] END AS valor_lista,
  CASE WHEN c.tipo_logico='coordenadas' THEN -20.750000::numeric END AS latitude,
  CASE WHEN c.tipo_logico='coordenadas' THEN -48.900000::numeric END AS longitude,
  NULL, 'SINTÉTICO: valor não extraído da planilha', 'pendente', TRUE
FROM inventario_vinculo_segmento v
JOIN inventario_campo c ON c.segmento_id=v.segmento_id
WHERE (CASE WHEN c.coluna_excel ~ '^[A-Z]{1,3}$' THEN
      (LENGTH(c.coluna_excel)=1 OR c.coluna_excel IN
      ('AA','AB','AC','AD','AE','AF','AG','AH')) ELSE FALSE END)
  AND c.tipo_logico <> 'sem_definicao';

-- Testar contato público/privado: padrão de privacidade é sempre interno.
INSERT INTO inventario_canal(registro_id,tipo,valor,responsavel,publico,ficticio) VALUES(1011,'email','ficticio@exemplo.invalid','Equipe fictícia',FALSE,TRUE);
INSERT INTO inventario_cadastur(registro_id,obrigatoriedade,registrado,numero,vencimento,observacao) VALUES(1011,1,FALSE,NULL,NULL,'Dado inventado somente para testar os estados CADASTUR');
-- Ajustar sequências depois de ids fictícios explicitamente atribuídos.
SELECT setval(pg_get_serial_sequence('registro_inventario','id'),
              GREATEST((SELECT COALESCE(MAX(id),1) FROM registro_inventario),1));
SELECT setval(pg_get_serial_sequence('inventario_vinculo_segmento','id'),
              GREATEST((SELECT COALESCE(MAX(id),1) FROM inventario_vinculo_segmento),1));
COMMIT;
