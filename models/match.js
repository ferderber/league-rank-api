const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = class Match extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true
      },
      timestamp: {
        type: Sequelize.DATE,
        required: true
      },
      season: {
        type: Sequelize.INTEGER,
        required: true
      },
      queue: {
        type: Sequelize.INTEGER,
        required: true
      }
    }, {sequelize});
  }
  static associate(models) {
    this.hasMany(models.SummonerMatch, {
      foreignKey: 'gameId',
      sourceKey: 'id'
    });
  }
  static async getByIds(ids) {
    return await this.findAll({
      where: {
        id: {
          [Op.or]: ids
        }
      }
    });
  }
}
