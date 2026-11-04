# OTO / PostgreSQL demonstrativo — Instruções para Mac (Apple Silicon ou Intel)

Este projeto cria um **PostgreSQL 17 local**, com o catálogo das planilhas do Daniel e **registros inteiramente fictícios**. Não envia nada para a nuvem e não importa dados reais da Prefeitura.


## 1. Instalar o Docker Desktop

Baixe a versão do [Docker Desktop para Mac](https://www.docker.com/products/docker-desktop/), instale e abra o aplicativo. Espere aparecer que o Docker está funcionando.

## 2. Extrair e abrir a pasta

Extraia o ZIP, abra o Terminal e vá para a pasta, por exemplo:

```bash
cd ~/Downloads/OTO_PostgreSQL_Pronto_Para_Usar
```

Se o Terminal reclamar de permissões do script execute uma vez:

```bash
chmod +x iniciar.sh verificar.sh
```

## 3. Criar o PostgreSQL e popular

```bash
./iniciar.sh
```

O script gera uma senha aleatória em `.env`, inicia o contêiner, executa em ordem as três migrações e, se o inventário estiver vazio, popula com 19 cadastros fictícios (20 vínculos de segmentos) e respostas sintéticas.

Na **primeira criação** do volume Docker, os SQL de `db/migrations` são executados automaticamente. Na inicialização seguinte **não** serão reaplicados, e o script não duplica dados.

## 4. Confirmar os dados

```bash
./verificar.sh
```

Totais esperados: 9 segmentos, 1050 metadados (153 auxiliares), 19 cadastros fictícios e 20 vínculos de segmento; mais de zero respostas sintéticas.

## 5. Abrir no programa gráfico

Você pode instalar **DBeaver Community** ou **pgAdmin** e criar conexão PostgreSQL com:

| Campo | Valor |
|---|---|
| Host | `localhost` |
| Porta | `5432` (ou `OTO_DB_PORT` no `.env`) |
| Banco | `oto` |
| Usuário | `oto_app` |
| Senha | Valor de `POSTGRES_PASSWORD` no arquivo `.env` |

No editor SQL do programa, rode as consultas em `consultas_exemplo.sql`.

Também pode entrar pelo terminal sem instalar outro aplicativo:

```bash
docker compose exec db psql -U oto_app -d oto
```

No `psql`, digite `\dt` para listar tabelas; `SELECT COUNT(*) FROM inventario_campo;` para contar metadados; `\q` para sair.

## 6. Parar ou reiniciar

```bash
docker compose down          # pára o PostgreSQL sem apagar volume nem os dados
docker compose up -d         # reinicia
```

**Não** rode `docker compose down -v` ou `docker volume rm` sem backup: isso apaga o banco armazenado no volume.

## 7. Solução de problemas

- `docker: command not found`: instale Docker Desktop.
- `Cannot connect to the Docker daemon`: abra Docker Desktop.
- `port is already allocated` / porta 5432 em uso: altere `OTO_DB_PORT=5433` no `.env`, mantendo 5432 dentro do contêiner, depois `docker compose up -d`.
- Ao iniciar com volume **antigo** e faltar tabelas: não apague o volume. Aplique migrações faltantes após backup; procure ajuda antes de fazer mudanças destrutivas.
- Para guardar a senha em sigilo, nunca publique `.env`, e não coloque o ZIP com `.env` no repositório.

## 8. O que está efetivamente modelado

- **26 tabelas**: 18 do esquema inicial (`001_init.sql`) e 8 específicas do Inventário (`002_inventario_estrutura.sql`).
- **9 segmentos** turísticos com suas abas e cabeçalhos.
- **1050 campos catalogados** (`003_catalogo_campos.sql`), 897 nas abas visíveis e 153 na auxiliar.

## O que ainda falta : 
- Campos opcionais/obrigatórios, perguntas agrupadas, escolhas de opções e validação institucional ainda pendentes.
- O banco representa o mapeamento inicial, mas ainda precisamos validar:
- As regras de obrigatoriedade de cada campo.
- As opções definitivas dos campos de seleção.
- s agrupamentos das perguntas de acessibilidade.
- lgumas precisões e restrições dos tipos SQL.
- modelagem completa das pesquisas, que não estavam detalhadas nos três arquivos do Daniel.

*Todos os registros de teste são fictícios. 
