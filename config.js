let config = {
  LEAGUE_API_KEY: process.env.LEAGUE_API_KEY,
  BASE_PATH: '/api',
  DATABASE: 'league_rank',
  USERNAME: 'league',
  PASSWORD: 'league',
  PORT: 4000,
  ENV: 'production' //default to prod to ensure data is saved
};

switch (process.env.NODE_ENV) {
  case 'production':
  case 'prod':
    config.PORT = 4123;
    config.PASSWORD = process.env.DB_PASSWORD;
    break;
  default:
    config.ENV = 'development';
    config.PORT = 4000;
    break;
}

module.exports = config;