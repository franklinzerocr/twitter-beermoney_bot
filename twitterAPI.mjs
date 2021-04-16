import { TwitterClient } from 'twitter-api-client';

export function twitterClient(keys) {
  return new TwitterClient({
    apiKey: keys.apiKey,
    apiSecret: keys.apiSecret,
    accessToken: keys.accessToken,
    accessTokenSecret: keys.accessTokenSecret,
  });
}

export async function tweet(twitter, message, TweetID = null) {
  return TweetID == null ? await twitter.tweets.statusesUpdate({ status: message }) : await twitter.tweets.statusesUpdate({ status: message, in_reply_to_status_id: TweetID });
}
