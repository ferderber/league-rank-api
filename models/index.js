const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const config = require('../config');

const sequelize = new Sequelize(config.DATABASE, config.USERNAME, config.PASSWORD, {
  host: 'localhost',
  dialect: 'postgres',
  operatorsAliases: Sequelize.Op
});

const models = Object.assign({}, ...fs.readdirSync(__dirname).filter(file => (file.indexOf(".") !== 0) && (file !== "index.js")).map((file) => {
  const model = require(path.join(__dirname, file));
  return {
    [model.name]: model.init(sequelize)
  };
}));

Object
  .keys(models)
  .forEach(modelName => {
    if (models[modelName].associate) {
      models[modelName].associate(sequelize.models);
    }
  });

module.exports = sequelize;
