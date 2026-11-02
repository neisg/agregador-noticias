# Agregador de Notícias

API REST para importar artigos de feeds RSS e consultá-los. A evolução futura
do projeto inclui resumos gerados por IA.

## Stack

- Node.js 20+
- Express
- SQLite com `better-sqlite3`
- `rss-parser`
- SDK Claude para JavaScript (`@anthropic-ai/sdk`)

## Como rodar

1. Instale o Node.js 20 ou superior.
2. Instale as dependências com `npm install`.
3. Copie `.env.example` para `.env` se quiser configurar variáveis locais.
4. Inicie a API com `npm start` (ou `npm run dev` durante o desenvolvimento).

O servidor usa a porta `3000` por padrão; defina `PORT` para alterá-la. O banco
SQLite local é criado automaticamente na inicialização em `data/noticias.sqlite`.
Na primeira inicialização, o esquema também é criado se ainda não existir.

Para executar os testes, use `npm test`.

## Estrutura de pastas

```text
src/
  config/
    database.js
  repositories/
    artigos-repository.js
  routes/
    api.js
  services/
    feed-service.js
  app.js
  server.js
test/
  artigos.test.js
  database-persistence.test.js
data/                 # banco local, criado na inicialização
```

## Convenções

- A API é REST e responde em JSON.
- Datas de publicação são armazenadas no formato ISO `YYYY-MM-DD`.
- Erros de validação retornam HTTP 422 no formato
  `{ "erro": "<mensagem>" }`.
- Recursos inexistentes retornam HTTP 404.
- A chave da API Claude deve ser fornecida exclusivamente pela variável de
  ambiente `ANTHROPIC_API_KEY`; nunca a inclua no código ou em arquivos
  versionados. O arquivo `.env` é ignorado pelo Git.
- O banco SQLite fica em um arquivo local e é criado, junto com seu esquema,
  na inicialização do servidor.
- Artigos sem data de publicação válida no feed usam a data de importação.
- A fonte do artigo usa o título do feed; se ele não existir, usa o host da URL.
