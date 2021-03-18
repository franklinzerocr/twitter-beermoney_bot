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
  console.log('Start Twitter Beermoney BOT!');

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

      tweet = '';
      status = {};

      // ENTRY
      if (floor.Level == 0) {
        tweet += '#TradingPlan' + floor.FK_Trading_Plan + ' START 🏁\n\n';
        tweet += floor.Asset + ' / #BTC\n';
        tweet += 'Entry Buy Price: ' + floor.Price + ' sats \n\n';
        tweet += '#AlgoTrade';
        status = await twitter.tweets.statusesUpdate({ status: tweet });
        //EXIT
      } else {
        // PROFIT
        if (floor.Profit > 0) {
          tweet += '#TradingPlan' + floor.FK_Trading_Plan + ' END\n\n';
          tweet += floor.Asset + ' / #BTC\n';
          tweet += 'Exit Sell Price: ' + floor.Price + ' sats\n';
          tweet += 'Profit: ' + floor.Profit + '% 😎🍺\n\n';
          tweet += '#AlgoTrade';
          // LOSS
        } else {
          tweet += '#TradingPlan' + floor.FK_Trading_Plan + ' END\n\n';
          tweet += floor.Asset + ' / #BTC\n';
          tweet += 'Exit Sell Price: ' + floor.Price + ' sats\n';
          tweet += 'Loss: ' + floor.Profit + '% 😢💸\n\n';
          tweet += '#AlgoTrade';
        }

        let initialFloor = await getInitialFloor(dbConnection, floor.FK_Trading_Plan);
        status = await twitter.tweets.statusesUpdate({ status: tweet, in_reply_to_status_id: initialFloor.TweetID });
      }

      updateTweetFloor(dbConnection, floor.ID, status.id_str);
    }

    timerId = setTimeout(tick, 1000);
  }, 0);
})();
