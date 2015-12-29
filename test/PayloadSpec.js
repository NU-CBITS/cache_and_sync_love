'use strict';

var Payload = cbit.Payload;

describe('Payload', function() {
  function dummyPayload() {
    var payload = Object.create(Payload)
      .setKey('key1')
      .setData({ foo: 'bar' })
      .setUrl('https://api.example.com')
      .setMethod('POST')
      .setSecret('secrets!');
    payload.nonce = 9876;
    payload.timestamp = 12345;

    return payload;
  }

  describe('.getDataStringified', function() {
    it('returns an empty string when data is null or undefined', function() {
      var payload = Object.create(Payload);

      expect(payload.setData(null).getDataStringified()).toEqual('');
      expect(payload.setData(undefined).getDataStringified()).toEqual('');
    });
  });

  describe('.getNonce', function() {
    it('returns a 12 digit integer', function() {
      var nonce = Object.create(Payload).getNonce();

      expect(nonce).toBeGreaterThan(99999999999);
      expect(nonce).toBeLessThan(1000000000000);
    });
  });

  describe('.getTimestamp', function() {
    it('returns the current epoch timestamp', function() {
      var before = (new Date()).valueOf();
      var timestamp = Object.create(Payload).getTimestamp();
      var after = (new Date()).valueOf();

      expect(timestamp >= before).toBeTruthy();
      expect(timestamp <= after).toBeTruthy();
    });
  });

  describe('.toObject', function() {
    it('returns an object with the appropriate properties', function() {
      var obj = dummyPayload().toObject();

      expect(obj.payload).toEqual({ foo: 'bar' });
      expect(obj.key).toEqual('key1');
      expect(obj.nonce).toEqual(9876);
      expect(obj.timestamp).toEqual(12345);
      expect(obj.url).toEqual('https://api.example.com');
      expect(obj.method).toEqual('POST');
      expect(obj.signature).toEqual('253c1b316f6793c24fd1319e7aaff3b4');
    });
  });

  describe('.toHeader', function() {
    it('returns an object with the appropriate auth string', function() {
      var payload = dummyPayload();
      payload.setData(null);
      var header = payload.toHeader();

      expect(header.Authorization).toEqual(
        'key="key1",nonce=9876,timestamp=12345,url="https://api.example.com",method="POST",' +
          'signature="33e513679b6f5513bc385511750213dd"'
      );
    });
  });
});
