# Changelog

## 0.2.0 - 2016-03-18

* fetch recently updated resources
* update README test and build instructions

## 0.1.12 - 2016-03-02

* change created_at and updated_at to client_created_at and client_updated_at

## 0.1.10 - 2016-01-22

* do not mutate returned records from db queries

## 0.1.9 - 2016-01-22

* ensure record cloning works
* refactor LocalResource and ResourceCache
* bump coverage min; create source map
* fix synchronizer repeat so it works
* capture and save errors in synchronization
* avoid transmitting empty payloads
* fix broken API usage; update to work with JSON API
* do not include is_dirty in dirty records selection
* reference tableName in registry and data type prop
