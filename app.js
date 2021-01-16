import config from 'config';
import { connection, getNewlyCreatedFloors, updateTweetFloor, getInitialFloor } from './db.mjs';
import { twitterClient } from './api.mjs';

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

(async function () {
  const twitter = twitterClient(config.keys);
  let dbConnection = await connection(config.DB);
  let floor = [];

  while (1 == 1) {
    floor = await getNewlyCreatedFloors(dbConnection);
    if (floor.length) {
      floor = floor[0];

      let tweet = '';
      let status = {};

      // ENTRADA
      if (floor.Level == 0) {
        tweet += 'Par: $' + floor.Asset + ' / #BTC\n';
        tweet += 'Precio de Entrada: ' + floor.Price + ' sats\n\n';
        tweet += '#AlgorithmicTrading #TradingPlan' + floor.FK_Trading_Plan + ' 🍺';
        status = await twitter.tweets.statusesUpdate({ status: tweet });
        //SALIDA
      } else {
        tweet += 'Par: $' + floor.Asset + ' / #BTC\n';
        tweet += 'Precio de Salida: ' + floor.Price + ' sats\n';

        if (floor.Profit > 0) {
          tweet += 'Ganancia: ' + floor.Profit + '%\n\n';
          tweet += '#AlgorithmicTrading #TradingPlan' + floor.FK_Trading_Plan;
          tweet += '😎🍻\n\n';
          tweet += 'https://www.binance.com/es/trade/' + floor.Asset + '_BTC';
        } else {
          tweet += 'Perdida: ' + floor.Profit + '%\n\n';
          tweet += '#AlgorithmicTrading #TradingPlan' + floor.FK_Trading_Plan;
          tweet += '😥\n\n';
          tweet += 'https://www.binance.com/es/trade/' + floor.Asset + '_BTC';
        }

        let initialFloor = await getInitialFloor(dbConnection, floor.FK_Trading_Plan);
        status = await twitter.tweets.statusesUpdate({ status: tweet, in_reply_to_status_id: initialFloor.TweetID });
      }

      updateTweetFloor(dbConnection, floor.ID, status.id_str);
    }
    await sleep(1000);
  }
})();
