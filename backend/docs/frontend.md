# Contrato para o frontend

Base local: `http://localhost:8080/api`. Configure `FRONTEND_ORIGIN` com a origem exata do frontend. Autenticação usa sessão (`JSESSIONID`), não token JWT. Todas as chamadas devem usar `credentials: 'include'`.

## Login

```js
const base = 'http://localhost:8080/api';
async function csrf() {
  return fetch(`${base}/csrf`, {credentials: 'include'}).then(r => r.json());
}
const token = await csrf();
const login = await fetch(`${base}/login`, {
  method: 'POST', credentials: 'include',
  headers: {'Content-Type': 'application/x-www-form-urlencoded',
            [token.headerName]: token.token},
  body: new URLSearchParams({identificador: 'admin@oto.local', password: senha})
});
if (!login.ok) throw new Error('Não foi possível entrar');
// Login renova o CSRF. Busque novamente antes da próxima escrita.
const sessionToken = await csrf();
const usuario = await fetch(`${base}/me`, {credentials: 'include'}).then(r => r.json());
```

`GET /me` retorna `id`, `nome`, `identificador`, `perfil` (`SECRETARIA` ou `HOSPEDAGEM`) e `estabelecimento_id`. A API determina o estabelecimento pela conta autenticada; o frontend não envia esse ID para salvar respostas.

Para POST/PUT/logout, envie JSON (exceto login) e o cabeçalho CSRF retornado por `/csrf`. Após sair (`POST /logout`), busque novo CSRF antes de entrar novamente.

## Criar cadastro e usuário (Secretaria)

`POST /secretaria/inventario/registros`:
```json
{"nome":"Hospedagem Exemplo","tipoCadastro":"estabelecimento","endereco":null,"bairro":null,"latitude":null,"longitude":null}
```

Consulte `GET /secretaria/inventario/segmentos`, identifique `codigo=hospedagem`, e vincule o cadastro usando `PUT /secretaria/inventario/registros/{id}/segmentos/{segmentoId}`.

`POST /secretaria/usuarios`:
```json
{"nome":"Responsável","identificador":"hospedagem@exemplo.com","senha":"uma-senha-com-12-caracteres","perfil":"HOSPEDAGEM","estabelecimentoId":1}
```

Use o ID real retornado pelo cadastro. Só registros vinculados ao segmento hospedagem podem ser associados a contas.

## Formulários

A Secretaria cria via `POST /secretaria/formularios`:
```json
{"titulo":"Pesquisa mensal","referencia":"2026-12","prazo":"2026-12-31","perguntas":[{"chave":"ocupacao","titulo":"Ocupação em percentual","tipo":"percentual","obrigatoria":true},{"chave":"observacoes","titulo":"Observações","tipo":"texto","obrigatoria":false}]}
```

Tipos: `texto`, `inteiro` (não negativo), `decimal` (não negativo), `percentual` (0 a 100), `booleano`. Percentuais usam números na escala 0 a 100. `null` significa ausente; não substitua ausência por zero ou falso.

Hospedagem: `GET /formularios` e `GET /formularios/{id}`; `PUT /formularios/{id}/resposta` salva rascunho com `{"respostas":{"ocupacao":75.5}}`. Este PUT substitui o rascunho inteiro, por isso envie todas as respostas atuais. `POST /formularios/{id}/enviar` envia o rascunho salvo. Campos obrigatórios são exigidos no envio. Resposta enviada fica bloqueada, e não é possível salvar/enviar após o prazo (fuso America/Sao_Paulo). Cada formulário fica disponível a todas as contas de hospedagem vinculadas.

Secretaria: `GET /secretaria/formularios` e `GET /secretaria/formularios/{id}/respostas`.

## Consultas de gestão

- `GET /secretaria/painel`: contagens existentes, sem indicadores calculados artificialmente.
- `GET /secretaria/pesquisas`
- `GET /secretaria/importacoes` e `/secretaria/importacoes/{id}/erros`
- `GET /secretaria/indicadores` e `/secretaria/indicadores/{id}/observacoes`
- `GET /secretaria/inventario/registros?busca=nome&pagina=0`
- `GET /secretaria/inventario/registros/{id}` e `/{id}/respostas`
- `GET /secretaria/inventario/campos?segmentoId=1`

