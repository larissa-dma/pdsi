# Verificação com PostgreSQL

Em um banco local descartável:

1. Suba `docker compose up --build -d` e confira `docker compose logs api`.
2. Confira catálogo: `docker compose exec db psql -U oto_app -d oto -c 'SELECT count(*) FROM inventario_campo'` (1.050).
3. Faça login de Secretaria conforme `frontend.md`.
4. Crie dois registros, vincule ambos ao segmento hospedagem e crie uma conta para cada um.
5. Crie um formulário, entre em sessões separadas como cada hospedagem, salve valores diferentes e confirme que cada GET retorna apenas a resposta da própria conta.
6. Confirme que hospedagem recebe 403 em `/api/secretaria/painel`.
7. Confirme 400 ao enviar sem resposta obrigatória e ao salvar percentual 101; zero e false devem ser preservados.
8. Envie uma resposta completa; confirme 409 ao tentar alterá-la ou reenviá-la.
9. Confirme que escrita sem CSRF recebe 403 e consulta sem sessão recebe 401.
10. Reinicie a API: migrações não devem executar novamente e dados devem persistir.

Estas etapas dependem de PostgreSQL disponível e não equivalem aos testes unitários/web.

## Teste automatizado de integração

Com a API apontando para um banco descartável e um administrador configurado:

```sh
OTO_TEST_URL=http://localhost:8080/api OTO_TEST_ADMIN=seu-admin OTO_TEST_PASSWORD=sua-senha python3 scripts/smoke_test.py
```

O script usa apenas a biblioteca padrão de Python, como ferramenta opcional de verificação. A aplicação continua sendo inteiramente Java. O teste cria registros, usuários e formulários sintéticos; não execute no banco de produção.

## Resultado verificado em 09/11/2026

- `mvn package`: compilação e 10 testes passaram, sem falhas.
- PostgreSQL 14 temporário: V1, V2, V3 e V4 aplicadas; 9 segmentos e 1.050 campos carregados.
- Teste HTTP real: login, logout, CSRF, restrições de perfil, cadastros, vínculos, leitura/gravação de inteiro do inventário, rejeição de tipo inválido, rascunho, envio, obrigatoriedade, percentual e isolamento entre duas hospedagens passaram.
- Reinício com histórico Flyway existente: inicialização e testes passaram novamente.
- Dockerfile/Compose preparados, mas não executados neste computador (Docker indisponível). Banco original do usuário não foi modificado.
