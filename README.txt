I claim no license to this, especially not to the images folder that has
all those ichat icons in it.

For the ajax calls, the xmlhttprequest object was overridden, but was not
able to overwrite the readonly property where the data is stored so used
json storage instead.

All the tweets are generated via randomness. They will persist until local
storage is cleared or the tests are run.

The only library used is qunit. jQuery would be quite useful for cross browser
and DOM manipulation but was not used as an additional challenge.

Areas that could bw improved on with more time:
1) animationse
2) Custom tweet object to have functions to retrieve selector, etc.
3) support same tweet in two tweet listings (right now prevented due to id use)
4) Add sorting.

The main files to look at are

1) index.html to view it
2) test.html to run the tests
3) xmlhttprequest.js to see how the xml is overridden
4) tweeter.js to see the send/fetch/render/etc. logic.