const _ = require('./route-collector');
const LeagueJS = require('leaguejs');
const config = require('../config');
const Sequelize = require('sequelize');
const ClientError = require('../ClientError');
const Op = Sequelize.Op;

const api = new LeagueJS(config.LEAGUE_API_KEY, {
  caching: {
    isEnabled: true,
    defaults: {
      stdTTL: 120
    }
  }
});

function formatSummoner(summoner, champions) {
  return {
    summonerId: summoner
      .id
      .toString(),
    name: summoner.name,
    level: summoner.summonerLevel,
    profileIconId: summoner.profileIconId,
    championMasteries: summoner
      .ChampionMasteries
      .map((m) => ({
        mastery: formatMastery(m),
        statistics: m.statistics,
        champion: champions.find((c) => c.id === m.championId)
      }))
  };
}

function formatChampion(champion) {
  return {
    name: champion.name,
    key: champion.key,
    id: champion.id
  };
}

function formatMastery(mastery) {
  return {
    summonerId: mastery.summonerId,
    championId: mastery.championId,
    championPoints: mastery.championPoints,
    championLevel: mastery.championLevel
  };
}

_.get('/summoners', async(ctx, next) => {
  const summoners = await ctx
    .Summoner
    .findAll();
  ctx.body = summoners.map(formatSummoner);
});

_.get('/summoners/:page_id', async(ctx, page, next) => {
  let pageNum = parseInt(page);
  if (Number.isInteger(pageNum) && pageNum > 0) {
    let summoners = await ctx
      .Summoner
      .findAll({
        where: {
          summonerLevel: {
            [Op.ne]: null
          }
        },
        limit: 10,
        offset: (pageNum - 1) * 10,
        order: [
          ['summonerLevel', 'DESC NULLS LAST'],
          [ctx.ChampionMastery, 'championPoints', 'DESC']
        ],
        include: [{
          model: ctx.ChampionMastery
        }]
      });
      if(summoners.length === 0) {
        throw new ClientError(404, "No more summoners available.");
      }
    ctx.body = summoners.map((summoner) => formatSummoner(summoner, ctx.champions));
  }
});

//Returns 20 game IDs
async function updateRecentGames(models, summoner) {
  //get 20 games from api
  let recents = [];
  try {
    recents = await api
      .Match
      .gettingListByAccount(summoner.accountId, {
        endIndex: 20
      });
  } catch (err) {
    throw new ClientError(404, "No recent matches for this summoner");
  }
  //get db games that match
  const cachedMatches = await models
    .Match
    .getByIds(recents.matches.map(m => m.gameId));
  //filter items already in db from recent array
  const newRecents = recents
    .matches
    .filter(m => cachedMatches.every(m2 => m2.id != m.gameId));
  //if there are new recent matches (not in db)
  if (newRecents.length > 0) {
    //add those matches to the database
    const createdMatches = await models
      .Match
      .bulkCreate(newRecents.map(m => ({
        id: m.gameId,
        timestamp: m.timestamp,
        season: m.season,
        queue: m.queue
      })));
    //retrieve detailed match view
    const matches = await Promise.all(newRecents.map(recent => api.Match.gettingById(recent.gameId)));
    const summonersMap = new Map();
    let newSummoners = [];
    //get participants from each match, add to map and array
    matches.forEach(m => {
      const matchParticipants = m
        .participants
        .map(p => {
          let identity = m
            .participantIdentities
            .find(summ => summ.participantId === p.participantId)
            .player;
          return {
            id: identity.summonerId,
            accountId: identity.accountId,
            name: identity.summonerName,
            profileIconId: identity.profileIcon,
            participantId: p.participantId
          };
        });
      newSummoners = [
        ...newSummoners,
        ...matchParticipants
      ];
      summonersMap.set(m.gameId, new Map(matchParticipants.map(p => [p.participantId, p])));
    });
    //find summoners that are already cached
    let cachedSummoners = await models
      .Summoner
      .findAll({
        where: {
          id: {
            [Op.or]: newSummoners.map(s => s.id)
          }
        }
      });
    let filteredSummoners = [];
    let sortedSummoners = newSummoners
      .filter(s => cachedSummoners.every(s2 => s2.id != s.id))
      .sort((s1, s2) => s2.id - s1.id);
    let duplicate = false;
    for (var i = 0; i < sortedSummoners.length; i++) {
      for (var k = i + 1; k < sortedSummoners.length; k++) {
        if (sortedSummoners[i].id === sortedSummoners[k].id) {
          duplicate = true;
          break;
        }
      }
      if (!duplicate && sortedSummoners[i].id !== undefined) {

        filteredSummoners.push(sortedSummoners[i]);
      }
      duplicate = false;
    }
    const insertedSummoners = await models
      .Summoner
      .bulkCreate(filteredSummoners);

    const createdGames = await models
      .SummonerMatch
      .bulkCreate([].concat(...matches.map(m => m.participants.map(p => {
        let s = summonersMap
          .get(m.gameId)
          .get(p.participantId);
        return {
          gameId: m.gameId,
          championId: p.championId,
          summonerId: s.id,
          kills: p.stats.kills,
          deaths: p.stats.deaths,
          assists: p.stats.assists,
          wardsPlaced: p.stats.wardsPlaced,
          goldEarned: p.stats.goldEarned,
          win: p.stats.win,
          role: p.timeline.role
        }
      }))));
  }
  return await models
    .SummonerMatch
    .findAll({
      where: {
        summonerId: summoner.id
      },
      limit: 20,
      order: [
        ['createdAt', 'DESC']
      ]
    });
}

