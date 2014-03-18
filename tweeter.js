
/**
 * Fetches and effects tweets
 */
var Tweeter = function () {}

/**
 * Fetch some tweets!
 *
 * @param offset
 *   Where to start fetching tweets from (for paging).
 * @param async
 *   Whether to fetch asynronsisly or not.
 *
 * @return
 *   If asyncronsis, nothing. If syncronsis, the new tweets.
 */
Tweeter.prototype.fetch = function(offset, async, onTweetLoad) {
  var tweeterObject = this;
  var xmlhttp = new XMLHttpRequest();
  // @todo use onload.
  if (onTweetLoad) {
    xmlhttp.onload = function() {
      onTweetLoad(tweeterObject, xmlhttp.responseJson);
    }
  }
  var url = '/tweets/gets';
  if (offset > 0) {
    url += '?offset=' + offset;
  }
  xmlhttp.open('GET', url, async);
  var tweets = xmlhttp.send();
  if (!async) {
    return xmlhttp.responseJson;
  }
}


/**
 * Renders the tweets.
 *
 * @param id
 *   ID of the div to render to.
 */
Tweeter.prototype.registerVote = function(tweetId) {
  var xmlhttp = new XMLHttpRequest();
  var url = '/tweets/vote';
  // @todo This should use post instead.
  url += '?vote=' + tweetId;
  xmlhttp.open('GET', url);
  xmlhttp.send();
  tweetId = 'tweet-' + tweetId;
  this.votesCache = this.votesCache || {};
  this.votesCache[tweetId] = tweetId in this.votesCache ? this.votesCache[tweetId] + 1 : 1;

  // We find the sibling that has the vote that is closets, but higher than current vote.

  // Not rendering for tests, so skip updating markup  in this case.
  if (!this.divId) {
    return;
  }
  var div = document.getElementById(this.divId);
  var tweetElement = document.getElementById(tweetId);
  // Traverse intil finding the place.
  var previous = tweetElement
  var moveAfter, sameVote;
  // Keep going up till find an element with a higher vote.
  while (previous = previous.previousSibling) {
    var prevID = previous.getAttribute('id');
    if (prevID in this.votesCache) {
      if (this.votesCache[prevID] > this.votesCache[tweetId]) {
        moveAfter = previous;
        break;
      }
      // Track the highest one with same vote in case no higher.
      else if (this.votesCache[prevID] == this.votesCache[tweetId]) {
        sameVote = previous;
      }
    }
  }
  // Element with higher vote, insert after.
  if (moveAfter) {
    div.insertBefore(tweetElement, moveAfter.nextSibling);
  }
  // Element with highest same vote, insert before.
  else if (sameVote) {
    div.insertBefore(tweetElement, sameVote);
  }
  // Highest voted, insert at top!
  else {
    div.insertBefore(tweetElement, div.firstChild);
  }
  document.querySelector("#" + tweetId + " .vote-counter").innerHTML = this.votesCache[tweetId];
}

/**
 * Sanatizes a string for output.
 *
 * @param string
 *   The string of html to make displayable.
 * @param allowedTags
 *   An array of tags to allow in input. Use an empty array for none.
 *   Defaults to a, strong, i, br.
 *
 * @return
 *   A sanatized string.
 */
Tweeter.prototype.sanitize = function(string, allowedTags) {
  if (!string) {
    return string;
  }
  allowedTags = allowedTags == undefined ? ['A', 'STRONG', 'I', 'BR'] : allowedTags;

  // Suggestion from http://stackoverflow.com/questions/11890664/how-can-i-strip-certain-html-tags-out-of-a-string
  var div = document.createElement("div");
  div.innerHTML = string;
  // If no allowed tags, use text directly.
  if (allowedTags.length == 0) {
    return div.textContent || div.innerText || "";
  }
  var tags = Array.prototype.slice.apply(div.getElementsByTagName("*"), [0]);
  for (var i = 0; i < tags.length; i++) {
    var removeTag = true;
    if (allowedTags.indexOf(tags[i].nodeName) !== -1) {
      removeTag = false;
      // Remove all attributes but href.
      for (var k=0, attrs = tags[i].attributes, l=attrs.length; k < l; k++){
        if (attrs.item(k).nodeName != 'href' && tags[i].nodeName !== 'a') {
          tags[i].removeAttribute(attrs.item(k).nodeName);
        }
        // Remove href tag completily. @TODO Is there a better way to test this?
        else if (tags[i].getAttribute('href').toLowerCase().indexOf('javascript') == 0) {
          removeTag = true;
        }
      }
    }
    // Remove tag if not in allowed tags or contained dangerious href.
    if (removeTag) {
      var last = tags[i];
      for (var k = tags[i].childNodes.length - 1; k >= 0; k--) {
        var e = tags[i].removeChild(tags[i].childNodes[k]);
        tags[i].parentNode.insertBefore(e, last);
        last = e;
      }
      tags[i].parentNode.removeChild(tags[i]);
    }
  }
  return div.innerHTML;
}

