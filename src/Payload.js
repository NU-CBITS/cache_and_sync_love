(function (context) {
  'use strict';

  function nonce() {
    function randomFixedLengthInteger(length) {
      return Math.floor(Math.pow(10, length - 1) +
        Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1));
    }

    return randomFixedLengthInteger(NONCE_DIGITS);
  }

  var NONCE_DIGITS = 12;
  var Payload = {
    setKey: function setKey(key) {
      this.key = key;

      return this;
    },

    setData: function setData(data) {
      this.data = data;

      return this;
    },

    getDataStringified: function getDataStringified() {
      if (this.data == null) {
        return '';
      }

      return JSON.stringify(this.data);
    },

    setUrl: function setUrl(url) {
      this.url = url;

      return this;
    },

    setMethod: function setMethod(httpMethod) {
      this.httpMethod = httpMethod;

      return this;
    },

    setSecret: function setSecret(secret) {
      this.secret = secret;

      return this;
    },

    getNonce: function getNonce() {
     this.nonce = this.nonce || nonce();

     return this.nonce;
    },

    getTimestamp: function getTimestamp() {
      this.timestamp = this.timestamp || (new Date()).valueOf();

      return this.timestamp;
    },

    signature: function signature() {
      return md5(
        this.getDataStringified() +
        this.key +
        this.getNonce() +
        this.getTimestamp() +
        this.url +
        this.httpMethod +
        this.secret
      );
    },

    toHeader: function toHeader() {
      return {
        Authorization: 'key="' + this.key + '"' +
          ',nonce=' + this.getNonce() +
          ',timestamp=' + this.getTimestamp() +
          ',url="' + this.url + '"' +
          ',method="' + this.httpMethod + '"' +
          ',signature="' + this.signature() + '"'
      };
    },

    persist: function persist() {
      this.setMethod('POST');

      return cbit.Ajax.post(this.url, this.toHeader(), {
        data: this.data
      });
    },

    fetch: function fetch(filter) {
      var filterQuery = filter == null ? '' : '?filter[updated_at][gt]=' + filter.gt;
      this.setMethod('GET');

      return cbit.Ajax.get(this.url + filterQuery, this.toHeader());
    }
  };

  context.cbit = context.cbit || {};
  context.cbit.Payload = Payload;
})(this);
