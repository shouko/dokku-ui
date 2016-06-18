module.exports = {
  title: process.env.TITLE || 'Dokku UI',
  db_url: process.env.DATABASE_URL || 'sqlite:///tmp/dokku-ui.db'
}
