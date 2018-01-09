const _ = require('./route-collector');
const LeagueJS = require('leaguejs');
const config = require('../config');
const api = new LeagueJS(config.LEAGUE_API_KEY, {
  caching: {
    isEnabled: true,
    defaults: {
      stdTTL: 120
    }
  }
});

function formatMastery(mastery) {
  return {summonerId: mastery.summonerId, championId: mastery.championId, championPoints: mastery.championPoints, championLevel: mastery.championLevel};
}

_.get('summoner/:id/mastery', async(ctx, id, next) => {
  const masteries = await ctx
    .Summoner
    .findAll({
      where: {
        summonerId: id
      }
    });
  ctx.body = masteries.map(formatMastery);
});