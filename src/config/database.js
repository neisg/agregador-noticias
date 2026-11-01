const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const defaultDatabasePath = path.join(__dirname, '..', '..', 'data', 'noticias.sqlite');

function createDatabase(databasePath = defaultDatabasePath) {
  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const database = new Database(databasePath);
  database.pragma('journal_mode = WAL');
  database.exec(`
    CREATE TABLE IF NOT EXISTS artigo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      link TEXT NOT NULL UNIQUE,
      data_publicacao TEXT NOT NULL,
      fonte TEXT NOT NULL,
      conteudo TEXT NOT NULL DEFAULT ''
    );
  `);

  return database;
}

module.exports = { createDatabase };