//Returns top 4 champion masteries
async function updateTopMasteries(ChampionMastery, summoner) {
  try {
    const masteries = await api
      .ChampionMastery
      .gettingBySummoner(summoner.id);
    const deletedMasteries = await ChampionMastery.destroy({
      where: {
        summonerId: summoner.id
      }
    });
    const insertedMasteries = await ChampionMastery.bulkCreate(masteries.slice(0, 4).map((m) => ({
      summonerId: m.playerId,
      championId: m.championId,
      championPoints: m.championPoints,
      championPointsUntilNextLevel: m.championPointsUntilNextLevel,
      championLevel: m.championLevel
    })));
    return insertedMasteries;
  } catch (err) {
    throw new ClientError(404, "This summoner has no champion masteries");
  }
}

async function updateSummoner(models, summoner) {
  const games = await updateRecentGames(models, summoner);
  const masteries = await updateTopMasteries(models.ChampionMastery, summoner);
}

function getStatisticsFromMatches(matches, championMasteries) {
  // all statistics are averages over all games let kills, deaths, assists,
  for (var h = 0; h < championMasteries.length; h++) {
    currStats = {
      kills: 0,
      deaths: 0,
      kda: 0,
      assists: 0,
      wins: 0,
      wardsPlaced: 0,
      goldEarned: 0,
      numGames: 0
    };

    for (var i = 0; i < matches.length; i++) {
      if (championMasteries[h].championId === matches[i].championId) {
        currStats.numGames += 1;
        currStats.kills += matches[i].kills;
        currStats.deaths += matches[i].deaths;
        currStats.assists += matches[i].assists;
        currStats.kda += (matches[i].kills + matches[i].assists) / (matches[i].deaths > 0 ?
          matches[i].deaths :
          1);
        currStats.wins += matches[i].win ?
          1 :
          0;
        currStats.wardsPlaced += matches[i].wardsPlaced;
        currStats.goldEarned += matches[i].goldEarned;
      }
    }
    championMasteries[h].statistics = currStats;
  }

  return championMasteries;
}

function normalizeName(name) {
  return name.replace(' ', '').toLowerCase().trim();  
}

_.post('/summoners/:name', async(ctx, name, next) => {
  const normalizedName = normalizeName(name);
  let summoner = await ctx
    .Summoner
    .findOne({
      where: Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), normalizedName),
      include: [{
        model: ctx.ChampionMastery
      }],
      order: [
        [ctx.ChampionMastery, 'championPoints', 'DESC']
      ]
    });

  //If summoner doesn't exist, get and add to db
  if (!summoner || summoner.revisionDate === null) {
    console.log(`Summoner ${normalizedName} not found, retrieving from API`);
    try {
      const s = await api
        .Summoner
        .gettingByName(normalizedName);
      if (s) {
        created = await ctx
          .Summoner
          .upsert({
            name: s
              .name
              .trim(),
            summonerLevel: s.summonerLevel,
            id: s.id,
            accountId: s.accountId,
            profileIconId: s.profileIconId,
            revisionDate: s.revisionDate
          });
        summoner = s;

        summoner.ChampionMasteries = await updateTopMasteries(ctx.ChampionMastery, summoner);
      } else {
        throw new ClientError(404, "Summoner not found");
      }
    } catch (err) {
      throw new ClientError(404, "Error retrieving summoner");
    }
  } else if (Date.now() - summoner.revisionDate > (1000 * 60 * 60 * 24)) {
    console.log("Updating users data");
    summoner.ChampionMasteries = await updateTopMasteries(ctx.ChampionMastery, summoner);
  }

  summoner.matches = await updateRecentGames({
    Match: ctx.Match,
    SummonerMatch: ctx.SummonerMatch,
    Summoner: ctx.Summoner
  }, summoner);

  summoner.ChampionMasteries = getStatisticsFromMatches(summoner.matches, summoner.ChampionMasteries);
  ctx.body = formatSummoner(summoner, ctx.champions);
});

module.exports = _.routes();