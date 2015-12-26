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

  function persistData(dirtyData) {
    return this.payload.persist(dirtyData);
  }

  function collectDirtyData(cache) {
    return cache.fetchAllDirty(this.connection);
  }

  function persistDirtyData() {
    return Promise.all(this.caches.map(collectDirtyData.bind(this)))
      .then(persistData.bind(this))
      .then(markCacheRecordsClean.bind(this));
  }

  function persistClean(datum) {
    var cache = Synchronizer.getCache(datum.type);

    if (cache) {
      cache.persist(this.connection, datum);
      cache.markClean(this.connection, datum.uuid);
    }
  }

  function fetchData() {
    return this.payload.fetch().then((function(response) {
      response.data.forEach(persistClean.bind(this));
    }).bind(this));
  }

  var Synchronizer = {
    PERIOD_IN_MS: 30 * 1000,

    setDbConnection: function setDbConnection(connection) {
      this.connection = connection;
    },

    setNetwork: function setNetwork(network) {
      this.network = network;
    },

    setPayloadResource: function setPayloadResource(payload) {
      this.payload = payload;
    },

    synchronize: function synchronize() {
      if (!this.network.hasConnection()) { return; }

      return Promise.all([
        persistDirtyData.bind(this)(),
        fetchData.bind(this)()
      ]);
    },

    run: function run() {
      this.synchronize();
      context.setInterval(this.run.bind(this), this.PERIOD_IN_MS);
    },

    registerCache: function registerCache(cache) {
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
