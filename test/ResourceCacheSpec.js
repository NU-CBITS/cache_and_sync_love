'use strict';

var ResourceCache = cbit.ResourceCache;

describe('ResourceCache', function() {
  var DB_NAME = 'app_test';

  function getSchemaBuilder() {
    return lf.schema.create(DB_NAME, 1);
  }

  function getCache() {
    var cache = Object.create(ResourceCache)
                      .setSchemaBuilder(getSchemaBuilder())
                      .setTableName('my_table')
                      .setStoreType(lf.schema.DataStoreType.MEMORY);
    cache.createTable();

    return cache;
  }

  describe('#createTable', function() {
    describe('when no schemaBuilder property is assigned', function() {
      it('throws an exception', function() {
        var cache = Object.create(ResourceCache)
          .setStoreType(lf.schema.DataStoreType.MEMORY);

        expect(cache.createTable.bind(cache)).toThrow();
      });
    });

    describe('when a schemaBuilder property is assigned', function() {
      describe('when no tableName property is assigned', function() {
        it('throws an exception', function() {
          var cache = Object.create(ResourceCache)
            .setSchemaBuilder(getSchemaBuilder())
            .setStoreType(lf.schema.DataStoreType.MEMORY);

          expect(cache.createTable.bind(cache)).toThrow();
        });
      });

      describe('when a tableName property is assigned', function() {
        it('adds an IndexedDB table', function() {
          var cache = Object.create(ResourceCache)
            .setSchemaBuilder(getSchemaBuilder())
            .setTableName('my_table')
            .setStoreType(lf.schema.DataStoreType.MEMORY);

          expect(cache.createTable.bind(cache)).not.toThrow();
        });
      });
    });
  });

  describe('#markClean', function() {
    describe('when a dirty record exists', function() {
      it('marks it clean', function(done) {
        var cache = getCache();
        cache.persist({}).then(function(records) {
          var uuid = records[0].uuid;
          cache.markClean([uuid]).then(function() {
            cache.fetch(uuid).then(function(records) {
              if (records[0].is_dirty === false) {
                done();
              } else {
                done.fail('record should not be dirty');
              }
            });
          });
        });
      });
    });
  });

  describe('#fetchAll', function() {
    it('returns all records in the table', function(done) {
      var cache = getCache();
      cache.persist({}).then(function(records) {
        var uuid = records[0].uuid;
        cache.fetchAll().then(function(records) {
          if (records[0].uuid === uuid) {
            done();
          } else {
            done.fail('record should be returned');
          }
        });
      });
    });
  });

  describe('#fetchAllDirty', function() {
    it('returns all dirty records in the table', function(done) {
      var cache = getCache();
      cache.persist({}).then(function(records) {
        var uuid = records[0].uuid;
        cache.fetchAllDirty().then(function(records) {
          if (records.length === 1 && records[0].uuid === uuid) {
            done();
          } else {
            done.fail('record should be returned');
          }
        });
      });
    });

    it('does not select the "is_dirty" column', function(done) {
      var cache = getCache();
      cache.persist({}).then(function() {
        cache.fetchAllDirty().then(function(records) {
          if (records.length === 1 && records[0].is_dirty == undefined) {
            done();
          } else {
            done.fail('should not select "is_dirty" column');
          }
        });
      });
    });
  });

  describe('#persist', function() {
    it('stores a record in the database with metadata', function(done) {
      var cache = getCache();
      cache.persist({ foo: 'bar' }).then(function(records) {
        if (records.length === 1 &&
            records[0].uuid != null &&
            records[0].is_dirty == true &&
            records[0].created_at != null &&
            records[0].updated_at != null &&
            records[0].hasOwnProperty('foo') &&
            records[0].foo === 'bar') {
          done();
        } else {
          done.fail('should store records');
        }
      });
    });
  });
});
