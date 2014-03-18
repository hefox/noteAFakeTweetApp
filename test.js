
test("Test fetching and voting.", function() {
  var tweeters = new Tweeter();

  var currentTweets = localStorage.tweets ? JSON.parse(localStorage.tweets) : [];
  var tweets = tweeters.fetch(0, false);
  ok(tweets.length == 20, 'Twenty tweets fetched');
  for (var key in tweets) {
    // Date should be within 8 days and today.
    // 8 days to vuffer for time between making creation and now.
    var maxDate = new Date();
    var minDate = new Date(maxDate.getTime() - (86400000 * 8));
    ok(tweets[key].userId >= 1 && tweets[key].userId <= 128, 'User ID within valid range. ' + tweets[key].userId);
    var date = new Date(tweets[key].date);
    ok(date.getTime() > 0 && date.getTime() >= minDate.getTime() && date.getTime() <= maxDate.getTime(), 'Date is a valid date ' + date);
    ok(tweets[key].tweet.length >= 1 && tweets[key].tweet.length <= 150, 'Tweet is a good length: ' + tweets[key].tweet);
  }
  function testTweetsTheSame(tweets1, tweets2, noErrorIfEmpty) {
    if (tweets1 && tweets2) {
      for (i in tweets1) {
        ok(tweets1[i].date == tweets2[i].date && tweets1[i].tweet == tweets2[i].tweet, 'Tweets are the same.');
      }
    }
    else if (!noErrorIfEmpty) {
      ok(false, 'tested tweets for same but empty tweets returned');
    }
  }
  // Verify fetch returns the same tweets.
  // This tests tweets from local storage from previous page load if they exist.
  testTweetsTheSame(currentTweets.slice(0, 20), tweets, true);  // Tests that recalling fetch returns the same tweets.
  testTweetsTheSame(tweets, tweeters.fetch(0, false));
  var newTweets = tweeters.fetch(20, false);
  var currentTweets = localStorage.tweets ? JSON.parse(localStorage.tweets) : [];
  testTweetsTheSame(currentTweets.slice(20, 40), newTweets);

  // Delete local storage and regnerate tweets.
  delete localStorage.tweets;
  var tweets = tweeters.fetch(0, false);
  var currentTweets = localStorage.tweets ? JSON.parse(localStorage.tweets) : [];
  ok(currentTweets.length == 20, '20 tweets generated.');
  testTweetsTheSame(tweets, tweeters.fetch(0, false));
  var newTweets = tweeters.fetch(20, false);
  var currentTweets = localStorage.tweets ? JSON.parse(localStorage.tweets) : [];
  ok(currentTweets.length == 40, '40 tweets generated.');
  testTweetsTheSame(currentTweets.slice(20, 40), newTweets);

  // Vote for 2 and 3 and test returned in right place.
  tweeters.registerVote(2);
  tweeters.registerVote(2);
  tweeters.registerVote(2);
  tweeters.registerVote(3);
  tweeters.registerVote(3);
  tweeters.registerVote(30);
  var currentTweets = localStorage.tweets ? JSON.parse(localStorage.tweets) : [];
  ok(currentTweets[0].uid == 2, 'Highest voted returned first');
  ok(currentTweets[1].uid == 3, 'Second voted returned second');
  ok(currentTweets[2].uid == 30, 'Third voted returned third');

  
});


test("Test Sanatization.", function() {
  var tweeters = new Tweeter();
  ok('Test test string script' == tweeters.sanitize('Test <script>test</script> string script'), 'Script removed.');
  ok('Test  string script' == tweeters.sanitize('Test <script></script> string script'), 'Script removed again.');
  ok('Test <a href="">string</a> script' == tweeters.sanitize('Test <a href="">string</a> script'), 'Link preserved');
  ok('Test <a href="http://google.com">string</a> script' == tweeters.sanitize('Test <a href="http://google.com">string</a> script'), 'Link preserved');
  ok('Test <a href="http://google.com">string</a> script' == tweeters.sanitize('Test <a href="http://google.com" class="blank">string</a> script'), 'Link preserved');
  ok('Test <a href="http://google.com">string</a> script' == tweeters.sanitize('Test <p><a href="http://google.com" class="blank">string</a> script</p>'), 'Link preserved');
  ok('Test <strong>string</strong> ' == tweeters.sanitize('Test <strong>string</strong> '), 'Strong preserved.');
  ok('Test string script' == tweeters.sanitize('Test <a href="javascript:blank">string</a> script'), 'Link removed with javascript.');

});
