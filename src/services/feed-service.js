const Parser = require('rss-parser');

function publicationDate(item, importedAt) {
  const value = item.isoDate || item.pubDate;
  const parsedDate = value ? new Date(value) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return importedAt;
  }

  return parsedDate.toISOString().slice(0, 10);
}

class FeedService {
  constructor(articlesRepository, parser = new Parser()) {
    this.articlesRepository = articlesRepository;
    this.parser = parser;
  }

  async importFeed(url) {
    let feed;

    try {
      feed = await this.parser.parseURL(url);
    } catch (error) {
      console.error('Falha ao buscar ou interpretar o feed RSS:', error);
      const feedError = new Error('Não foi possível buscar ou interpretar o feed RSS.');
      feedError.statusCode = 502;
      throw feedError;
    }

    const importedAt = new Date().toISOString().slice(0, 10);
    const source = feed.title?.trim() || new URL(url).hostname;
    const articles = (feed.items || [])
      .filter((item) => item.title?.trim() && item.link?.trim())
      .map((item) => ({
        titulo: item.title.trim(),
        link: item.link.trim(),
        data_publicacao: publicationDate(item, importedAt),
        fonte: source,
        conteudo: item.contentSnippet || item.content || item.summary || ''
      }));

    return this.articlesRepository.saveMany(articles);
  }
}

module.exports = { FeedService };
