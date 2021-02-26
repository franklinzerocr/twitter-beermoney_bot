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

  let tweet = '';
  let status = {};

  let timerId = setTimeout(async function tick() {
    count++;

    // Cada 40 horas tuiteo disclaimer
    if (count >= 144444) {
      tweet = 'Los Tweets publicados son para llevar documentación histórica comprobable, no son una asesoría de inversión 🍺\nhttps://github.com/franklinzerocr/twitter-beermoney_bot';
      status = await twitter.tweets.statusesUpdate({ status: tweet });
      count = 0;
    }

    floor = await getNewlyCreatedFloors(dbConnection);

    if (floor.length) {
      floor = floor[0];

      tweet = '';
      status = {};

      // ENTRY
      if (floor.Level == 0) {
        tweet += '#TradingPlan' + floor.FK_Trading_Plan + ' START 🏁\n\n';
        tweet += floor.Asset + ' / #BTC\n';
        tweet += 'Entry Buy Price: ' + floor.Price + ' sats \n\n';
        tweet += '#AlgoTrade\nhttps://www.binance.com/en/trade/' + floor.Asset + '_BTC';
        status = await twitter.tweets.statusesUpdate({ status: tweet });
        //EXIT
      } else {
        // PROFIT
        if (floor.Profit > 0) {
          tweet += '#TradingPlan' + floor.FK_Trading_Plan + ' END\n\n';
          tweet += floor.Asset + ' / #BTC\n';
          tweet += 'Exit Sell Price: ' + floor.Price + ' sats\n';
          tweet += 'Profit: ' + floor.Profit + '% 😎🍺\n\n';
          tweet += '#AlgoTrade\nhttps://www.binance.com/en/trade/' + floor.Asset + '_BTC';
          // LOSS
        } else {
          tweet += '#TradingPlan' + floor.FK_Trading_Plan + ' END\n\n';
          tweet += floor.Asset + ' / #BTC\n';
          tweet += 'Exit Sell Price: ' + floor.Price + ' sats\n';
          tweet += 'Loss: ' + floor.Profit + '% 😢💸\n\n';
          tweet += '#AlgoTrade\nhttps://www.binance.com/en/trade/' + floor.Asset + '_BTC';
        }

        let initialFloor = await getInitialFloor(dbConnection, floor.FK_Trading_Plan);
        status = await twitter.tweets.statusesUpdate({ status: tweet, in_reply_to_status_id: initialFloor.TweetID });
      }

      updateTweetFloor(dbConnection, floor.ID, status.id_str);
    }

    timerId = setTimeout(tick, 1000);
  }, 0);
})();
