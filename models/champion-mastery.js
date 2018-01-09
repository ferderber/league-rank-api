const Sequelize = require('sequelize');

module.exports = class ChampionMastery extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      summonerId: {
        type: Sequelize.BIGINT,
        required: true
      },
      championId: {
        type: Sequelize.INTEGER,
        required: true
      },
      championPoints: {
        type: Sequelize.INTEGER,
        required: true
      },
      championLevel: {
        type: Sequelize.INTEGER,
        required: true
      },
      championPointsUntilNextLevel: {
        type: Sequelize.INTEGER,
        required: true
      }
    }, {sequelize});
  }
  static associate(models) {
    this.belongsTo(models.Summoner, {foreignKey: 'summonerId'});
    this.belongsTo(models.Champion, {foreignKey: 'championId'});
  }
}
