'use strict';

var LocalResource = cbit.LocalResource;

describe('LocalResource', function() {
  var DB_NAME = 'app_test';

  function getSchemaBuilder() {
    return lf.schema.create(DB_NAME, 1);
  }

  function getCache() {
    var cache = Object.create(LocalResource)
                      .setSchemaBuilder(getSchemaBuilder())
                      .setTableName('my_table')
                      .setStoreType(lf.schema.DataStoreType.MEMORY);
    cache.createTable();

    return cache;
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
      var cache = getCache();
      cache.persist({}).then(function(records) {
        var id = records[0].id;
        cache.fetchAll().then(function(records) {
          if (records[0].id === id) {
            cache.getDbConnection().then(function(db) {
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

  describe('#persist', function() {
    it('stores a record in the database', function(done) {
      var cache = getCache();
      cache.persist({ foo: 'bar' }).then(function(records) {
        if (records.length === 1 &&
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
