const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const { createApp } = require('../src/app');
const { createDatabase } = require('../src/config/database');

const databases = [];

function startTestServer(parser) {
  const database = createDatabase(':memory:');
  databases.push(database);
  const app = createApp({ database, parser });

  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`
      });
    });
  });
}

afterEach(() => {
  for (const database of databases.splice(0)) {
    database.close();
  }
});

test('importa artigos, deduplica por link e lista mais recentes primeiro', async (context) => {
  const parser = {
    parseURL: async () => ({
      title: 'Fonte de notícias',
      items: [
        {
          title: 'Artigo antigo',
          link: 'https://exemplo.test/antigo',
          isoDate: '2025-01-03T10:00:00Z',
          contentSnippet: 'Conteúdo antigo'
        },
        {
          title: 'Artigo recente',
          link: 'https://exemplo.test/recente',
          pubDate: '2025-02-05T10:00:00Z',
          contentSnippet: 'Conteúdo recente'
        }
      ]
    })
  };
  const { server, baseUrl } = await startTestServer(parser);
  context.after(() => new Promise((resolve) => server.close(resolve)));

  const firstImport = await fetch(`${baseUrl}/feeds/importar`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: 'https://exemplo.test/feed.xml' })
  });
  assert.equal(firstImport.status, 200);
  assert.deepEqual(await firstImport.json(), { importados: 2 });

  const secondImport = await fetch(`${baseUrl}/feeds/importar`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: 'https://exemplo.test/feed.xml' })
  });
  assert.deepEqual(await secondImport.json(), { importados: 0 });

  const articlesResponse = await fetch(`${baseUrl}/artigos`);
  const articles = await articlesResponse.json();
  assert.equal(articlesResponse.status, 200);
  assert.deepEqual(articles.map((article) => article.titulo), [
    'Artigo recente',
    'Artigo antigo'
  ]);
  assert.equal(articles[0].data_publicacao, '2025-02-05');
  assert.equal(articles[0].fonte, 'Fonte de notícias');
});

test('retorna HTTP 422 para URL ausente ou inválida', async (context) => {
  const parser = { parseURL: async () => ({ title: 'Fonte', items: [] }) };
  const { server, baseUrl } = await startTestServer(parser);
  context.after(() => new Promise((resolve) => server.close(resolve)));

  for (const body of [{}, { url: 'nao-e-url' }, { url: 'file:///feed.xml' }]) {
    const response = await fetch(`${baseUrl}/feeds/importar`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });

    assert.equal(response.status, 422);
    assert.match((await response.json()).erro, /URL/);
  }
});

test('retorna um erro JSON 404 para recursos inexistentes', async (context) => {
  const parser = { parseURL: async () => ({ title: 'Fonte', items: [] }) };
  const { server, baseUrl } = await startTestServer(parser);
  context.after(() => new Promise((resolve) => server.close(resolve)));

  const response = await fetch(`${baseUrl}/recurso-inexistente`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { erro: 'Recurso não encontrado.' });
});
