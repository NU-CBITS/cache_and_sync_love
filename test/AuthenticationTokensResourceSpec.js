'use strict';

describe('AuthenticationTokensResource', function() {
  describe('.create', function() {
    it('POSTs the required data to the server', function() {
      var tokensResource = Object.create(cbit.AuthenticationTokensResource)
        .setUrl('https://api.example.com')
        .setClientUuid('client1');
      spyOn(cbit.Ajax, 'post');

      tokensResource.create('config_token1');

      expect(cbit.Ajax.post).toHaveBeenCalledWith(
        'https://api.example.com',
        {},
        {
          configurationToken: 'config_token1',
          data: {
            type: 'authenticationTokens',
            clientUuid: 'client1'
          }
        }
      )
    });
  });
});
