'use strict';

describe('Synchronizer', function() {
  afterEach(function() {
    Synchronizer.resetCaches();
  });

  describe('.synchronize', function() {
    describe('when there is not a network connection', function() {
      var offline = { hasConnection: function() { return false; } };

      it('does not fetch dirty data from the caches to persist', function() {
        var cache = { name: 'mockCache', fetchAllDirty: function() {} };
        Synchronizer.setNetwork(offline);
        Synchronizer.registerCache(cache);

        spyOn(cache, 'fetchAllDirty');
        Synchronizer.synchronize();

        expect(cache.fetchAllDirty).not.toHaveBeenCalled();
      });

      it('does not fetch data from the server', function() {
        var payload = { fetch: function() {} };
        Synchronizer.setNetwork(offline);
        Synchronizer.setPayloadResource(payload);

        spyOn(payload, 'fetch');
        Synchronizer.synchronize();

        expect(payload.fetch).not.toHaveBeenCalled();
      });
    });

    describe('when there is a network connection', function() {
      var online = { hasConnection: function() { return true; } },
          dataPersisted = null,
          fetchedPayload = { data: [] },
          datum = { uuid: 'uuid1', foo: 'bar', type: 'mockCache' };
      var payload = {
        persist: function(data) {
          dataPersisted = data;

          return new Promise(function(resolve, reject) {
            resolve({ data: [datum] });
          });
        },
        fetch: function() {
          return new Promise(function(resolve, reject) {
            resolve(fetchedPayload);
          });
        }
      };

      describe('and it successfully persists dirty data to the server', function() {
        it('marks the data clean in the cache', function(done) {
          var cache = {
            name: 'mockCache',
            fetchAllDirty: function() {
              return new Promise(function(resolve, reject) {
                resolve([datum]);
              });
            },
            markClean: function() {}
          };
          Synchronizer.setNetwork(online);
          Synchronizer.setPayloadResource(payload);
          Synchronizer.registerCache(cache);
          Synchronizer.setDbConnection('mock-db-connection');

          spyOn(payload, 'persist').and.callThrough();
          spyOn(cache, 'markClean');
          Synchronizer.synchronize().then(function() {
            expect(dataPersisted[0][0]).toEqual(datum);
            expect(cache.markClean).toHaveBeenCalledWith('mock-db-connection', [datum.uuid]);
            done();
          }).catch(done.fail);
        });
      });

      describe('and it fetches data from the server', function() {
        describe('and the data type corresponds to a registered cache', function() {
          it('persists the data to the cache', function(done) {
            var cache = {
              name: 'mockCache',
              fetchAllDirty: function() {
                return new Promise(function(resolve, reject) {
                  resolve([]);
                });
              },
              persist: function() {
                return new Promise(function(resolve, reject) {
                  resolve([]);
                });
              },
              markClean: function() {
                return new Promise(function(resolve, reject) {
                  resolve([]);
                });
              }
            };
            Synchronizer.setNetwork(online);
            Synchronizer.setPayloadResource(payload);
            Synchronizer.registerCache(cache);
            fetchedPayload = { data: [datum] };

            spyOn(payload, 'fetch').and.callThrough();
            spyOn(cache, 'persist').and.callThrough();
            Synchronizer.synchronize().then(function() {
              expect(payload.fetch).toHaveBeenCalled();
              expect(cache.persist).toHaveBeenCalled();
              done();
            }).catch(done.fail);
          });
        });
      });
    });
  });
});
