const Sequelize = require('sequelize');
const ClientError = require('./ClientError');

module.exports = async function (ctx, next) {
  try {
    await next();
  } catch (err) {
    switch (err.statusCode) {
      case 403:
        ctx.body = {
          message: "API key has expired. Please contact an administrator."
        };
        break;
      default:
        console.error(err);
    }
    ctx.status = err.statusCode || 500;
    if (err.constructor === ClientError) {
      Object.assign(ctx, err.getResponse());
    } else if (err.constructor === Sequelize.UniqueConstraintError) {
      console.log('Sequelize unique constraint: ' + err.message);
    }
    ctx
      .app
      .emit('error', err, ctx);
  }
}