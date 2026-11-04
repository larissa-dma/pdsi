#!/usr/bin/env bash
# OTO - iniciar PostgreSQL local e adicionar base fictícia, sem destruir dados existentes.
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERRO: Docker não encontrado. Instale e inicie o Docker Desktop e execute novamente."
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "ERRO: o Docker Desktop não está iniciado. Abra-o antes de executar."
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "ERRO: Docker Compose não está disponível. Atualize o Docker Desktop."
  exit 1
fi
if [[ ! -f .env ]]; then
  if ! command -v openssl >/dev/null 2>&1; then
    echo "ERRO: openssl não encontrado para gerar uma senha. Crie .env a partir de .env.example."
    exit 1
  fi
  umask 077
  pwd="$(openssl rand -hex 18)"
  printf 'POSTGRES_DB=oto\nPOSTGRES_USER=oto_app\nPOSTGRES_PASSWORD=%s\nOTO_DB_PORT=5432\n' "$pwd" > .env
  echo 'Arquivo .env criado com senha aleatória (não compartilhar nem versionar).'
fi

set -a
# .env gerado tem apenas chaves simples e senha hexadecimal; evite caracteres de shell em edições manuais.
. ./.env
set +a

printf '\n1/4 Iniciando PostgreSQL 17...\n'
docker compose up -d --wait
printf '\n2/4 Conferindo catálogo de campos...\n'
q="SELECT COUNT(*) FROM inventario_campo;"
count="$(docker compose exec -T db psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "$q" | tr -d '\r\n')"
if [[ "$count" != '1050' ]]; then
  echo "ERRO: o catálogo contém $count campos, mas deveria conter 1050. Não serão inseridos dados fictícios."
  exit 1
fi
printf '\n3/4 Verificando se os exemplos já foram carregados...\n'
q="SELECT COUNT(*) FROM inventario_vinculo_segmento;"
count="$(docker compose exec -T db psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "$q" | tr -d '\r\n')"
if [[ "$count" == '0' ]]; then
  echo 'Adicionando registros de demonstração...'
  docker compose exec -T db psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" < db/seeds/002_demo_inventario.sql >/dev/null
else
  echo "Há $count vínculos no inventário. Não recarregando nem sobrescrevendo nada."
fi
printf '\n4/4 Conferindo totais...\n'
docker compose exec -T db psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /dev/stdin <<'SQL'
SELECT 'Tabelas' AS objeto,COUNT(*)::text AS total
  FROM pg_tables WHERE schemaname='public'
UNION ALL SELECT 'Segmentos',COUNT(*)::text FROM inventario_segmento
UNION ALL SELECT 'Campos no catálogo',COUNT(*)::text FROM inventario_campo
UNION ALL SELECT 'Cadastros fictícios',COUNT(*)::text FROM registro_inventario WHERE nome LIKE 'FICTICIO -%'
UNION ALL SELECT 'Vínculos por segmento',COUNT(*)::text FROM inventario_vinculo_segmento
UNION ALL SELECT 'Respostas fictícias',COUNT(*)::text FROM inventario_resposta WHERE ficticio
ORDER BY objeto;
SQL
printf '\nPRONTO: banco %s em localhost:%s, usuário %s.\n' "$POSTGRES_DB" "${OTO_DB_PORT:-5432}" "$POSTGRES_USER"
echo 'Consulte a senha em .env. Para parar sem apagar dados: docker compose down'
