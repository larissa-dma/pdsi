# Observatório de Turismo de Olímpia (OTO)

Aplicação web para apoiar a Secretaria de Turismo de Olímpia na organização do inventário turístico, coleta de pesquisas e consulta de informações para gestão do turismo. Projeto acadêmico PDSI.

O backend oferece uma API HTTP para o frontend consumir. O frontend será desenvolvido a partir das telas do Figma.

## Organização do repositório

| Pasta | Conteúdo | Documentação |
| --- | --- | --- |
| `backend/` | API Java 21, Spring Boot, autenticação, permissões e migrações Flyway | [Passo a passo do backend](backend/README.md) |
| `database/` | Estrutura PostgreSQL, catálogo de campos e scripts de dados fictícios | [Guia do banco](database/README.md) |

- [Banco, usuários e tipos de acesso](backend/sobre-o-banco.md)
- [Contrato de integração para o frontend](backend/docs/frontend.md)
- [Verificação e testes](backend/docs/verificacao.md)
- [Design no Figma](https://www.figma.com/design/0OqnmHVvJakoG8gGGZkNe6/Observat%C3%B3rio-de-Turismo-de-Ol%C3%ADmpia?node-id=0-1)

## Como começar

Siga o [README do backend](backend/README.md). 

| Serviço | Endereço local |
| --- | --- |
| API | http://localhost:8080/api |
| Documentação Swagger | http://localhost:8080/swagger-ui/index.html |
| PostgreSQL | `localhost:5432`, banco `oto` |
| Frontend permitido por padrão no CORS | http://localhost:5173 |

O PostgreSQL armazena os dados e o GitHub armazena os arquivos do projeto. 
Cada pessoa precisa configurar sua própria conexão. Dados inseridos no banco local não são enviados ao GitHub (esses dados são ficticios).

## O que foi implementado e o que está pendente

 Login e logout, perfis Secretaria/Hospedagem, criação de usuários, consulta/cadastro/edição do inventário e respostas tipadas, formulários com rascunho e envio, consultas de gestão e documentação da API.

Pendentes: frontend, gestão completa de usuários e recuperação de senha, contatos/CADASTUR, processamento de planilhas, relatórios, auditoria e cálculos conforme metodologia do OTO. Respostas dos formulários ainda não alimentam automaticamente as tabelas analíticas de ocupação e diária.

