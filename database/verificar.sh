#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ ! -f .env ]]; then echo 'Execute ./iniciar.sh primeiro'; exit 1; fi
set -a; . ./.env; set +a
docker compose exec -T db psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<'SQL'
DO $$ BEGIN
 IF (SELECT COUNT(*) FROM inventario_segmento) <> 9 THEN
   RAISE EXCEPTION 'Esperados 9 segmentos'; END IF;
 IF (SELECT COUNT(*) FROM inventario_campo) <> 1050 THEN
   RAISE EXCEPTION 'Esperados 1050 metadados'; END IF;
 IF (SELECT COUNT(*) FROM inventario_campo WHERE auxiliar) <> 153 THEN
   RAISE EXCEPTION 'Esperados 153 campos auxiliares'; END IF;
 IF (SELECT COUNT(*) FROM registro_inventario WHERE nome LIKE 'FICTICIO -%') <> 19 THEN
   RAISE EXCEPTION 'Esperados 19 cadastros fictícios'; END IF;
 IF (SELECT COUNT(*) FROM inventario_vinculo_segmento) <> 20 THEN
   RAISE EXCEPTION 'Esperados 20 vínculos de segmentos'; END IF;
 IF (SELECT COUNT(*) FROM inventario_resposta WHERE ficticio) = 0 THEN
   RAISE EXCEPTION 'Seed sem respostas sintéticas'; END IF;
 RAISE NOTICE 'Integridade básica da demonstração validada.';
END $$;
SELECT s.nome AS segmento, COUNT(v.id) AS vinculos
FROM inventario_segmento s LEFT JOIN inventario_vinculo_segmento v ON v.segmento_id=s.id
GROUP BY s.nome ORDER BY s.nome;
SQL
