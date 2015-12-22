(function(context) {
  'use strict';

  var ResourceCache = {
    storeType: lf.schema.DataStoreType.INDEXED_DB,

    setStoreType: function setStoreType(type) {
      this.storeType = type;
    },

    setSchemaBuilder: function setSchemaBuilder(schemaBuilder) {
      this.schemaBuilder = schemaBuilder;
    },

    setTableName: function setTableName(name) {
      this.tableName = name;
    },

    connectToDb: function connectToDb() {
      return this.schemaBuilder.connect({
        storeType: this.storeType
      });
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

    markClean: function markClean(connection, recordUuid) {
      return connection.then((function(db) {
        var table = this.getTable(db);

        return db
          .update(table)
          .set(table.is_dirty, false)
          .where(table.uuid.eq(recordUuid))
          .exec();
      }).bind(this));
    },

    fetch: function fetch(connection, recordUuid) {
     return connection.then((function(db) {
       var table = this.getTable(db);
        
       return db.select().from(table).where(table.uuid.eq(recordUuid)).exec();
      }).bind(this));
    },

    fetchAll: function fetchAll(connection) {
      return connection.then((function(db) {
        return db.select().from(this.getTable(db));
      }).bind(this));
    },

    fetchAllDirty: function fetchAllDirty(connection) {
      return connection.then((function(db) {
        var table = this.getTable(db);
        
        return db.select().from(table).where(table.is_dirty.eq(true));
      }).bind(this));
    },

    persist: function persist(connection, record) {
      return connection.then((function(db) {
        var table = this.getTable(db),
            dirtyRecord = Object.create(record);
        dirtyRecord.uuid = uuid();
        dirtyRecord.created_at = new Date();
        dirtyRecord.updated_at = new Date();
        dirtyRecord.is_dirty = true;
        var row = table.createRow(dirtyRecord);

        return db.insert().into(table).values([row]).exec();
      }).bind(this));
    }
  };

  context.ResourceCache = ResourceCache;
})(this);
