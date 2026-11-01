const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { createApp } = require('../src/app');
const { createDatabase } = require('../src/config/database');

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${server.address().port}`
      });
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

test('mantém artigos depois de reiniciar o servidor', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'agregador-noticias-'));
  const databasePath = path.join(directory, 'noticias.sqlite');
  let database;
  let server;

  try {
    database = createDatabase(databasePath);
    const parser = {
      parseURL: async () => ({
        title: 'Fonte persistente',
        items: [{
          title: 'Artigo persistente',
          link: 'https://exemplo.test/persistente',
          isoDate: '2025-03-10T12:00:00Z'
        }]
      })
    };
    const firstInstance = await listen(createApp({ database, parser }));
    server = firstInstance.server;

    const importResponse = await fetch(`${firstInstance.baseUrl}/feeds/importar`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://exemplo.test/feed.xml' })
    });
    assert.deepEqual(await importResponse.json(), { importados: 1 });

    await close(server);
    server = undefined;
    database.close();
    database = createDatabase(databasePath);

    const restartedInstance = await listen(createApp({ database }));
    server = restartedInstance.server;
    const articlesResponse = await fetch(`${restartedInstance.baseUrl}/artigos`);
    const articles = await articlesResponse.json();

    assert.equal(articlesResponse.status, 200);
    assert.equal(articles.length, 1);
    assert.equal(articles[0].titulo, 'Artigo persistente');
  } finally {
    if (server) {
      await close(server);
    }
    if (database && database.open) {
      database.close();
    }
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
