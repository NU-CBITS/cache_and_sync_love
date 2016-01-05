(function(context) {
  'use strict';

  var LocalResource = {
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

    connectToDb: function connectToDb() {
      return this.schemaBuilder.connect({
        storeType: this.storeType
      });
    },

    getTable: function getTable(db) {
      return db.getSchema().table(this.tableName);
    },

    createTable: function createTable() {
      var isAutoIncrementing = true;

      return this.schemaBuilder
        .createTable(this.tableName)
        .addColumn('id', lf.Type.INTEGER)
        .addPrimaryKey(['id'], isAutoIncrementing);
    },

    fetchAll: function fetchAll(connection) {
      return connection.then((function(db) {
        return db.select().from(this.getTable(db)).exec();
      }).bind(this));
    },

    persist: function persist(connection, record) {
      return connection.then((function(db) {
        var table = this.getTable(db);
        var row = table.createRow(record);

        return db.insert().into(table).values([row]).exec();
      }).bind(this));
    }
  };

  context.cbit = context.cbit || {};
  context.cbit.LocalResource = LocalResource;
})(this);
