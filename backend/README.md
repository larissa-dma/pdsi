# Backend — Observatório de Turismo de Olímpia

API em Java 21 + Spring Boot 3.5 + PostgreSQL, com Spring Security, JDBC, Flyway e Swagger. Este guia reproduz o caminho que funcionou no Mac com zsh, sem Docker. Python 3 é usado apenas nos exemplos para ler e montar JSON no terminal; a aplicação é Java.

## 1. Clonar e entrar na pasta correta

```bash
cd ~
git clone https://github.com/larissa-dma/pdsi.git
cd ~/pdsi/backend
```

## 2. Conferir e iniciar o PostgreSQL

```bash
psql --version
brew services list
```

No ambiente usado aqui no meu, o PostgreSQL 14 estava instalado pelo Homebrew e aparecia como `started`. Nesse caso, não é necessário Docker.

Se ainda não estiver instalado e for usar a mesma versão:

```bash
brew install postgresql@14
brew services start postgresql@14
```

Se já está instalado mas parado, use `brew services start postgresql@14`. Se a instalação existente for de outra versão, use o nome correspondente mostrado por `brew services list`.

Liste os bancos sem abrir o paginador:

```bash
psql -d postgres -P pager=off -c '\l'
```

Se aparecer uma listagem terminando com `:`, pressione `q` para sair. Se o banco `oto` ainda não existir:

```bash
createdb oto
psql -d oto -c 'SELECT current_database();'
```

O resultado deve ser `oto`. Se o banco já existe, não o recrie nem apague. Veja a seção de banco existente antes de iniciar o backend.

## 3. Instalar Java 21 e Maven

```bash
brew install openjdk@21 maven
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
java -version
mvn -version
```

O Java deve mostrar versão 21. As variáveis acima valem para a aba atual; execute-as em uma nova aba antes de usar Maven se necessário. Se desejar torná-las permanentes, adicione as duas linhas `export` ao seu `~/.zshrc` uma única vez.

## 4. Configurar conexão e primeiro administrador

Na aba em que vai iniciar a API:

```bash
cd ~/pdsi/backend
export DATABASE_URL="jdbc:postgresql://localhost:5432/oto"
export DATABASE_USER="$(whoami)"
export DATABASE_PASSWORD=""
export ADMIN_IDENTIFIER="admin@oto.local"
read -s "ADMIN_PASSWORD?Crie a senha do administrador (mínimo 12 caracteres): "
export ADMIN_PASSWORD
echo
```

Na configuração testada, o usuário PostgreSQL era `katielylacerda`, igual ao usuário do Mac. `$(whoami)` usa o nome de quem está executando; se seu usuário PostgreSQL for diferente, substitua por ele.

`DATABASE_PASSWORD=""` representa senha vazia e só serve quando o PostgreSQL local permite essa conexão. Caso ele exija uma senha, defina-a assim:

```bash
read -s "DATABASE_PASSWORD?Digite a senha do PostgreSQL: "
export DATABASE_PASSWORD
echo
```

A senha PostgreSQL e a senha de login do administrador são coisas diferentes. Copie o comando `read` exatamente como está, pressione Enter, digite sua senha e pressione Enter novamente. Ela não aparece na tela. Não coloque a senha no lugar de `ADMIN_PASSWORD` nem dentro do texto do comando. Se errar, use Ctrl+C e repita.

O administrador exige pelo menos 12 caracteres e no máximo 72 bytes. Não há senha padrão no repositório. A conta é criada como `Administrador`, perfil `SECRETARIA`, apenas se o identificador ainda não existir. Alterar `ADMIN_PASSWORD` depois não troca a senha já gravada.

## 5. Iniciar o backend e criar as tabelas

```bash
mvn spring-boot:run
```

Na primeira execução, o Maven baixa as dependências. Em banco vazio, o Flyway aplica V1 a V4: estrutura inicial, inventário, catálogo e autenticação/formulários. Não é necessário executar as migrações SQL manualmente nesse caminho.

Procure no log:

```text
Successfully applied 4 migrations
Tomcat started on port 8080
Started OtoApplication
```

Nas próximas execuções, é esperado que as migrações já estejam aplicadas. Deixe essa aba aberta; Ctrl+C encerra a API. A API continua ocupando o terminal enquanto está rodando, isso é normal.

Abra http://localhost:8080/swagger-ui/index.html para consultar os endpoints. O Swagger atual não oferece um formulário pronto de login. `GET /api/csrf` com código 200 apenas gera o token; não autentica você.

## 6. Login em outra aba do terminal

Abra uma nova aba com Command+T. Não pare a API. Os comandos abaixo funcionam em qualquer pasta.

Crie arquivos temporários exclusivos para guardar os cookies e o token desta sessão:

```bash
OTO_COOKIES=$(mktemp /tmp/oto-cookies.XXXXXX)
OTO_CSRF=$(mktemp /tmp/oto-csrf.XXXXXX)
curl -sS -c "$OTO_COOKIES" \
  http://localhost:8080/api/csrf \
  -o "$OTO_CSRF"
```

