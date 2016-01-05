'use strict';

var LocalResource = cbit.LocalResource;

describe('LocalResource', function() {
  var DB_NAME = 'app_test';

  function getSchemaBuilder() {
    return lf.schema.create(DB_NAME, 1);
  }

  describe('#createTable', function() {
    describe('when no schemaBuilder property is assigned', function() {
      it('throws an exception', function() {
        var cache = Object.create(LocalResource)
          .setStoreType(lf.schema.DataStoreType.MEMORY);

        expect(cache.createTable.bind(cache)).toThrow();
      });
    });

    describe('when a schemaBuilder property is assigned', function() {
      describe('when no tableName property is assigned', function() {
        it('throws an exception', function() {
          var cache = Object.create(LocalResource)
            .setSchemaBuilder(getSchemaBuilder())
            .setStoreType(lf.schema.DataStoreType.MEMORY);

          expect(cache.createTable.bind(cache)).toThrow();
        });
      });

      describe('when a tableName property is assigned', function() {
        it('adds an IndexedDB table', function() {
          var cache = Object.create(LocalResource)
            .setSchemaBuilder(getSchemaBuilder())
            .setTableName('my_table')
            .setStoreType(lf.schema.DataStoreType.MEMORY);

          expect(cache.createTable.bind(cache)).not.toThrow();
        });
      });
    });
  });

  describe('#fetchAll', function() {
    it('returns all records in the table', function(done) {
      var cache = Object.create(LocalResource)
        .setSchemaBuilder(getSchemaBuilder())
        .setTableName('my_table')
        .setStoreType(lf.schema.DataStoreType.MEMORY)
      cache.createTable();
      var connection = cache.connectToDb();
      cache.persist(connection, {}).then(function(records) {
        var id = records[0].id;
        cache.fetchAll(connection).then(function(records) {
          if (records[0].id === id) {
            connection.then(function(db) {
              db.close();
              done();
            });
          } else {
            done.fail('record should be returned');
          }
        });
      });
    });
  });
});
