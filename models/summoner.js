const Sequelize = require('sequelize');
module.exports = class Summoner extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        required: true
      },
      name: {
        type: Sequelize.STRING,
        required: true
      },
      accountId: {
        type: Sequelize.BIGINT,
        required: true
      },
      profileIconId: {
        type: Sequelize.INTEGER,
        required: true
      },
      revisionDate: {
        type: Sequelize.DATE,
        required: false
      },
      summonerLevel: {
        type: Sequelize.INTEGER,
        required: false
      }
    }, {sequelize});
  }
  static associate(models) {
    this.hasMany(models.ChampionMastery, {
      foreignKey: 'summonerId',
      sourceKey: 'id'
    });
  }
}
