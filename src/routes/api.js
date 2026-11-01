const express = require('express');

function createApiRouter(articlesRepository, feedService) {
  const router = express.Router();

  router.post('/feeds/importar', async (request, response, next) => {
    const url = request.body?.url;

    if (typeof url !== 'string' || !url.trim()) {
      return response.status(422).json({ erro: 'Informe uma URL de feed válida.' });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return response.status(422).json({ erro: 'Informe uma URL de feed válida.' });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return response.status(422).json({ erro: 'A URL do feed deve usar HTTP ou HTTPS.' });
    }

    try {
      const imported = await feedService.importFeed(parsedUrl.toString());
      return response.json({ importados: imported });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/artigos', (request, response) => {
    response.json(articlesRepository.listAll());
  });

  return router;
}

module.exports = { createApiRouter };
