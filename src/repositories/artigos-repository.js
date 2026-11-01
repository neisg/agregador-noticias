class ArtigosRepository {
  constructor(database) {
    this.database = database;
    this.insertArticle = database.prepare(`
      INSERT OR IGNORE INTO artigo
        (titulo, link, data_publicacao, fonte, conteudo)
      VALUES
        (@titulo, @link, @data_publicacao, @fonte, @conteudo)
    `);
    this.selectArticles = database.prepare(`
      SELECT id, titulo, link, data_publicacao, fonte, conteudo
      FROM artigo
      ORDER BY data_publicacao DESC, id DESC
    `);
  }

  saveMany(articles) {
    const insertMany = this.database.transaction((items) => {
      let imported = 0;

      for (const article of items) {
        imported += this.insertArticle.run(article).changes;
      }

      return imported;
    });

    return insertMany(articles);
  }

  listAll() {
    return this.selectArticles.all();
  }
}

module.exports = { ArtigosRepository };