Digite a mesma senha que usou para criar o administrador:

```bash
read -s "OTO_SENHA?Digite a senha do administrador: "
echo
```

Agora faça o login:

```bash
OTO_TOKEN=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["token"])' "$OTO_CSRF")
curl -i -b "$OTO_COOKIES" -c "$OTO_COOKIES" \
  -H "X-XSRF-TOKEN: $OTO_TOKEN" \
  --data-urlencode "identificador=admin@oto.local" \
  --data-urlencode "password=$OTO_SENHA" \
  http://localhost:8080/api/login
unset OTO_SENHA
```

`HTTP/1.1 204` significa login realizado. `401` indica credenciais inválidas; `403` pode indicar token CSRF ausente ou inválido. Se precisar repetir, busque o CSRF novamente e digite a senha de novo.

Na conversa inicial foram usados os caminhos fixos `/tmp/oto-cookies.txt` e `/tmp/oto-csrf.json`. Aqui os arquivos são exclusivos por sessão para evitar misturar logins. Continue na mesma aba para manter as variáveis `OTO_COOKIES` e `OTO_CSRF`.

## 7. Consultar usuário e painel

```bash
curl -sS -b "$OTO_COOKIES" http://localhost:8080/api/me
curl -sS -b "$OTO_COOKIES" http://localhost:8080/api/secretaria/painel
```

A primeira resposta será semelhante a:

```json
{"id":1,"nome":"Administrador","identificador":"admin@oto.local","perfil":"SECRETARIA","estabelecimento_id":null}
```

`estabelecimento_id: null` é esperado para esse administrador. Antes de cadastrar dados, o painel retorna:

```json
{"registros_inventario":0,"formularios":0,"respostas_enviadas":0,"importacoes":0}
```

O catálogo de campos e segmentos não entra nessas contagens. O caractere `%` que o zsh pode mostrar no fim do JSON não faz parte da resposta.

O login pelo curl não autentica o navegador do Swagger. Cada um mantém seus próprios cookies. A sessão expira após 30 minutos de inatividade e é perdida quando a API reinicia.

## 8. Popular o inventário com dados fictícios

Execute apenas em banco local de desenvolvimento sem vínculos de inventário. Se já carregou e encontrou 19 registros, pule este passo.

```bash
cd ~/pdsi
psql -d oto -v ON_ERROR_STOP=1 -f database/db/seeds/002_demo_inventario.sql
psql -d oto -c 'SELECT COUNT(*) FROM registro_inventario;'
```

Em banco sem cadastros, o resultado é 19. O seed adiciona 19 registros fictícios, 20 vínculos e respostas de exemplo. Se já houver vínculos, ele interrompe a carga; não remova a proteção. O `COMMIT` indica que a transação foi concluída.

Consulte os dados pela API:

```bash
curl -sS -b "$OTO_COOKIES" http://localhost:8080/api/secretaria/painel
curl -sS -b "$OTO_COOKIES" http://localhost:8080/api/secretaria/inventario/registros
```

Formulários, respostas enviadas e importações continuam zerados se não houver outras cargas. O seed não cria usuários de hospedagem nem senhas.

Não execute `001_demo.sql` nesse banco: ele exige tabelas de negócio vazias, inclusive `usuario`, e será bloqueado pelo administrador existente. Veja o [README do banco](../database/README.md).

## 9. Criar outros logins

É necessário estar autenticado como Secretaria. Antes de qualquer POST/PUT, renove o CSRF, pois o login troca o token:

```bash
curl -sS -b "$OTO_COOKIES" -c "$OTO_COOKIES" \
  http://localhost:8080/api/csrf -o "$OTO_CSRF"
OTO_TOKEN=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["token"])' "$OTO_CSRF")
```

Para criar uma hospedagem, primeiro consulte os segmentos e registros:

```bash
curl -sS -b "$OTO_COOKIES" http://localhost:8080/api/secretaria/inventario/segmentos
curl -sS -b "$OTO_COOKIES" http://localhost:8080/api/secretaria/inventario/registros
```

Escolha um registro que pertença ao segmento `hospedagem`. Com o seed acima, o registro `1011` é uma opção. Confira o vínculo:

```bash
curl -sS -b "$OTO_COOKIES" http://localhost:8080/api/secretaria/inventario/registros/1011
```

Prepare o cadastro. Digite a senha somente quando o terminal pedir:

```bash
OTO_USUARIO_JSON=$(mktemp /tmp/oto-usuario.XXXXXX)
python3 - "$OTO_USUARIO_JSON" <<'PYUSER'
import getpass, json, sys
usuario = {
    "nome": "Responsável da hospedagem fictícia",
    "identificador": "hospedagem@exemplo.invalid",
    "senha": getpass.getpass("Crie a senha (mínimo 12 caracteres): "),
    "perfil": "HOSPEDAGEM",
    "estabelecimentoId": 1011
}
with open(sys.argv[1], "w") as arquivo:
    json.dump(usuario, arquivo)
PYUSER
curl -i -b "$OTO_COOKIES" -c "$OTO_COOKIES" \
  -H "X-XSRF-TOKEN: $OTO_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary "@$OTO_USUARIO_JSON" \
  http://localhost:8080/api/secretaria/usuarios
rm -f "$OTO_USUARIO_JSON"
```

