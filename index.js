const Koa = require('koa');
const Sequelize = require('sequelize');
const jwt = require('koa-jwt');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const routes = require('./routes');
const config = require('./config');
const errorHandler = require('./errors');

const app = new Koa();
const db = require('./models');
Object.assign(app.context, db.models);
db
  .models
  .Champion
  .findAll()
  .then((champions) => {
    app.context.champions = champions;

    if (process.env.NODE_ENV != 'prod') {
      app.use(cors());
    }

    app.use(errorHandler);

    app.use(bodyParser());

    routes.forEach(route => {
      app.use(route);
    });

    app.listen(config.PORT);
  });