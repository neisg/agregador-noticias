const { createApp } = require('./app');
const { createDatabase } = require('./config/database');

const database = createDatabase();
const app = createApp({ database });
const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, () => {
  console.log(`API Agregador de Notícias disponível na porta ${port}.`);
});

function shutdown() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
