(function(context) {
  'use strict';

  function cloneRecord(record) {
    var newRecord = {};

    for (var attr in record) {
      if (record.hasOwnProperty(attr)) {
        newRecord[attr] = record[attr];
      }
    }

    return newRecord;
  }

  var PersistedResource = {
    storeType: context.lf.schema.DataStoreType.INDEXED_DB,

    setStoreType: function setStoreType(type) {
      this.storeType = type;

      return this;
    },

    setSchemaBuilder: function setSchemaBuilder(schemaBuilder) {
      this.schemaBuilder = schemaBuilder;

      return this;
    },

    setTableName: function setTableName(name) {
      this.tableName = name;

      return this;
    },

    dbConnection: null,

    getDbConnection: function getDbConnection() {
      if (this.dbConnection == null) {
        this.dbConnection = this.schemaBuilder.connect({
          storeType: this.storeType
        });
      }

      return this.dbConnection;
    },

    getTable: function getTable() {
      return this.schemaBuilder.getSchema().table(this.tableName);
    },

    fetch: function fetch(recordUuid) {
     return this.getDbConnection().then((function(db) {
       var table = this.getTable();
        
       return db.select().from(table).where(table.uuid.eq(recordUuid)).exec();
      }).bind(this));
    },

    fetchAll: function fetchAll() {
      return this.getDbConnection().then((function(db) {
        return db.select().from(this.getTable()).exec();
      }).bind(this));
    }
  };

  var ResourceCache = Object.create(PersistedResource);

  ResourceCache.createTable = function createTable() {
    return this.schemaBuilder
      .createTable(this.tableName)
      .addColumn('uuid', lf.Type.STRING)
      .addPrimaryKey(['uuid'])
      .addColumn('is_dirty', lf.Type.BOOLEAN)
      .addColumn('created_at', lf.Type.DATE_TIME)
      .addColumn('updated_at', lf.Type.DATE_TIME);
  };

  ResourceCache.markClean = function markClean(recordUuids) {
    return this.getDbConnection().then((function(db) {
      var table = this.getTable();

      return db
        .update(table)
        .set(table.is_dirty, false)
        .where(table.uuid.in(recordUuids))
        .exec();
    }).bind(this));
  };

  ResourceCache.fetchAllDirty = function fetchAllDirty() {
    return this.getDbConnection().then((function(db) {
      var table = this.getTable();
      
      return db.select().from(table).where(table.is_dirty.eq(true)).exec()
               .then(function(dirtyRecords) {
                 return dirtyRecords.map(function(dirtyRecord) {
                   delete dirtyRecord.is_dirty;

                   return dirtyRecord;
                  });
               });
    }).bind(this));
  };

  ResourceCache.persist = function persist(record) {
    return this.getDbConnection().then((function(db) {
      var table = this.getTable(),
          dirtyRecord = cloneRecord(record);
      dirtyRecord.uuid = cbit.uuid();
      dirtyRecord.created_at = new Date();
      dirtyRecord.updated_at = new Date();
      dirtyRecord.is_dirty = true;
      var row = table.createRow(dirtyRecord);

      return db.insert().into(table).values([row]).exec();
    }).bind(this));
  };

  var LocalResource = Object.create(PersistedResource);

  LocalResource.createTable = function createTable() {
    var isAutoIncrementing = true;

    return this.schemaBuilder
      .createTable(this.tableName)
      .addColumn('id', lf.Type.INTEGER)
      .addPrimaryKey(['id'], isAutoIncrementing);
  };

  LocalResource.persist = function persist(record) {
    return this.getDbConnection().then((function(db) {
      var table = this.getTable();
      var row = table.createRow(record);

      return db.insert().into(table).values([row]).exec();
    }).bind(this));
  };

  context.cbit = context.cbit || {};
  context.cbit.ResourceCache = ResourceCache;
  context.cbit.LocalResource = LocalResource;
})(this);
