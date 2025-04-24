'use strict';

(function() {
  var location = window.location;
  if (location.pathname !== '/gp/yourstore/home' || location.search === '') {
    return;
  }

  var query = window.location.search.substring(1);
  if (query.indexOf('openid.oa2.access_token=') > -1) {
    BrowserMessage.sendMessage({
      cmd: 'oauth2Callback',
      data: {
        query: query
      }
    });
  }
})();