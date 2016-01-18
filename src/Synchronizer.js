(function(context) {
  'use strict';

  function markCacheRecordsClean(response) {
    var cache;

    if (response.data.length === 0) { return; }

    cache = Synchronizer.getCache(response.data[0].type);

    if (!cache) { return; }

    cache.markClean(this.connection, response.data.map(function(d) {
      return d.uuid;
    }));
  }

  function collectDirtyData(cache) {
    return cache.fetchAllDirty(this.connection);
  }

  function persistDirtyData(payload) {
    return Promise.all(this.caches.map(collectDirtyData.bind(this)))
      .then(function(dirtyData) {
        var flatData = [];
        dirtyData.forEach(function(d) {
          flatData = flatData.concat(d);
        });

        return payload.setData(flatData).persist();
      })
      .then(markCacheRecordsClean.bind(this));
  }

  function persistClean(datum) {
    var cache = Synchronizer.getCache(datum.type);

    if (cache) {
      cache.persist(this.connection, datum);
      cache.markClean(this.connection, datum.uuid);
    }
  }

  function fetchData(payload) {
    return payload.fetch().then((function(response) {
      response.data.forEach(persistClean.bind(this));
    }).bind(this));
  }

  var synchronizerIntervalId = null;

  var Synchronizer = {
    period_in_ms: 30 * 1000,

    setPeriod: function setPeriod(period) {
      this.period_in_ms = period;

      return this;
    },

    setDbConnection: function setDbConnection(connection) {
      this.connection = connection;

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
        persistDirtyData.bind(this)(persistPayload),
        fetchData.bind(this)(fetchPayload)
      ]);
    },

    run: function run() {
      if (synchronizerIntervalId != null) {
        return;
      }

      this.synchronize();
      synchronizerIntervalId = context.setInterval(
        this.run.bind(this),
        this.period_in_ms
      );
    },

    stop: function stop() {
      context.clearInterval(synchronizerIntervalId);
      synchronizerIntervalId = null;
    },

    registerCache: function registerCache(cache) {
      if (this.cacheTypeIndices[cache.name] != null) {
        return;
      }

      this.cacheTypeIndices[cache.name] = this.caches.length;
      this.caches.push(cache);
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
