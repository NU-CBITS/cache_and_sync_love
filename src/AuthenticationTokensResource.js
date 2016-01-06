(function(context) {
  'use strict';

  function post(url, data) {
    return new Promise(function(resolve, reject) {
      var request = new XMLHttpRequest();
      request.responseType = 'json';

      request.onload = function onload() {
        if (request.status === 200) {
          try {
            var responseObject = JSON.parse(request.response);
            resolve(responseObject);
          }
          catch (error) {
            reject(error);
          }
        } else {
          reject(Error(request.statusText));
        }
      };

      request.onerror = function onerror() {
        reject(Error('Network Error'));
      };

      request.ontimeout = function ontimeout() {
        reject(Error('Network Error'));
      };

      request.open('POST', url);
      request.send(context.JSON.stringify(data));
    });
  }

  var AuthenticationTokensResource = {
    setUrl: function setUrl(url) {
      this.url = url;

      return this;
    },

    setClientUuid: function setClientUuid(clientUuid) {
      this.clientUuid = clientUuid;

      return this;
    },

    create: function create(configurationToken) {
      return post(this.url, {
        configurationToken: configurationToken,
        data: {
          type: 'authenticationTokens',
          clientUuid: this.clientUuid
        }
      });
    }
  };

  context.cbit = context.cbit || {};
  context.cbit.AuthenticationTokensResource = AuthenticationTokensResource;
})(this);
