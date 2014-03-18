/**
 * This file partially overrides XMLHttpRequest to pretend weare doing real
 * ajax calls.
 */

XMLHttpRequest.prototype.realOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.realSend= XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.mockTweetApi = '';

XMLHttpRequest.prototype.open = function(method, url, async) {
  // Prase url, front https://gist.github.com/jlong/2428561
  var parser = document.createElement('a');
  parser.href = url;
  if (parser.pathname.indexOf('/tweets') !== 0) {
    return this.realOpen(method, url, async);
  }
  else {
    this.mockTweetApi = parser;
    this.fakeAsync = async;
  }
}
XMLHttpRequest.prototype.send = function(data) {
  if (!this.mockTweetApi) {
    return this.realSend(data);
  }
  else {
    // Function to send to sort to sort by votes/date.
    var sortByVoteDate = function (a, b) {
      if ('vote' in a && 'vote' in b) {
        if (a.vote > b.vote) return -1;
        else if (b.vote > a.vote) return 1;
      }
      var aDate = new Date(a.date);
      var bDate = new Date(b.date);
      if (aDate > bDate) return -1;
      else if (bDate > aDate) return 1;
      return 0;
    }
    // See if any paramters to the query were added.
    // currently only offset is used.
    var params = {};
    if (this.mockTweetApi.search) {
      var paramsStrings = this.mockTweetApi.search.substr(1).split('&');
      for (i in paramsStrings) {
        var subparamString = paramsStrings[i].split('=');
        if (subparamString[0] !== null && subparamString[1] !== null) {
          params['param_' + subparamString[0]] = subparamString[1];
        }
      }
    }
    // Person is voting, "record" the vote.
    if (this.mockTweetApi.pathname.indexOf('/tweets/vote') === 0) {
      var tweets = localStorage.tweets ? JSON.parse(localStorage.tweets) : [];
      if (!('param_vote' in params)) {
        throw 'Must have an id to vote against.';
      }
      for (var id in tweets) {
        if (tweets[id].uid == params['param_vote']) {
          tweets[id].vote = tweets[id].vote ? tweets[id].vote + 1 : 1;
          tweets.sort(sortByVoteDate);
          localStorage.tweets = JSON.stringify(tweets);
          return;
        }
      }
      throw 'Invalid id given to vote.';
    }
    // This is a get/default, fetch paramaters.
    var offset = ('param_offset' in params) && parseInt(params['param_offset']) ? parseInt(params['param_offset']) : 0;

    // local storage tracks created tweets so they persist page loads.
    var tweets = localStorage.tweets ? JSON.parse(localStorage.tweets) : [];
    // Create new tweets if none exist for this page.
    if (!tweets || tweets.length < offset + 20) {
      var date = new Date();
      var today = date.getTime();
      // Generate enough tweets to satisfy the offset.
      for (var i = offset; tweets.length < offset + 20; i++) {
        // Make a fake date within the last week.
        var newDate = new Date(today - (Math.random() * 86400000 * 7));
        tweets.push({
          'tweet': tweeterFakeTweet(),
          'date': newDate.toJSON(),
          'userId': Math.floor((Math.random()*128)) + 1, // Random uid between 1 and 128.
          'uid': i,
          'vote': 0,
        });
      }
      tweets.sort(sortByVoteDate);
      localStorage.tweets = JSON.stringify(tweets);
    }
    // This would have been responseTxt with JSON.stringify but responseText is
    // readonly and cannot be touched, so we just add responseJson instead.
    this.responseJson = tweets = tweets.slice(offset, offset + 20);
    if (this.onload) {
      this.onload();
    }
  }
}

function tweeterFakeTweet() {
  // Make a tweet between two and 150 characters.
  var length = Math.random() * 140 + 10;
  var words = [
    'a',
    'the',
    'flag',
    'cat',
    'dog',
    'tweet',
    'test',
    'twitter',
    'xml',
    'bug',
    'buggy',
    'fix',
    'sleep',
    'wat',
    'huh',
    'Elephants',
    'Great!',
    'okay',
    'Yes',
  ];
  var word = '';
  while (word.length <= length) {
    var newWord = words[Math.floor(Math.random() * words.length)];
    // Exit out of this makes the string too long.
    if (word.length > 0 && word.length + newWord.length + 1 > length) {
      break;
    }
    word += (word ? ' ' : '') + newWord;
  }
  return word; 
}
