(function(context) {
  'use strict';

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
      return cbit.Ajax.post(this.url, {}, {
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
