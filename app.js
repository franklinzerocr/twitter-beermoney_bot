import config from 'config';
import { connection, getNewlyCreatedFloors, updateTweetFloor, getInitialFloor } from './db.mjs';
import { twitterClient, tweet } from './twitterAPI.mjs';
import { binanceAPI, tweetTopPrice } from './binanceAPI.mjs';

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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

    if (count >= 400000) {
      tweet = 'Published Tweets are only to carry verifiable historical documentation, they are not investment advice 🍺\nhttps://github.com/franklinzerocr/twitter-beermoney_bot';
      status = await twitter.tweets.statusesUpdate({ status: tweet });
      count = 0;
    }

    floor = await getNewlyCreatedFloors(dbConnection);

    if (floor.length) {
      floor = floor[0];

      tweetMessage = '';
      status = {};

      // ENTRY
      if (floor.Level == 0) {
        tweetMessage += '#TradingPlan' + floor.FK_Trading_Plan + ' START 🏁\n\n';
        tweetMessage += floor.Asset + ' / #BTC\n';
        tweetMessage += 'Entry Buy Price: ' + floor.Price + ' sats \n\n';
        tweetMessage += '#AlgoTrade';
        status = await tweet(twitter, tweetMessage);
        updateTweetFloor(dbConnection, floor.ID, status.id_str);

        //EXIT
      } else {
        // PROFIT
        let initialFloor = await getInitialFloor(dbConnection, floor.FK_Trading_Plan);
        let binance = await binanceAPI(config.binance);
        await tweetTopPrice(dbConnection, twitter, binance, floor, initialFloor, tweet, updateTweetFloor);
        // LOSS
      }
    }

    timerId = setTimeout(tick, 100);
  }, 0);
})();
