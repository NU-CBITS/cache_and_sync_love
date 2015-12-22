(function(context) {
  'use strict';

  var Synchronizer = {
    PERIOD_IN_MS: 30 * 1000,

    setConnection: function setConnection(connection) {
      this.connection = connection;
    },

    persistDirtyData: function persistDirtyData() {
      var connection = ResourceCache.connectToDb(),
          dirtyData = [];
      Promise.all(this.caches.map(function collectDirtyData(cache) {
        return cache.fetchAllDirty(connection).then(function addDirtyRecords(records) {
          dirtyData = dirtyData.concat(records);
        });
      }, cache)).then(function markCachesClean() {
        payloads.persist(dirtyData).then(function markCacheClean(response) {
          response.data.forEach(function markRecordClean(datum) {
            var cache = Synchronizer.getCache(datum.type);

            if (cache) {
              cache.markClean(connection, datum.uuid);
            }
          });
        });
      });
    },

    synchronize: function synchronize() {
      if (!this.connection.hasConnection()) {
        return;
      }

      this.persistDirtyData();
      this.fetchData();
    },

    run: function run() {
      this.synchronize();
      context.setInterval(this.run.bind(this), this.PERIOD_IN_MS);
    },

    registerCache: function registerCache(cache) {
      this.cacheTypeIndices[cache.KEY] = this.caches.length;
      this.caches.push(cache);
    },

    getCache: function getCache(type) {
      return this.caches[this.cacheTypeIndices[type]];
    }
  };

  context.Synchronizer = Synchronizer;
})(this);
