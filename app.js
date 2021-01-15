import config from 'config';
import { connection } from './db.mjs';
import { twitterClient } from './api.mjs';

const twitter = twitterClient(config.keys);
let data = [];

// console.log('Tweet');
// data = await twitterClient.tweets.statusesUpdate({ status: 'Respondiendo al Hola Mundo desde el API', in_reply_to_status_id: '1349951366161199104' });

console.log('Timeline');
data = await twitter.tweets.statusesUserTimeline({ screen_name: 'Beermoney_Bot' });

// console.log('Get By ID');
// data = await twitterClient.tweets.statusesShowById({ id: '1349951366161199104' });

for (let tweet of data) {
  console.log('get tweet!!!');
  console.log(tweet.text);
}
