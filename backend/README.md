# Backend — Observatório de Turismo de Olímpia

API Java 21 + Spring Boot 3.5 + PostgreSQL. Não requer Python. Projeto inicial para integração do frontend; funcionalidades ainda pendentes estão listadas abaixo.

## Rodar com Docker Desktop

1. Copie `.env.example` para `.env`.
2. Troque `DATABASE_PASSWORD` e `ADMIN_PASSWORD` (12 caracteres ou mais, até 72 bytes). Configure o identificador do administrador.
3. Execute `docker compose up --build -d`.
4. Abra http://localhost:8080/swagger-ui/index.html para consultar os endpoints.
5. Para acompanhar a inicialização: `docker compose logs -f api`.

O banco novo recebe as três migrações originais de `larissa-dma/pdsi` e a migração V4. O catálogo contém 9 segmentos e 1.050 campos. Não são carregadas empresas reais nem seeds demonstrativos. O primeiro administrador é criado apenas se o identificador ainda não existir; alterar as variáveis não altera uma conta existente.

## Usar o banco que já existe

Não é necessário criar outro banco. Com Java 21 e Maven 3.9+, configure `DATABASE_URL=jdbc:postgresql://localhost:5432/oto`, `DATABASE_USER`, `DATABASE_PASSWORD`, `ADMIN_IDENTIFIER` e `ADMIN_PASSWORD` no ambiente e execute `mvn spring-boot:run`. O Spring não lê `.env` automaticamente ao rodar fora do Compose.

Se o banco já contém EXATAMENTE as migrações originais 001, 002 e 003 e ainda não usa Flyway, faça backup, confira o esquema e execute **uma vez**:

```sh
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.flyway.baseline-on-migrate=true --spring.flyway.baseline-version=3"
```

Isso registra a versão 3 como existente e aplica V4. Não use baseline 3 em banco vazio ou com migrações incompletas. Depois inicie normalmente. Nunca apague o volume para atualizar o banco. As migrações originais foram preservadas; origem: https://github.com/larissa-dma/pdsi/tree/main/database.

## Integração

Veja [docs/frontend.md](docs/frontend.md) para autenticação, CSRF, cookies, exemplos e fluxo de formulários. Listas paginadas retornam até 50 itens, com `?pagina=0`, `?pagina=1` etc.

## Verificação

```sh
mvn test
mvn package
```

Os testes unitários verificam validação das respostas. Os testes web verificam permissões e CSRF com infraestrutura de banco simulada. A validação das migrações e do fluxo completo requer PostgreSQL; consulte `docs/verificacao.md`.

## Escopo entregue e próximos módulos

Inclui login/sair, consulta do usuário, criação de usuários pela Secretaria, cadastro e consulta de registros, vínculos com segmentos, consulta de catálogo e leitura/gravação de respostas tipadas do inventário, criação/listagem de formulários, rascunho, envio e consulta das respostas. Também inclui contagens do painel e consulta de pesquisas, importações, erros e indicadores existentes.

Ainda pendentes: gestão de contatos/CADASTUR, upload/processamento de planilhas, cálculo de indicadores conforme metodologia do OTO, relatórios PDF/XLSX, recuperação de senha, gestão completa de usuários, auditoria e definição final das perguntas com o grupo. Formulários usam perguntas dinâmicas; suas respostas ainda não alimentam automaticamente `ocupacao_fluxo` ou `diaria_media`, pois isso exige um mapeamento de perguntas e períodos aprovado. As telas foram inspecionadas estruturalmente; não se presume cobertura integral de todos os fluxos do Figma.

Antes de publicar, use HTTPS, `COOKIE_SECURE=true`, origem exata do frontend e remova as variáveis de bootstrap após criar o administrador. Sessões ficam na memória da API; reiniciar encerra os logins. Hospedar frontend e API na mesma origem (por proxy `/api`) simplifica cookies; em desenvolvimento, use `localhost` em ambos.
