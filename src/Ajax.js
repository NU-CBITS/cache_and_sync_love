(function(context) {
  'use strict';

  var Ajax = {
    post: function post(url, headers, data) {
      return new Promise(function(resolve, reject) {
        var request = new XMLHttpRequest();

        request.onload = function onload() {
          if (request.status === 201) {
            try {
              var responseObject = JSON.parse(request.responseText);
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
        request.setRequestHeader('Content-Type', 'application/json');
        for (var header in headers) {
          request.setRequestHeader(header, headers[header]);
        }
        request.send(context.JSON.stringify(data));
      });
    },

    get: function get(url, headers) {
      return new Promise(function(resolve, reject) {
        var request = new XMLHttpRequest();

        request.onload = function onload() {
          if (request.status === 200) {
            try {
              var responseObject = JSON.parse(request.responseText);
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

        request.open('GET', url);
        request.setRequestHeader('Content-Type', 'application/json');
        for (var header in headers) {
          request.setRequestHeader(header, headers[header]);
        }
        request.send();
      });
    }
  };

  context.cbit = context.cbit || {};
  context.cbit.Ajax = Ajax;
})(this);
