const LeagueJS = require('leaguejs');
const db = require('../models');
const config = require('../config');
const api = new LeagueJS(config.LEAGUE_API_KEY);

console.log('Initializing Database');

async function syncModels() {
  // If not in production, script should clear db
  await db.sync({
    force: config.ENV !== 'production'
  });
}

function formatChampion(champion) {
  return {id: champion.id, name: champion.name, key: champion.key, title: champion.title};
}

async function initChampions() {
  const Champion = db.models.Champion;
  const res = await api
    .StaticData
    .gettingChampions({dataById: true})
  const champions = Object
    .keys(res.data)
    .map(championName => formatChampion(res.data[championName]));
  await Champion.bulkCreate(champions);
}

syncModels().then(() => console.log('Models synchronized'))
  .then(initChampions)
  .then(() => console.log('Champions database populated'))
  .then(() => console.log('Database initialized'))
  .then(process.exit)
  .catch(console.error);