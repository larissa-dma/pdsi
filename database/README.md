# OTO — PostgreSQL pronto para uso local

**Comece por [LEIA-ME-PASSO-A-PASSO.md](LEIA-ME-PASSO-A-PASSO.md) e execute `./iniciar.sh`.**

---

# OTO:  Estrutura do Inventário para PostgreSQL 

Este projeto **usa somente os metadados** enviados por Daniel (dicionário HTML, relatório PDF e estrutura das abas Excel). **Nenhuma linha de empresas ou profissionais do inventário foi copiada, exportada ou usada como base de dados fictícios**. Os dados demonstrativos são sintéticos.


## Arquivos

- `db/migrations/001_init.sql`: tabelas do projeto já previstas no DER v1 (pesquisas, indicadores, carga, cadastro inicial).
- `db/migrations/002_inventario_estrutura.sql`: novo esquema lógico-físico do Inventário, com restrições e índices.
- `db/migrations/003_catalogo_campos.sql`: 9 segmentos + 1.050 metadados, sem registros reais.
- `db/catalogo/dicionario_de_campos.csv`: matriz íntegra de origem e mapeamento tipo-lógico/SQL.
- `db/seeds/002_demo_inventario.sql`: 19 cadastros sintéticos, 20 vínculos e respostas sintéticas para teste.
- `db/seeds/001_demo.sql`: demonstração anterior de pesquisas, opcional, para ambiente vazio.
- `docs/resumo_estrutura.json`: quantitativos para verificação do catálogo.

## Início no Docker 

```bash
cp .env.example .env
# troque a senha de exemplo no .env
docker compose up -d
# PostgreSQL executa 001, 002 e 003 em ordem na PRIMEIRA criação do volume.
docker compose exec db psql -U oto_app -d oto -c "SELECT COUNT(*) FROM inventario_campo;"
# esperado: 1050
docker compose exec db psql -U oto_app -d oto -c "SELECT COUNT(*) FROM inventario_segmento;"
# esperado: 9
```

**Para adicionar registros fictícios (opcional, em desenvolvimento):**

```bash
docker compose exec -T db psql -v ON_ERROR_STOP=1 -U oto_app -d oto < db/seeds/002_demo_inventario.sql
```

**Se o volume PostgreSQL já existir:** os scripts de `/docker-entrypoint-initdb.d` não rodam novamente. Aplique 002 e 003 **nessa ordem**, com backup e controle de migração; **não** apague volume nem execute seed em banco de produção.

```bash
docker compose exec -T db psql -v ON_ERROR_STOP=1 -U oto_app -d oto < db/migrations/002_inventario_estrutura.sql
docker compose exec -T db psql -v ON_ERROR_STOP=1 -U oto_app -d oto < db/migrations/003_catalogo_campos.sql
```

## Exemplo de consultas

```sql
-- Campos disponíveis do Inventário (inclui 2 sem definição para revisão):
SELECT s.nome AS segmento, c.grupo_original, c.coluna_excel,
       c.campo_original, c.tipo_recomendado, c.tipo_sql_sugerido
FROM inventario_campo c
LEFT JOIN inventario_segmento s ON s.id=c.segmento_id
ORDER BY s.nome, c.coluna_excel;

-- Hospedagem, capacidade e UHs PCD (somente registros de demonstração):
SELECT * FROM vw_hospedagem_capacidade;

-- Um mesmo cadastro pertence a mais de um segmento:
SELECT r.nome, string_agg(s.nome, ' / ') AS segmentos
FROM registro_inventario r
JOIN inventario_vinculo_segmento v ON v.registro_id=r.id
JOIN inventario_segmento s ON s.id=v.segmento_id
GROUP BY r.id, r.nome HAVING COUNT(DISTINCT s.id)>1;
```

## Cuidados metodológicos obrigatórios

1. O **ID da planilha** é `TEXT`, não PK global: cada cadastro tem `id` interno do PostgreSQL.
2. **Hífen, NI, vazio** e `Não` escrito como valor requerem regras por campo. Não converter vazio automaticamente em 0 ou FALSE.
3. Código CADASTUR **1/2/3** indica obrigatoriedade/opcionalidade/não consta; **1/0** em outra coluna indica se o cadastro existe. Não misturar.
4. `Não`, `Sim` e `Outros` devem ser interpretados no contexto da pergunta; o catálogo mantém a **coluna, grupo e aba**.
5. Campos **opcionais/obrigatórios** ainda precisam de aprovação; `inventario_campo.obrigatorio` fica `NULL`.
6. Questionários de **acessibilidade** representam perguntas agrupadas, não 685 conceitos booleanos independentes. Uma etapa posterior deve definir catálogo lógico de perguntas e resolver pares Sim/Não antes de importação.
7. A aba auxiliar oculta **Carol e Kis** tem 153 posições, não é 10º segmento e não deve ser misturada a hospedagem sem revisão.
8. CNPJ, CPF, CADASTUR, endereço, contato e dados internos não têm publicação autorizada; `inventario_canal.publico` é `FALSE` por padrão.
9. O relatório do Daniel propõe tipos e precisão conceituais. Definições de catálogos, cardinalidade fina, obrigatoriedade e significado de marcadores ainda dependem de validação do OTO.
10. O seed é **100% fictício** e não deve ser confundido com a origem. Nome, coordenadas e documentações do seed são exemplos artificiais, NÃO observações reais.

Fontes: material fornecido pelo Daniel em 09/10/2026 (dicionário HTML, relatório de estrutura PDF e Excel do inventário). Modelagem anterior no Figma: https://www.figma.com/design/0OqnmHVvJakoG8gGGZkNe6/Observat%C3%B3rio-de-Turismo-de-Ol%C3%ADmpia?node-id=12-2574
