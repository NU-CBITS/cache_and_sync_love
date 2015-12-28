(function (context) {
  'use strict';

  function nonce() {
    return cbit.uuid();
  }

  var Payload = {
    setKey: function setKey(key) {
      this.key = key;
    },

    setData: function setData(data) {
      this.data = data;
    },

    setUrl: function setUrl(url) {
      this.url = url;
    },

    setMethod: function setMethod(httpMethod) {
      this.httpMethod = httpMethod;
    },

    setSecret: function setSecret(secret) {
      this.secret = secret;
    },

    getNonce: function getNonce() {
     this.nonce = this.nonce || nonce();

     return this.nonce;
    },

    getTimestamp: function getTimestamp() {
      this.timestamp = this.timestamp || (new Date()).valueOf();

      return this.timestamp;
    },

    hash: function hash() {
      return md5(
        JSON.stringify(this.data) +
        this.key +
        this.getNonce() +
        this.getTimestamp() +
        this.url +
        this.httpMethod +
        this.secret
      );
    },

    toObject: function toObject() {
      return {
        payload: this.data,
        key: this.key,
        nonce: this.getNonce(),
        timestamp: this.getTimestamp(),
        url: this.url,
        method: this.httpMethod,
        hash: this.hash()
      };
    }
  };

  context.cbit = context.cbit || {};
  context.cbit.Payload = Payload;
})(this);
