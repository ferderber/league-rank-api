const Sequelize = require('sequelize');

module.exports = class SummonerMatch extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      gameId: {
        type: Sequelize.BIGINT,
        primaryKey: false
      },
      summonerId: {
        type: Sequelize.BIGINT,
        required: true
      },
      championId: {
        type: Sequelize.INTEGER,
        required: true
      },
      kills: {
        type: Sequelize.INTEGER,
        required: true
      },
      deaths: {
        type: Sequelize.INTEGER,
        required: true
      },
      assists: {
        type: Sequelize.INTEGER,
        required: true
      },
      wardsPlaced: {
        type: Sequelize.INTEGER,
        required: true
      },
      goldEarned: {
        type: Sequelize.INTEGER,
        required: true
      },
      role: {
        type: Sequelize.STRING,
        required: true
      },
      win: {
        type: Sequelize.BOOLEAN,
        required: true
      }
    }, {sequelize})
  }
  static associate(models) {
    this.hasMany(models.Summoner, {
      foreignKey: 'summonerId',
      sourceKey: 'id'
    });
    this.hasMany(models.Summoner, {
      foreignKey: 'championId',
      sourceKey: 'id'
    });
  }
}
