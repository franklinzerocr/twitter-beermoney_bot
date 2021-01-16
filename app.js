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
  let count = 0;
  let horas = 0;

  let tweet = '';
  let status = {};

  while (1 == 1) {
    count++;
    if (count % 3600 == 0) console.log(horas + count / 3600, ' horas');

    if (count >= 21600) {
      tweet = 'Los Tweets publicados son para llevar documentación, no son una asesoría de inversión 🍺.\n\n*Las operaciones mostradas tienen 30min de retraso, como se puede observar en el github de este BOT\nhttps://github.com/franklinzerocr/twitter-beermoney_bot';
      status = await twitter.tweets.statusesUpdate({ status: tweet });
      horas += 6;
      count = 0;
    }

    floor = await getNewlyCreatedFloors(dbConnection);
    if (floor.length) {
      floor = floor[0];

      tweet = '';
      status = {};

      // ENTRADA
      if (floor.Level == 0) {
        tweet += 'Par: $' + floor.Asset + ' / #BTC\n';
        tweet += 'Precio de Entrada: ' + floor.Price + ' sats 🍺\n\n';
        tweet += '#AlgorithmicTrading #TradingPlan' + floor.FK_Trading_Plan + '\n\n';
        tweet += 'https://www.binance.com/es/trade/' + floor.Asset + '_BTC';
        status = await twitter.tweets.statusesUpdate({ status: tweet });
        //SALIDA
      } else {
        tweet += 'Par: $' + floor.Asset + ' / #BTC\n';
        tweet += 'Precio de Salida: ' + floor.Price + ' sats\n';

        if (floor.Profit > 0) {
          tweet += 'Ganancia: ' + floor.Profit + '% ';
          tweet += '😎🍻\n\n';
          tweet += '#AlgorithmicTrading #TradingPlan' + floor.FK_Trading_Plan + '\n\n';
          tweet += 'https://www.binance.com/es/trade/' + floor.Asset + '_BTC';
        } else {
          tweet += 'Perdida: ' + floor.Profit + '% ';
          tweet += '😥\n\n';
          tweet += '#AlgorithmicTrading #TradingPlan' + floor.FK_Trading_Plan + '\n\n';
          tweet += 'https://www.binance.com/es/trade/' + floor.Asset + '_BTC';
        }

        let initialFloor = await getInitialFloor(dbConnection, floor.FK_Trading_Plan);
        status = await twitter.tweets.statusesUpdate({ status: tweet, in_reply_to_status_id: initialFloor.TweetID });
      }

      updateTweetFloor(dbConnection, floor.ID, status.id_str);
    }
    await sleep(1000);
  }

  // console.log('Timeline');
  // let data = await twitter.tweets.statusesUserTimeline({ screen_name: 'Beermoney_Bot' });

  // console.log('Get By ID');
  // let data = await twitter.tweets.statusesShowById({ id: '1349951366161199104' });

  // let tweet = 'hola';
  // let status = await twitter.tweets.statusesUpdate({ status: tweet, in_reply_to_status_id: '1349951366161199104' });

  // console.log(status);

  // for (let tweet of data) {
  //   console.log(tweet.text);
  //   console.log(tweet.id_str);
  //   console.log('----');
  // }
})();
