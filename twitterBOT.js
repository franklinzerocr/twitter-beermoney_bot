import config from 'config';
import { connection, getNewlyCreatedFloors, updateTweetFloor, getInitialFloor } from './db.mjs';
import { twitterClient, tweet } from './twitterAPI.mjs';
import { binanceAPI, tweetTopPrice } from './binanceAPI.mjs';

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

Number.prototype.noExponents = function () {
  var data = String(this).split(/[eE]/);
  if (data.length == 1) return data[0];

  var z = '',
    sign = this < 0 ? '-' : '',
    str = data[0].replace('.', ''),
    mag = Number(data[1]) + 1;

  if (mag < 0) {
    z = sign + '0.';
    while (mag++) z += '0';
    return z + str.replace(/^\-/, '');
  }
  mag -= str.length;
  while (mag--) z += '0';
  return str + z;
};

function satoshiToBTC(satoshi) {
  satoshi = satoshi / 100000000;
  satoshi = Number(satoshi.toFixed(8));
  satoshi = satoshi.noExponents();
  return satoshi;
}

(async function () {
  const twitter = twitterClient(config.keys);
  let dbConnection = await connection(config.DB);

  let floor = [];
  let count = 0;

  let tweetMessage = '';
  let status = {};
  console.log('Start Twitter Beermoney BOT!');
  console.log(new Date());

  let timerId = setTimeout(async function tick() {
    count++;

    if (count >= 333333) {
      // tweetMessage = '🍺 #AlgorithmicTrading \nhttps://beermoneybot.io';
      // status = await tweet(twitter, tweetMessage);
      process.exit();
    }

    floor = await getNewlyCreatedFloors(dbConnection);

    if (floor.length) {
      floor = floor[0];

      tweetMessage = '';
      status = {};

      floor.Price = floor.Pair == 'BTC' ? satoshiToBTC(floor.Price) : floor.Price;

      // ENTRY
      if (floor.Level == 0) {
        tweetMessage += '#TradingPlan' + floor.FK_Trading_Plan + ' START 🏁\n\n';
        tweetMessage += floor.Asset + ' / #' + floor.Pair + '\n';
        tweetMessage += 'Entry Buy Price: ' + floor.Price + '\n\n';
        tweetMessage += '#AlgoTrade';
        status = await tweet(twitter, tweetMessage);
        updateTweetFloor(dbConnection, floor.ID, status.id_str, 1);

        //EXIT
      } else if (floor.Level == -4 || floor.Level == -5) {
        let initialFloor = await getInitialFloor(dbConnection, floor.FK_Trading_Plan);

        let profitlosss = 'Profit: ' + floor.Profit + '% 😎🍺';
        if (floor.Profit < 0) {
          profitlosss = 'Loss: ' + floor.Profit + '% 😢💸';
        }

        // PROFIT/LOSS Message
        tweetMessage += '#TradingPlan' + floor.FK_Trading_Plan + ' END\n\n';
        tweetMessage += floor.Asset + ' / #' + floor.Pair + '\n';
        tweetMessage += 'Exit Sell Price: ' + floor.Price + ' \n';
        tweetMessage += profitlosss;

        if (floor.TweetID == null) status = await twitter.tweets.statusesUpdate({ status: tweetMessage, in_reply_to_status_id: initialFloor.TweetID });

        let binance = await binanceAPI(config.binance);
        await tweetTopPrice(dbConnection, twitter, binance, floor, initialFloor, status.id_str, tweet, updateTweetFloor);
        //EXIT
      }
    }

    timerId = setTimeout(tick, 1000);
  }, 0);
})();
