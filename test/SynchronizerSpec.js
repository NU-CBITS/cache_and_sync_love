'use strict';

var Synchronizer = cbit.Synchronizer;

describe('Synchronizer', function() {
  var online = { hasConnection: function() { return true; } };

  afterEach(function() {
    Synchronizer.resetCaches();
  });

  describe('.registerCache', function() {
    describe('when the cache has not been registered', function() {
      it('adds the cache to its list', function() {
        var cache = { tableName: 'cache1' };
        Synchronizer.registerCache(cache);

        expect(Synchronizer.caches[Synchronizer.caches.length - 1])
          .toEqual(cache);
      });
    });

    describe('when the cache has already been registered', function() {
      it('does not add the cache to its list', function() {
        var cache = { tableName: 'cache1' };
        Synchronizer.registerCache(cache);
        Synchronizer.registerCache(cache);

        expect(Synchronizer.caches.length).toEqual(1);
      });
    });
  });

  describe('.run', function() {
    describe('when not already running', function() {
      it('kicks off synchronization', function(done) {
        var cache = {
          tableName: 'mock_data',
          fetchAllDirty: function() {
            return Promise.resolve([{ id: '1' }]);
          }
        };
        var persistSpy = jasmine.createSpy('persist');
        var payload = {
          setData: function() {
            return this;
          },
          persist: function() {
            persistSpy();
            return Promise.resolve();
          },
          fetch: function() {
            return Promise.resolve();
          }
        };
        Synchronizer.setNetwork(online);
        Synchronizer.setPayloadResource(payload);
        Synchronizer.registerCache(cache);

        spyOn(cache, 'fetchAllDirty').and.callThrough();

        Synchronizer.run();
        setTimeout(function() {
          expect(cache.fetchAllDirty).toHaveBeenCalled();
          expect(cache.fetchAllDirty.calls.count()).toEqual(1);
          expect(persistSpy).toHaveBeenCalled();
          expect(persistSpy.calls.count()).toEqual(1);
          Synchronizer.stop();
          done();
        }, 1);
      });
    });
  });

  describe('.synchronize', function() {
    describe('when there is not a network connection', function() {
      var offline = { hasConnection: function() { return false; } };

      it('does not fetch dirty data from the caches to persist', function() {
        var cache = { tableName: 'mockCache', fetchAllDirty: jasmine.createSpy() };
        Synchronizer.setNetwork(offline);
        Synchronizer.registerCache(cache);

        Synchronizer.synchronize();

        expect(cache.fetchAllDirty).not.toHaveBeenCalled();
      });

      it('does not fetch data from the server', function() {
        var payload = { fetch: jasmine.createSpy() };
        Synchronizer.setNetwork(offline);
        Synchronizer.setPayloadResource(payload);

        Synchronizer.synchronize();

        expect(payload.fetch).not.toHaveBeenCalled();
      });
    });

    describe('when an error occurs during transmission', function() {
      it('saves it to the error cache', function(done) {
        var payload = {
          setData: function() {
            return this;
          },
          persist: function() {
            return new Promise(function(resolve, reject) {
              reject('asdf');
            });
          },
          fetch: function() {
            return new Promise(function(resolve) {
              resolve({ data: [] });
            });
          }
        };
        var cache = {
          tableName: 'mock_data',
          fetchAllDirty: function() {
            return new Promise(function(resolve) {
              resolve([{ id: '1' }]);
            });
          }
        };
        var errorCache = {
          tableName: 'mock_errors',
          persist: jasmine.createSpy()
        };
        Synchronizer.setNetwork(online);
        Synchronizer.setPayloadResource(payload);
        Synchronizer.registerCache(cache);
        Synchronizer.registerErrorCache(errorCache);

        Synchronizer.synchronize().then(function() {
          expect(errorCache.persist).toHaveBeenCalledWith({ value: 'asdf' });
          done();
        }).catch(done.fail);
      });
    });

    describe('when there is a network connection', function() {
      var dataPersisted = null,
          fetchedPayload = { data: [] },
          datum = { id: 'uuid1', foo: 'bar' };
      var payload = {
        setData: function(data) {
          dataPersisted = data;
          return this;
        },
        persist: function() {
          return new Promise(function(resolve) {
            resolve({ data: [datum] });
          });
        },
        fetch: function() {
          return new Promise(function(resolve) {
            resolve(fetchedPayload);
          });
        }
      };

      describe('when there are no dirty records', function() {
        it('does not transmit', function(done) {
          var cache = {
            tableName: 'mock_data',
            fetchAllDirty: function() {
              return new Promise(function(resolve) {
                resolve([]);
              });
            },
            markClean: jasmine.createSpy()
          };
          Synchronizer.setNetwork(online);
          Synchronizer.setPayloadResource(payload);
          Synchronizer.registerCache(cache);

          Synchronizer.synchronize().then(function() {
            expect(dataPersisted).toBeNull();
            expect(cache.markClean).not.toHaveBeenCalled();
            done();
          }).catch(done.fail);
        });
      });

      describe('and it successfully persists dirty data to the server', function() {
        it('marks the data clean in the cache', function(done) {
          var cache = {
            tableName: 'mock_data',
            fetchAllDirty: function() {
              return new Promise(function(resolve) {
                resolve([datum]);
              });
            },
            markClean: jasmine.createSpy()
          };
          Synchronizer.setNetwork(online);
          Synchronizer.setPayloadResource(payload);
          Synchronizer.registerCache(cache);

          Synchronizer.synchronize().then(function() {
            expect(dataPersisted[0]).toEqual(datum);
            expect(cache.markClean).toHaveBeenCalledWith([datum.id]);
            done();
          }).catch(done.fail);
        });
      });

      describe('and it fetches data from the server', function() {
        describe('and the data type corresponds to a registered cache', function() {
          it('persists the data to the cache', function(done) {
            var cache = {
              tableName: 'mock_data',
              fetchAllDirty: function() {
                return new Promise(function(resolve) {
                  resolve([]);
                });
              },
              persist: function() {
                return new Promise(function(resolve) {
                  resolve([]);
                });
              },
              markClean: function() {
                return new Promise(function(resolve) {
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
