import { TwitterClient } from 'twitter-api-client';

export function twitterClient(keys) {
  return new TwitterClient({
    apiKey: keys.apiKey,
    apiSecret: keys.apiSecret,
    accessToken: keys.accessToken,
    accessTokenSecret: keys.accessTokenSecret,
  });
}
