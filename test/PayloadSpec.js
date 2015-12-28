'use strict';

var Payload = cbit.Payload;

describe('Payload', function() {
  describe('.toObject', function() {
    it('returns an object with the appropriate properties', function() {
      var payload = Object.create(Payload);
      payload.setKey('key1');
      payload.setData({ foo: 'bar' });
      payload.setUrl('https://api.example.com');
      payload.setMethod('POST');
      payload.setSecret('secrets!');
      payload.nonce = 'nonce1';
      payload.timestamp = 12345;

      var obj = payload.toObject();

      expect(obj.payload).toEqual({ foo: 'bar' });
      expect(obj.key).toEqual('key1');
      expect(obj.nonce).toEqual('nonce1');
      expect(obj.timestamp).toEqual(12345);
      expect(obj.url).toEqual('https://api.example.com');
      expect(obj.method).toEqual('POST');
      expect(obj.hash).toEqual('966f9ec41f3f6d9369f2e7227650507b');
    });
  });
});
