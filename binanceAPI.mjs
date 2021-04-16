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

export async function tweetTopPrice(dbConnection, twitter, binanceAPI, floor, initialFloor, tweet, updateTweetFloor) {
  let init = +new Date(initialFloor.DateTime) - 60000;
  await binanceAPI.candlesticks(
    floor.Asset + 'BTC',
    '1m',
    async function (error, ticks, symbol) {
      if (error) console.log('error', error.body);
      let highestPrice = 0;
      for (let tick of ticks) {
        let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = tick;
        highestPrice = highestPrice < high ? high : highestPrice;
      }

      highestPrice = (highestPrice * 100000000).toFixed(0);

      let profit = ((highestPrice * 100) / initialFloor.Price - 100).toFixed(2);

      let tweetMessage = floor.Asset + ' / #BTC\n';
      tweetMessage += 'Top Price: ' + highestPrice + '\n';
      tweetMessage += 'Profit so far: ' + profit + '% 😎🍺\n\n';
      tweetMessage += '#AlgoTrade';

      floor = await getFloor(dbConnection, floor);
      if (floor.TweetID == null) {
        let status = await tweet(twitter, tweetMessage, initialFloor.TweetID);
        updateTweetFloor(dbConnection, floor.ID, status.id_str);
      }
    },
    { startTime: init, endTime: +new Date() }
  );
}
