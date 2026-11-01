const express = require('express');
const { ArtigosRepository } = require('./repositories/artigos-repository');
const { createApiRouter } = require('./routes/api');
const { FeedService } = require('./services/feed-service');

function createApp({ database, parser } = {}) {
  if (!database) {
    throw new Error('A conexão com o banco de dados é obrigatória.');
  }

  const articlesRepository = new ArtigosRepository(database);
  const feedService = new FeedService(articlesRepository, parser);
  const app = express();

  app.use(express.json());
  app.use(createApiRouter(articlesRepository, feedService));
  app.use((error, request, response, next) => {
    if (error.type === 'entity.parse.failed') {
      return response.status(422).json({ erro: 'O corpo da requisição deve ser um JSON válido.' });
    }

    const statusCode = error.statusCode || 500;
    if (statusCode === 500) {
      console.error('Erro inesperado na API:', error);
    }

    const message = statusCode === 500
      ? 'Erro interno do servidor.'
      : error.message;

    return response.status(statusCode).json({ erro: message });
  });

  return app;
}

module.exports = { createApp };
