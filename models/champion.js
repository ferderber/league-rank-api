const Sequelize = require('sequelize');

module.exports = class Champion extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        required: true
      },
      name: {
        type: Sequelize.STRING,
        required: true
      },
      key: {
        type: Sequelize.STRING,
        required: true
      },
      title: {
        type: Sequelize.STRING,
        required: true
      }
    }, {sequelize});
  }
  static associate(models) {
    this.hasMany(models.ChampionMastery, {foreignKey: 'championId'});
  }
}