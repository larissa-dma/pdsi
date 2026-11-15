# Guia rápido de uso — OTO

## Entrar

Com API e frontend rodando, abra http://localhost:5173/login. Digite identificador e senha. A Secretaria acessa a gestão; a Hospedagem acessa os formulários do seu estabelecimento. A sessão do navegador é diferente da usada no curl. Após reiniciar a API, entre novamente.

## Contas de teste para a equipe

Acesse http://localhost:5173/login com uma das contas abaixo:

| Perfil | Login | Senha inicial |
| --- | --- | --- |
| **Secretaria** | `secretaria@oto.local` | `Oto-O536MjGrk2mNK-QT` |
| **Hospedagem** | `hospedagem@oto.local` | `Oto-uvg1mEEXI6jnu3ZR` |

Estas credenciais de demonstração foram registradas na documentação por decisão da responsável pelo repositório privado. As duas contas já foram criadas no banco local usado durante o desenvolvimento; clonar o repositório não copia esse banco nem cria essas contas automaticamente. Em outro ambiente, crie-as pela interface **Usuários e acessos**, após configurar o primeiro administrador. A conta de Hospedagem está vinculada ao cadastro fictício **1011 — Meios de hospedagem 01**; em outro banco, escolha o cadastro correspondente do segmento hospedagem.

Secretaria administra os módulos do sistema. Hospedagem preenche os formulários do estabelecimento vinculado. A conta `admin@oto.local` continua existindo separadamente, com a senha escolhida na configuração. As senhas das contas permanecem como hash BCrypt no PostgreSQL; a tabela acima documenta apenas as credenciais de teste.

## Preparar uma hospedagem

1. Na Secretaria, abra **Inventário → Novo registro**.
2. Preencha nome, tipo e os campos conhecidos; coordenadas são opcionais, mas devem ser informadas em par.
3. Salve o cadastro, escolha o segmento **Meios de hospedagem** e clique em **Vincular**.
4. Em **Usuários e acessos**, crie a conta, escolha `HOSPEDAGEM`, vincule esse registro e defina uma senha inicial com pelo menos 12 caracteres.
5. Entregue a senha ao responsável por um canal apropriado; não a publique no repositório. Ele pode trocar em **Minha conta / senha**.

## Criar e responder uma pesquisa

1. Em **Dados de pesquisas**, preencha título, referência, prazo e perguntas. Cada pergunta precisa de uma chave técnica única (letras minúsculas, números e sublinhado, começando com letra).
2. Escolha o tipo: texto, inteiro, decimal, percentual ou Sim/Não. Marque quais são obrigatórias no envio.
3. Publique. O formulário fica disponível às contas de hospedagem vinculadas; não há seleção individual de destinatários nesta versão.
4. Entre como hospedagem em outra sessão/navegador. Abra **Meus formulários** e selecione **Preencher**.
5. Salve um rascunho se precisar retomar depois. Zero e Não são valores válidos.
6. Revise e envie. Só a confirmação vinda do banco exibe sucesso. Após o envio, a resposta fica bloqueada.
7. A Secretaria consulta as respostas na pesquisa. Pode prorrogar o prazo; isso não desbloqueia respostas já enviadas.

As perguntas são dinâmicas e não são interpretadas automaticamente como medidas de ocupação ou diária. Para alimentar essas séries analíticas, utilize o importador com o esquema explícito de cada conjunto. Isso evita atribuir significado a perguntas não mapeadas.

## Manter o inventário

Busque pelo nome e filtre segmento ou conferência. Abra a ficha para editar identificação, endereço e coordenadas, vincular segmentos e preencher campos do catálogo. Campos de tipo lógico diferentes têm entradas diferentes. Nos complementos, registre contatos, atividades/CNAE e informações de CADASTUR. Contatos ficam internos por padrão; o marcador de autorização de publicação não cria um portal público.

Para dados complementares, corrija adicionando o registro adequado e removendo o incorreto. A remoção pede confirmação. A versão atual não remove cadastros mestres nem desvincula segmentos pela interface, para não apagar respostas ou quebrar contas vinculadas sem um fluxo específico.

## Importar arquivos

1. Abra **Importação**, escolha o conjunto e a referência do lote.
2. Baixe o modelo CSV correspondente para conhecer as colunas; ou adapte um XLSX com cabeçalho na primeira linha da primeira aba.
3. Envie o arquivo: até 10 MB, 5.000 linhas e 150 colunas. Fórmulas devem ser substituídas por valores.
4. Mapeie cada campo para a coluna de origem; deixe campos opcionais como não informados.
5. Valide e confira os dados normalizados e as pendências.
6. Corrija o arquivo e recomece, ou marque explicitamente a opção de confirmar apenas as linhas válidas.
7. Confirme a importação. As pendências são registradas no lote; as linhas de origem de arquivos novos ficam disponíveis no histórico.
8. Confira o painel/relatórios. Arquivo idêntico já confirmado para o mesmo tipo não pode ser importado novamente.

Conjuntos: inventário, ocupação/fluxo, diária, demanda, controle, ISSQN, CAGED, veículos e fretamento. O código do segmento do inventário deve ser o código técnico (ex.: `hospedagem`). Meses usam AAAA-MM ou AAAA-MM-01. Percentuais usam 0 a 100. Números usam decimal com ponto ou vírgula, sem separador de milhar. Textos como CPF/CNPJ/CNAE devem permanecer texto na planilha para preservar zeros.

ISSQN, CAGED e transporte usam um formato de observações com mês, medida, valor, unidade e recorte. Isso exige transformar as planilhas oficiais para o modelo ou mapear suas colunas equivalentes; não é um conector automático com esses serviços. Não misture medidas diferentes: saldo não é estoque; ISSQN não é renda turística. A equipe deve validar fonte, recorte e interpretação antes de publicar indicadores.

## Consultar e exportar

- **Visão geral:** filtros de período e modalidade para séries analíticas. Contagens cadastrais são totais e estão identificadas como tal.
- **Ocupação:** observações com mês, estabelecimento e arquivo de origem.
- **Mapa:** busca por nome/segmento; selecione um cadastro com coordenadas. Registros sem coordenadas continuam na lista. A base OpenStreetMap requer internet.
- **Sustentabilidade:** cadastre indicador, unidade, metodologia e números ODS; registre observações e suas fontes. Associações são da equipe, não representam progresso municipal oficial.
- **Relatórios:** escolha conjunto, recorte disponível e formato. Prévia de 50 linhas e exportação até 10.000. CSV, XLSX e PDF são gerados de dados reais do banco, inclusive quando os registros do banco são fictícios de teste.

## Senhas e permissões

Em **Minha conta / senha**, informe a senha atual e a nova, confirme e entre novamente. Se esqueceu, solicite à Secretaria a redefinição em **Usuários e acessos**. Não existe envio de recuperação por e-mail nesta versão. Desativar uma conta ou redefinir sua senha invalida suas sessões na próxima requisição.
