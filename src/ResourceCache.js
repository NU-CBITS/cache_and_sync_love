(function(context) {
  'use strict';

  var ResourceCache = {
    storeType: lf.schema.DataStoreType.INDEXED_DB,

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

    getTable: function getTable(db) {
      return db.getSchema().table(this.tableName);
    },

    createTable: function createTable() {
      return this.schemaBuilder
        .createTable(this.tableName)
        .addColumn('uuid', lf.Type.STRING)
        .addPrimaryKey(['uuid'])
        .addColumn('is_dirty', lf.Type.BOOLEAN)
        .addColumn('created_at', lf.Type.DATE_TIME)
        .addColumn('updated_at', lf.Type.DATE_TIME);
    },

    markClean: function markClean(recordUuids) {
      return this.getDbConnection().then((function(db) {
        var table = this.getTable(db);

        return db
          .update(table)
          .set(table.is_dirty, false)
          .where(table.uuid.in(recordUuids))
          .exec();
      }).bind(this));
    },

    fetch: function fetch(recordUuid) {
     return this.getDbConnection().then((function(db) {
       var table = this.getTable(db);
        
       return db.select().from(table).where(table.uuid.eq(recordUuid)).exec();
      }).bind(this));
    },

    fetchAll: function fetchAll() {
      return this.getDbConnection().then((function(db) {
        return db.select().from(this.getTable(db)).exec();
      }).bind(this));
    },

    fetchAllDirty: function fetchAllDirty() {
      return this.getDbConnection().then((function(db) {
        var table = this.getTable(db);
        
        return db.select().from(table).where(table.is_dirty.eq(true)).exec()
                 .then(function(dirtyRecords) {
                   return dirtyRecords.map(function(dirtyRecord) {
                     delete dirtyRecord.is_dirty;

                     return dirtyRecord;
                    });
                 });
      }).bind(this));
    },

    persist: function persist(record) {
      return this.getDbConnection().then((function(db) {
        var table = this.getTable(db),
            dirtyRecord = Object.create(record);
        dirtyRecord.uuid = cbit.uuid();
        dirtyRecord.created_at = new Date();
        dirtyRecord.updated_at = new Date();
        dirtyRecord.is_dirty = true;
        var row = table.createRow(dirtyRecord);

        return db.insert().into(table).values([row]).exec();
      }).bind(this));
    }
  };

  context.cbit = context.cbit || {};
  context.cbit.ResourceCache = ResourceCache;
})(this);
