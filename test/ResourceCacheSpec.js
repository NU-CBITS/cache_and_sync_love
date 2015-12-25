'use strict';

describe('ResourceCache', function() {
  var DB_NAME = 'app_test';

  function getSchemaBuilder() {
    return lf.schema.create(DB_NAME, 1);
  }

  describe('#createTable', function() {
    describe('when no schemaBuilder property is assigned', function() {
      it('throws an exception', function() {
        var cache = Object.create(ResourceCache);
        cache.setStoreType(lf.schema.DataStoreType.MEMORY);

        expect(cache.createTable.bind(cache)).toThrow();
      });
    });

    describe('when a schemaBuilder property is assigned', function() {
      describe('when no tableName property is assigned', function() {
        it('throws an exception', function() {
          var cache = Object.create(ResourceCache);
          cache.setSchemaBuilder(getSchemaBuilder());
          cache.setStoreType(lf.schema.DataStoreType.MEMORY);

          expect(cache.createTable.bind(cache)).toThrow();
        });
      });

      describe('when a tableName property is assigned', function() {
        it('adds an IndexedDB table', function() {
          var cache = Object.create(ResourceCache);
          cache.setSchemaBuilder(getSchemaBuilder());
          cache.setTableName('my_table');
          cache.setStoreType(lf.schema.DataStoreType.MEMORY);

          expect(cache.createTable.bind(cache)).not.toThrow();
        });
      });
    });
  });

  describe('#markClean', function() {
    describe('when a dirty record exists', function() {
      it('marks it clean', function(done) {
        var cache = Object.create(ResourceCache);
        cache.setSchemaBuilder(getSchemaBuilder());
        cache.setTableName('my_table');
        cache.setStoreType(lf.schema.DataStoreType.MEMORY);
        cache.createTable();
        var connection = cache.connectToDb();
        cache.persist(connection, {}).then(function(records) {
          var uuid = records[0].uuid;
          cache.markClean(connection, [uuid]).then(function() {
            cache.fetch(connection, uuid).then(function(records) {
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
      var cache = Object.create(ResourceCache);
      cache.setSchemaBuilder(getSchemaBuilder());
      cache.setTableName('my_table');
      cache.setStoreType(lf.schema.DataStoreType.MEMORY);
      cache.createTable();
      var connection = cache.connectToDb();
      cache.persist(connection, {}).then(function(records) {
        var uuid = records[0].uuid;
        cache.fetchAll(connection).then(function(records) {
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
      var cache = Object.create(ResourceCache);
      cache.setSchemaBuilder(getSchemaBuilder());
      cache.setTableName('my_table');
      cache.setStoreType(lf.schema.DataStoreType.MEMORY);
      cache.createTable();
      var connection = cache.connectToDb();
      cache.persist(connection, {}).then(function(records) {
        var uuid = records[0].uuid;
        cache.fetchAllDirty(connection).then(function(records) {
          if (records[0].uuid === uuid) {
            done();
          } else {
            done.fail('record should be returned');
          }
        });
      });
    });
  });
});