IDs PostgreSQL são inteiros de 64 bits; preservar como string no frontend quando necessário. Decimais são números JSON. Respostas retornam nomes das colunas SQL, salvo os DTOs de entrada descritos acima. Erros: 400 dados inválidos, 401 sem login/credenciais inválidas, 403 sem permissão ou CSRF inválido, 404 inexistente, 409 duplicidade/prazo encerrado/resposta enviada. O frontend deve tratar status HTTP; mensagens podem variar entre Spring Security e validação de domínio.

## Alterar inventário (Secretaria)

`PUT /secretaria/inventario/registros/{id}` substitui os campos do cadastro usando o mesmo JSON da criação. `PUT /secretaria/inventario/vinculos/{vinculoId}/respostas/{campoId}` salva um valor tipado. Obtenha `vinculo_id` no detalhe do registro e o campo no catálogo do segmento.

Exemplo para campo inteiro: `{"valorInteiro":20,"textoOriginal":"20"}`. Os atributos disponíveis são `valorTexto`, `valorInteiro`, `valorDecimal`, `valorBooleano`, `valorData` (AAAA-MM-DD), `valorAno`, `valorLista` (array de strings), `latitude`, `longitude`, `textoOriginal` e `observacao`. Envie apenas o tipo indicado por `tipo_logico`; os demais ficam nulos. Para `booleano_detalhe`/`texto_indicacao`, texto e booleano podem coexistir. A função do banco original valida tipagem, segmento e percentuais. A gravação volta para situação de validação `pendente`; não implica conferência metodológica.

## Módulos integrados em 15/11/2026

- `GET /secretaria/usuarios?pagina=0`; `PUT /secretaria/usuarios/{id}/estado` com `{ativo:true/false}`; `PUT /secretaria/usuarios/{id}/senha` com `{novaSenha:...}`. Senha de 12 caracteres até 72 bytes. Não é permitido desativar a própria conta.
- `PUT /me/senha` com `{senhaAtual:...,novaSenha:...}` invalida a sessão atual. Redefinições invalidam sessões existentes pela versão de senha.
- Inventário aceita `descricao`, `razaoSocial` e `situacaoConferencia`; listagem aceita `segmentoId` e `situacao`. Complementos: GET `/secretaria/inventario/registros/{id}/complementos`, POST `/{canais|atividades|cadastur}` e DELETE `/{tipo}/{complementoId}`.
- `GET /secretaria/analises/resumo?inicio=AAAA-MM-DD&fim=AAAA-MM-DD&tipo=consolidado|expectativa`; `/analises/ocupacao` adiciona paginação; `/analises/mapa` e `/analises/sustentabilidade` fornecem dados reais cadastrados.
- POST `/secretaria/indicadores` com `nome`, `unidade`, `metodologia`, `ods` (array de números 1–17); POST `/secretaria/indicadores/{id}/observacoes` com `referencia`, `valor`, `fonte`.
- Formulários administrativos retornam `enviadas` e `publico`; `PUT /secretaria/formularios/{id}/prazo` recebe `{prazo:AAAA-MM-DD}`.
- `POST /secretaria/importacoes/preparar` recebe multipart com `arquivo`, sem definir manualmente Content-Type no fetch; retorna UUID, colunas, amostra e total. Tipos: inventario, ocupacao, diaria, demanda, controle, issqn, caged, veiculos, fretamento.
- `POST /secretaria/importacoes/previas/{uuid}/validar` recebe `{tipo,referencia,campos:{campoOTO:colunaArquivo}}`; retorna linhas válidas/erros. `POST /previas/{uuid}/confirmar` recebe `{somenteValidas:boolean}`. Prévia pertence ao usuário que a criou.
- `GET /secretaria/importacoes/{id}/linhas?pagina=0` consulta linhas originais preservadas de lotes novos. Os lotes anteriores à V6 podem não ter esse histórico.
- Relatórios: GET `/secretaria/relatorios/previa?tipo=...`; GET `/secretaria/relatorios/exportar?tipo=...&formato=csv|xlsx|pdf` retorna binário/attachment; GET `/secretaria/relatorios/historico` retorna últimos 50. Datas em ocupação, diária e bases externas; demais relatórios rejeitam datas para evitar filtros aparentes que não seriam aplicados.
- `GET /secretaria/auditoria?pagina=0`: usuário, método, caminho e data de ações; sem senhas ou corpo da requisição.

Todos os endpoints administrativos exigem Secretaria; escritas exigem CSRF. Limites e formato dos arquivos estão no [guia de uso](../../docs/guia-de-uso.md).
