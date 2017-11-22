//properties.js
/** Facebook */
exports.facebook_token = process.env.TOKEN_VALUE;
exports.facebook_challenge = process.env.FB_CHALLENGE_VALUE;
exports.facebook_message_endpoint = 'https://graph.facebook.com/v2.6/me/messages';

/** News */
exports.google_news_endpoint = "https://news.google.com/news?output=rss";