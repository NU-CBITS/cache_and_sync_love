(function(context) {
  'use strict';

  function markCacheRecordsClean(response) {
    var cache;

    if (response.data.length === 0) { return; }

    cache = Synchronizer.getCache(response.data[0].type);

    if (!cache) { return; }

    cache.markClean(response.data.map(function(d) {
      return d.id;
    }));
  }

  function collectDirtyData(cache) {
    return cache.fetchAllDirty().then(function(dirtyRecords) {
      return dirtyRecords.map(function(dirtyRecord) {
        dirtyRecord.type = cache.tableName;

        return dirtyRecord;
      });
    });
  }

  function transmitDirtyData(payload) {
    return Promise.all(this.caches.map(collectDirtyData.bind(this)))
      .then(function(dirtyData) {
        if (dirtyData.some(function(d) { return d.length > 0; })) {
          var flatData = dirtyData.reduce(function(a, b) {
            return a.concat(b);
          }, []);

          return payload.setData(flatData).persist();
        }

        return { data: [] };
      })
      .then(markCacheRecordsClean.bind(this));
  }

  function persistClean(datum) {
    var cache = Synchronizer.getCache(datum.type);

    if (cache) {
      cache.persist(datum);
      cache.markClean([datum.id]);
    }
  }

  function fetchData(payload) {
    return payload.fetch().then((function(response) {
      response.data.forEach(persistClean.bind(this));
    }).bind(this));
  }

  var synchronizerTimeoutId = null;

  var Synchronizer = {
    period_in_ms: 30 * 1000,

    setPeriod: function setPeriod(period) {
      this.period_in_ms = period;

      return this;
    },

    setNetwork: function setNetwork(network) {
      this.network = network;

      return this;
    },

    setPayloadResource: function setPayloadResource(Payload) {
      this.Payload = Payload;
    },

    synchronize: function synchronize() {
      if (!this.network.hasConnection()) { return; }

      var persistPayload = Object.create(this.Payload),
          fetchPayload = Object.create(this.Payload);

      return Promise.all([
        transmitDirtyData.bind(this)(persistPayload),
        fetchData.bind(this)(fetchPayload)
      ]).catch((function(result) {
        if (this.errorCache != null) {
          this.errorCache.persist({ value: result });
        }
      }).bind(this));
    },

    run: function run() {
      this.stop();
      this.synchronize().then((function() {
        synchronizerTimeoutId = context.setTimeout(
          this.run.bind(this),
          this.period_in_ms
        );
      }).bind(this));
    },

    stop: function stop() {
      context.clearTimeout(synchronizerTimeoutId);
      synchronizerTimeoutId = null;
    },

    registerCache: function registerCache(cache) {
      if (this.cacheTypeIndices[cache.tableName] != null) {
        return;
      }

      this.cacheTypeIndices[cache.tableName] = this.caches.length;
      this.caches.push(cache);
    },

    registerErrorCache: function registerErrorCache(cache) {
      this.errorCache = cache;

      return this;
    },

    getCache: function getCache(type) {
      return this.caches[this.cacheTypeIndices[type]];
    },

    resetCaches: function resetCaches() {
      this.caches = [];
      this.cacheTypeIndices = {};
    }
  };

  Synchronizer.resetCaches();

  context.cbit = context.cbit || {};
  context.cbit.Synchronizer = Synchronizer;
})(this);