`201` significa usuário criado. Não repita o mesmo identificador: ele é único. Para criar outro usuário da Secretaria, altere `nome`, `identificador`, `perfil` para `SECRETARIA` e `estabelecimentoId` para `None` no exemplo Python (vira `null` no JSON).

Para testar o novo login, repita o passo 6 com novos arquivos temporários e troque `identificador=admin@oto.local` pelo identificador criado. Use outra aba para manter a sessão do administrador. Usuários de hospedagem consultam `GET /api/formularios`; recebem 403 nas rotas `/api/secretaria/**`. Veja a [lista de perfis e usuários](sobre-o-banco.md).

## 10. Sair e iniciar novamente depois

Na aba autenticada, renove o CSRF como no passo 9 e execute:

```bash
curl -i -b "$OTO_COOKIES" -c "$OTO_COOKIES" \
  -H "X-XSRF-TOKEN: $OTO_TOKEN" \
  -X POST http://localhost:8080/api/logout
rm -f "$OTO_COOKIES" "$OTO_CSRF"
unset OTO_TOKEN OTO_COOKIES OTO_CSRF
```

Logout retorna 204. Para parar a API, use Ctrl+C na aba do Maven. Os dados permanecem no PostgreSQL.

Para voltar a usar em outra sessão de terminal, configure Java e as variáveis `DATABASE_*` novamente, entre em `~/pdsi/backend` e execute `mvn spring-boot:run`. Se o administrador já existe, você pode omitir o bootstrap:

```bash
unset ADMIN_IDENTIFIER ADMIN_PASSWORD
```

A conta e a senha existentes permanecem no banco. Não é preciso executar seeds nem criar o banco novamente. O Spring não lê `.env` automaticamente quando iniciado por Maven; use as variáveis do terminal.

## Banco que já tem tabelas

Se o Flyway já criou `flyway_schema_history`, inicie normalmente. Se o banco contém exatamente as migrações originais 001, 002 e 003, aplicadas manualmente ou pelo Docker de `database/`, mas não tem histórico Flyway, faça backup e confira o esquema. Só nesse caso execute uma vez:

```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.flyway.baseline-on-migrate=true --spring.flyway.baseline-version=3"
```

Isso marca V1–V3 como existentes e aplica V4. Não use baseline 3 em banco vazio ou parcialmente migrado. Não execute novamente os SQLs originais sobre um banco já migrado.

## Alternativa com Docker

Para criar um ambiente separado e novo: copie `backend/.env.example` para `backend/.env`, configure as senhas e, dentro de `backend/`, execute `docker compose up --build -d`. Esse Compose cria seu próprio PostgreSQL e a API. Não o use simultaneamente ao PostgreSQL local na porta 5432 nem a outra API na 8080. O Compose de `database/` cria apenas o banco com V1–V3; para conectá-lo à API, siga a seção de banco existente. Docker não foi necessário no caminho validado aqui.

## Erros comuns

| Mensagem/situação | Como proceder |
| --- | --- |
| `docker: command not found` | Siga o caminho Homebrew deste guia. |
| `Unable to locate a Java Runtime` | Configure Java conforme passo 3. |
| `zsh: not an identifier` no `read` | Copie o comando com o nome da variável; só digite a senha depois do Enter. |
| `connection refused` | Confira se PostgreSQL/API está rodando e se a porta está correta. |
| `password authentication failed` | Configure a senha e o usuário PostgreSQL corretos. |
| Login 401 | Use o identificador e a senha gravados na criação; mudar o export não troca a senha existente. |
| Escrita 403 | Renove CSRF e confira cookies e perfil. |
| Porta 8080 ocupada | Confira se já existe uma API aberta em outra aba. |
| Seed interrompido por vínculos existentes | Não rode de novo; consulte os dados já carregados. |

## Contrato, testes e limites atuais

Veja [contrato do frontend](docs/frontend.md), [banco e acessos](sobre-o-banco.md) e [verificação](docs/verificacao.md). Para testar e empacotar:

```bash
cd ~/pdsi/backend
mvn test
mvn package
```

Inclui login/sair, criação de usuários, inventário com respostas tipadas, formulários com rascunho/envio e consultas de gestão. Ainda pendentes: gestão completa de usuários e recuperação de senha, contatos/CADASTUR, processamento de planilhas, indicadores calculados segundo metodologia do OTO, relatórios e auditoria. Formulários não alimentam automaticamente `ocupacao_fluxo` ou `diaria_media`.

Para publicar, configure HTTPS, `COOKIE_SECURE=true` e `FRONTEND_ORIGIN` com a origem exata. 
