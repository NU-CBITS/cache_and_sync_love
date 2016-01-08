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

    createTable: function createTable() {
      var isAutoIncrementing = true;

      return this.schemaBuilder
        .createTable(this.tableName)
        .addColumn('id', lf.Type.INTEGER)
        .addPrimaryKey(['id'], isAutoIncrementing);
    },

    fetchAll: function fetchAll() {
      return this.getDbConnection().then((function(db) {
        return db.select().from(this.getTable()).exec();
      }).bind(this));
    },

    persist: function persist(record) {
      return this.getDbConnection().then((function(db) {
        var table = this.getTable();
        var row = table.createRow(record);

        return db.insert().into(table).values([row]).exec();
      }).bind(this));
    }
  };

  context.cbit = context.cbit || {};
  context.cbit.LocalResource = LocalResource;
})(this);
