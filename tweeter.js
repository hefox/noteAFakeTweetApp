
/**
 * Fetches and effects tweets
 */
var Tweeter = function () {}

/**
 * Fetch some tweets!
 *
 * Note if there was doing this and new tweets were being generated, would need
 * more information to find older/lower ranked tweets without duplicating.
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
  // This should use post instead and have some user information.
  url += '?vote=' + tweetId;
  xmlhttp.open('GET', url);
  xmlhttp.send();
  // We don't bother refetching but instead mock that the data was sent
  // so it's more performant.
  tweetCssId = 'tweet-' + tweetId;
  this.votesCache = this.votesCache || {};
  this.votesCache[tweetId] = tweetId in this.votesCache ? this.votesCache[tweetId] + 1 : 1;

  // Not rendering for tests, so skip updating markup  in this case.
  if (!this.divId) {
    return;
  }
  var div = document.getElementById(this.divId);
  var tweetElement = document.getElementById(tweetCssId);
  // We find the sibling that has the vote that is closets, but higher than
  // current vote. Traverse intil finding the place.
  var previous = tweetElement
  var moveAfter, sameVote;
  // Keep going up till find an element that has a higher vote above an element
  // with lower vote.
  while (previous = previous.previousSibling) {
    var prevID = previous.getAttribute('id').substring(6);
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
  // Update vote counter to say how many votes currently are.
  document.querySelector("#" + tweetCssId + " .vote-counter").innerHTML = this.votesCache[tweetId];
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
  // Save current tweet object in variable for reuse in event handlers.
  var tweeterObject = this;
  // Default offset to 0 if not passed.
  offset = offset || 0;
  // Verify input to function.
  if (!id || typeof id != 'string') {
    throw('Invalid id given, either empty or not a string.');
  }
  // Track what div was updated.
  this.divId = id;
  element = document.getElementById(id);
  if (!element) {
    throw('Unable to find element with id ' + id);
  }
  // Stores how many votes on this side as a cache, defaulted to returned data.
  this.votesCache = this.votesCache ? this.votesCache : {};
  // Add an handler that caches the async new results.
  this.fetch(offset, true, function(tweeterObject, tweets) {
    element = document.getElementById(id);
    var tweetId = '';
    var output = '';
    for (i in tweets) {
      tweetId = tweeterObject.sanitize(tweets[i].uid, []);
      output
        += '<div class="tweet" id="tweet-' + tweetId + '">'
        + '<img src="images/' + tweeterObject.sanitize(tweets[i].userId, []) + '.gif">'
        + '<div class="tweet-text"> ' + tweeterObject.sanitize(tweets[i].tweet) + '</div>'
        + '<div class="date-area">'
          + '<span class="vote" ><a href="#" class="vote-link">Vote (<span class="vote-counter">' + tweeterObject.sanitize(tweets[i].vote, []) + '</span>)</a></span> - '
          + '<span class="date">' + tweeterObject.sanitize(tweets[i].date, []) + '</span>'
        + '</div>'
        + '</div>';
      // Track votes for later use so don't have to refresh from server.
      tweeterObject.votesCache[tweetId] = tweets[i].vote ? tweets[i].vote : 0;
    }
    // Addd the new tweets to output.
    element.innerHTML += output;

    // Attach on click event to update vote count on clicking.
    var elements = document.querySelectorAll('a.vote-link');
    for (var i in elements) {
      elements[i].onclick = function() {
        // Find the parent with the id.
        event = event || window.event;
        var target = event.target || event.srcElement;
        var parent = target.parentNode;
        while (parent.getAttribute('class') != 'tweet') {
          parent = parent.parentNode;
        }
        // Remove tweet- from id and register vote.
        tweeterObject.registerVote(parent.getAttribute('id').substring(6));
        return false;
      }
    }

    // Update tweet listing on scroll.
    if (tweetId) {
      window.onscroll = function() {
        element = document.getElementById('tweet-' + tweetId)
        if (element) {
          // From http://stackoverflow.com/questions/704758/how-to-check-if-an-element-is-really-visible-with-javascript
          // Except changed to actually work.
          // Next time would just use a framework likely.
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

window.onload = function () {
  var tweeters = new Tweeter();
  tweeters.render('tweets');
}
