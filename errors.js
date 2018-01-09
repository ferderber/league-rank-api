const Sequelize = require('sequelize');

module.exports = async function (ctx, next) {
  try {
    await next();
  } catch (err) {
    console.log(err.constructor === Sequelize.UniqueConstraintError);
    ctx.status = err.statusCode || 500;
    switch (err.statusCode) {
      case 403:
        ctx.body = {
          message: "API key has expired. Please contact an administrator."
        };
        break;
      default:
        console.error(err);
    }
    ctx
      .app
      .emit('error', err, ctx);
  }
}