/**
 * Renders the tweets.
 *
 * @param id
 *   ID of the div to render to.
 */
Tweeter.prototype.render = function(id, offset) {
  var tweeterObject = this;
  offset = offset || 0;
  if (!id || typeof id != 'string') {
    throw('Invalid id given, either empty or not a string.');
  }
  this.divId = id;
  element = document.getElementById(id);
  if (!element) {
    throw('Unable to find element with id ' + id);
  }
  this.votes = this.votes ? this.votes : {};
  this.fetch(offset, true, function(tweeterObject, tweets) {
    element = document.getElementById(id);
    var tweetId = '';
    for (i in tweets) {
      tweetId = tweeterObject.sanitize(tweets[i].uid, []);
      element.innerHTML 
        += '<div class="tweet" id="tweet-' + tweetId + '">'
        + '<img src="images/' + tweeterObject.sanitize(tweets[i].userId, []) + '.gif">'
        + '<div class="tweet-text"> ' + tweeterObject.sanitize(tweets[i].tweet) + '</div>'
        + '<div class="date-area">'
          + '<span class="vote" ><a href="#" class="vote-link">Vote (<span class="vote-counter">' + tweeterObject.sanitize(tweets[i].vote, []) + '</span>)</a></span> - '
          + '<span class="date">' + tweeterObject.sanitize(tweets[i].date, []) + '</span>'
        + '</div>'
        + '</div>';
      // Track votes for later use so don't have to refresh from server.
      tweeterObject.votes[tweetId] = tweets[i].vote ? tweets[i].vote : 0;
    }
      // Attach the onclick behaviour.
      document.querySelectorAll(".vote-link").onclick = function() {
        event = event || window.event;
        var target = event.target || event.srcElement;
        var parent = target.parentNode;
        while (parent.getAttribute('class') != 'tweet') {
          parent = parent.parentNode;
        }
        console.log(parent.getAttribute('id').substring(6));
        tweeterObject.registerVote(parent.getAttribute('id').substring(6))
        return false;
      }

    // Update tweet listing on scroll.
    if (tweetId) {
      window.onscroll = function() {
        element = document.getElementById(tweetId)
        if (element) {
          // From http://stackoverflow.com/questions/704758/how-to-check-if-an-element-is-really-visible-with-javascript
          // Except changed to actually work.
          // Next time would just use a framework :P.
          function visible(element) {
            if (element.offsetWidth === 0 || element.offsetHeight === 0) return false;
            var height = document.documentElement.clientHeight,
                rects = element.getClientRects(),
                on_top = function(r) {
                  var x = (r.left + r.right)/2, y = (r.top + r.bottom)/2;
                  var elementAtPoint = document.elementFromPoint(x, y);
                  // Check parents.
                  while (elementAtPoint) {
                    if (elementAtPoint == element) return true;
                    elementAtPoint = elementAtPoint.parentNode;
                  }
                };
            for (var i = 0, l = rects.length; i < l; i++) {
              var r = rects[i],
                  in_viewport = r.top > 0 ? r.top <= height : (r.bottom > 0 && r.bottom <= height);
              if (in_viewport && on_top(r)) return true;
            }
            return false;
          }
          if (visible(element)) {
            tweeterObject.render(id, offset+20);
          }
        }
      }
    }
  })
}
// Global objects suck, this needs to be refectored later.
var tweeters = new Tweeter();

window.onload = function () {
  tweeters.render('tweets');
}
