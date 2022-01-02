import Binance from 'node-binance-api';
import { getFloor } from './db.mjs';

export async function binanceAPI(config) {
  return await new Binance().options({
    APIKEY: config.public,
    APISECRET: config.secret,
    useServerTime: true,
    reconnect: true,
    // verbose: true,
    recvWindow: 10000, // Set a higher recvWindow to increase response timeout
  });
}

export async function tweetTopPrice(dbConnection, twitter, binanceAPI, floor, initialFloor, replyToID, tweet, updateTweetFloor) {
  let init = +new Date(initialFloor.DateTime) - 60000;
  let timeFrame = '1h';
  await binanceAPI.candlesticks(
    floor.Asset + floor.Pair,
    timeFrame,
    async function (error, ticks, symbol) {
      if (error) console.log('error', error.body);
      let highestPrice = 0;
      for (let tick of ticks) {
        let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = tick;
        highestPrice = highestPrice < high ? high : highestPrice;
      }

      let auxHighestPrice = floor.Pair == 'BTC' ? (highestPrice * 100000000).toFixed(0) : highestPrice;

      let profit = ((auxHighestPrice * 100) / initialFloor.Price - 100).toFixed(2);

      let message = '#TradingPlan' + floor.FK_Trading_Plan + '\n';
      message += floor.Asset + ' / #' + floor.Pair + '\n';
      message += 'Top Price so far: ' + highestPrice + '\n';
      message += 'Highest Profit so far: ' + profit + '% 😎🍺\n\n';
      message += '#AlgoTrade';

      floor = await getFloor(dbConnection, floor);
      if (floor.TweetID == null) {
        let status = await tweet(twitter, message, replyToID);
        updateTweetFloor(dbConnection, floor.ID, status.id_str);
      }
    },
    { limit: 500, startTime: init, endTime: +new Date() }
  );
}
