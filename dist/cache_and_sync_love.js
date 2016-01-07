(function(context) {
    "use strict";
    function post(url, data) {
        return new Promise(function(resolve, reject) {
            var request = new XMLHttpRequest();
            request.onload = function onload() {
                if (request.status === 201) {
                    try {
                        var responseObject = JSON.parse(request.response);
                        resolve(responseObject);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(Error(request.statusText));
                }
            };
            request.onerror = function onerror() {
                reject(Error("Network Error"));
            };
            request.ontimeout = function ontimeout() {
                reject(Error("Network Error"));
            };
            request.open("POST", url);
            request.setRequestHeader("Content-Type", "application/json");
            request.send(context.JSON.stringify(data));
        });
    }
    var AuthenticationTokensResource = {
        setUrl: function setUrl(url) {
            this.url = url;
            return this;
        },
        setClientUuid: function setClientUuid(clientUuid) {
            this.clientUuid = clientUuid;
            return this;
        },
        create: function create(configurationToken) {
            return post(this.url, {
                configurationToken: configurationToken,
                data: {
                    type: "authenticationTokens",
                    clientUuid: this.clientUuid
                }
            });
        }
    };
    context.cbit = context.cbit || {};
    context.cbit.AuthenticationTokensResource = AuthenticationTokensResource;
})(this);

(function(context) {
    "use strict";
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
        getTable: function getTable() {
            return this.schemaBuilder.getSchema().table(this.tableName);
        },
        createTable: function createTable() {
            var isAutoIncrementing = true;
            return this.schemaBuilder.createTable(this.tableName).addColumn("id", lf.Type.INTEGER).addPrimaryKey([ "id" ], isAutoIncrementing);
        },
        fetchAll: function fetchAll(connection) {
            return connection.then(function(db) {
                return db.select().from(this.getTable()).exec();
            }.bind(this));
        },
        persist: function persist(connection, record) {
            return connection.then(function(db) {
                var table = this.getTable();
                var row = table.createRow(record);
                return db.insert().into(table).values([ row ]).exec();
            }.bind(this));
        }
    };
    context.cbit = context.cbit || {};
    context.cbit.LocalResource = LocalResource;
})(this);

(function(context) {
    "use strict";
    function nonce() {
        function randomFixedLengthInteger(length) {
            return Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1));
        }
        return randomFixedLengthInteger(NONCE_DIGITS);
    }
    var NONCE_DIGITS = 12;
    var Payload = {
        setKey: function setKey(key) {
            this.key = key;
            return this;
        },
        setData: function setData(data) {
            this.data = data;
            return this;
        },
        getDataStringified: function getDataStringified() {
            if (this.data == null) {
                return "";
            }
            return JSON.stringify(this.data);
        },
        setUrl: function setUrl(url) {
            this.url = url;
            return this;
        },
        setMethod: function setMethod(httpMethod) {
            this.httpMethod = httpMethod;
            return this;
        },
        setSecret: function setSecret(secret) {
            this.secret = secret;
            return this;
        },
        getNonce: function getNonce() {
            this.nonce = this.nonce || nonce();
            return this.nonce;
        },
        getTimestamp: function getTimestamp() {
            this.timestamp = this.timestamp || new Date().valueOf();
            return this.timestamp;
        },
        signature: function signature() {
            return md5(this.getDataStringified() + this.key + this.getNonce() + this.getTimestamp() + this.url + this.httpMethod + this.secret);
        },
        toHeader: function toHeader() {
            return {
                Authorization: 'key="' + this.key + '"' + ",nonce=" + this.getNonce() + ",timestamp=" + this.getTimestamp() + ',url="' + this.url + '"' + ',method="' + this.httpMethod + '"' + ',signature="' + this.signature() + '"'
            };
        }
    };
    context.cbit = context.cbit || {};
    context.cbit.Payload = Payload;
})(this);

(function(context) {
    "use strict";
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
        connectToDb: function connectToDb() {
            return this.schemaBuilder.connect({
                storeType: this.storeType
            });
        },
        getTable: function getTable(db) {
            return db.getSchema().table(this.tableName);
        },
        createTable: function createTable() {
            return this.schemaBuilder.createTable(this.tableName).addColumn("uuid", lf.Type.STRING).addPrimaryKey([ "uuid" ]).addColumn("is_dirty", lf.Type.BOOLEAN).addColumn("created_at", lf.Type.DATE_TIME).addColumn("updated_at", lf.Type.DATE_TIME);
        },
        markClean: function markClean(connection, recordUuids) {
            return connection.then(function(db) {
                var table = this.getTable(db);
                return db.update(table).set(table.is_dirty, false).where(table.uuid.in(recordUuids)).exec();
            }.bind(this));
        },
        fetch: function fetch(connection, recordUuid) {
            return connection.then(function(db) {
                var table = this.getTable(db);
                return db.select().from(table).where(table.uuid.eq(recordUuid)).exec();
            }.bind(this));
        },
        fetchAll: function fetchAll(connection) {
            return connection.then(function(db) {
                return db.select().from(this.getTable(db)).exec();
            }.bind(this));
        },
        fetchAllDirty: function fetchAllDirty(connection) {
            return connection.then(function(db) {
                var table = this.getTable(db);
                return db.select().from(table).where(table.is_dirty.eq(true)).exec();
            }.bind(this));
        },
        persist: function persist(connection, record) {
            return connection.then(function(db) {
                var table = this.getTable(db), dirtyRecord = Object.create(record);
                dirtyRecord.uuid = cbit.uuid();
                dirtyRecord.created_at = new Date();
                dirtyRecord.updated_at = new Date();
                dirtyRecord.is_dirty = true;
                var row = table.createRow(dirtyRecord);
                return db.insert().into(table).values([ row ]).exec();
            }.bind(this));
        }
    };
    context.cbit = context.cbit || {};
    context.cbit.ResourceCache = ResourceCache;
})(this);

(function(context) {
    "use strict";
    function markCacheRecordsClean(response) {
        var cache;
        if (response.data.length === 0) {
            return;
        }
        cache = Synchronizer.getCache(response.data[0].type);
        if (!cache) {
            return;
        }
        cache.markClean(this.connection, response.data.map(function(d) {
            return d.uuid;
        }));
    }
    function persistData(dirtyData) {
        return this.payload.persist(dirtyData);
    }
    function collectDirtyData(cache) {
        return cache.fetchAllDirty(this.connection);
    }
    function persistDirtyData() {
        return Promise.all(this.caches.map(collectDirtyData.bind(this))).then(persistData.bind(this)).then(markCacheRecordsClean.bind(this));
    }
    function persistClean(datum) {
        var cache = Synchronizer.getCache(datum.type);
        if (cache) {
            cache.persist(this.connection, datum);
            cache.markClean(this.connection, datum.uuid);
        }
    }
    function fetchData() {
        return this.payload.fetch().then(function(response) {
            response.data.forEach(persistClean.bind(this));
        }.bind(this));
    }
    var Synchronizer = {
        PERIOD_IN_MS: 30 * 1e3,
        setDbConnection: function setDbConnection(connection) {
            this.connection = connection;
        },
        setNetwork: function setNetwork(network) {
            this.network = network;
        },
        setPayloadResource: function setPayloadResource(payload) {
            this.payload = payload;
        },
        synchronize: function synchronize() {
            if (!this.network.hasConnection()) {
                return;
            }
            return Promise.all([ persistDirtyData.bind(this)(), fetchData.bind(this)() ]);
        },
        run: function run() {
            this.synchronize();
            context.setInterval(this.run.bind(this), this.PERIOD_IN_MS);
        },
        registerCache: function registerCache(cache) {
            this.cacheTypeIndices[cache.name] = this.caches.length;
            this.caches.push(cache);
        },
        getCache: function getCache(type) {
            return this.caches[this.cacheTypeIndices[type]];
        },
        resetCaches: function resetCaches() {
            this.caches = [];
            this.cacheTypeIndices = {};
        }
    };
    Synchronizer.resetCaches();
    context.cbit = context.cbit || {};
    context.cbit.Synchronizer = Synchronizer;
})(this);

(function(context) {
    "use strict";
    function uuid() {
        function replacement(c) {
            var r = Math.random() * 16 | 0, v = c === "x" ? r : r & 3 | 8;
            return v.toString(16);
        }
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, replacement);
    }
    context.cbit = context.cbit || {};
    context.cbit.uuid = uuid;
})(this);

!function(a) {
    "use strict";
    function b(a, b) {
        var c = (65535 & a) + (65535 & b), d = (a >> 16) + (b >> 16) + (c >> 16);
        return d << 16 | 65535 & c;
    }
    function c(a, b) {
        return a << b | a >>> 32 - b;
    }
    function d(a, d, e, f, g, h) {
        return b(c(b(b(d, a), b(f, h)), g), e);
    }
    function e(a, b, c, e, f, g, h) {
        return d(b & c | ~b & e, a, b, f, g, h);
    }
    function f(a, b, c, e, f, g, h) {
        return d(b & e | c & ~e, a, b, f, g, h);
    }
    function g(a, b, c, e, f, g, h) {
        return d(b ^ c ^ e, a, b, f, g, h);
    }
    function h(a, b, c, e, f, g, h) {
        return d(c ^ (b | ~e), a, b, f, g, h);
    }
    function i(a, c) {
        a[c >> 5] |= 128 << c % 32, a[(c + 64 >>> 9 << 4) + 14] = c;
        var d, i, j, k, l, m = 1732584193, n = -271733879, o = -1732584194, p = 271733878;
        for (d = 0; d < a.length; d += 16) i = m, j = n, k = o, l = p, m = e(m, n, o, p, a[d], 7, -680876936), 
        p = e(p, m, n, o, a[d + 1], 12, -389564586), o = e(o, p, m, n, a[d + 2], 17, 606105819), 
        n = e(n, o, p, m, a[d + 3], 22, -1044525330), m = e(m, n, o, p, a[d + 4], 7, -176418897), 
        p = e(p, m, n, o, a[d + 5], 12, 1200080426), o = e(o, p, m, n, a[d + 6], 17, -1473231341), 
        n = e(n, o, p, m, a[d + 7], 22, -45705983), m = e(m, n, o, p, a[d + 8], 7, 1770035416), 
        p = e(p, m, n, o, a[d + 9], 12, -1958414417), o = e(o, p, m, n, a[d + 10], 17, -42063), 
        n = e(n, o, p, m, a[d + 11], 22, -1990404162), m = e(m, n, o, p, a[d + 12], 7, 1804603682), 
        p = e(p, m, n, o, a[d + 13], 12, -40341101), o = e(o, p, m, n, a[d + 14], 17, -1502002290), 
        n = e(n, o, p, m, a[d + 15], 22, 1236535329), m = f(m, n, o, p, a[d + 1], 5, -165796510), 
        p = f(p, m, n, o, a[d + 6], 9, -1069501632), o = f(o, p, m, n, a[d + 11], 14, 643717713), 
        n = f(n, o, p, m, a[d], 20, -373897302), m = f(m, n, o, p, a[d + 5], 5, -701558691), 
        p = f(p, m, n, o, a[d + 10], 9, 38016083), o = f(o, p, m, n, a[d + 15], 14, -660478335), 
        n = f(n, o, p, m, a[d + 4], 20, -405537848), m = f(m, n, o, p, a[d + 9], 5, 568446438), 
        p = f(p, m, n, o, a[d + 14], 9, -1019803690), o = f(o, p, m, n, a[d + 3], 14, -187363961), 
        n = f(n, o, p, m, a[d + 8], 20, 1163531501), m = f(m, n, o, p, a[d + 13], 5, -1444681467), 
        p = f(p, m, n, o, a[d + 2], 9, -51403784), o = f(o, p, m, n, a[d + 7], 14, 1735328473), 
        n = f(n, o, p, m, a[d + 12], 20, -1926607734), m = g(m, n, o, p, a[d + 5], 4, -378558), 
        p = g(p, m, n, o, a[d + 8], 11, -2022574463), o = g(o, p, m, n, a[d + 11], 16, 1839030562), 
        n = g(n, o, p, m, a[d + 14], 23, -35309556), m = g(m, n, o, p, a[d + 1], 4, -1530992060), 
        p = g(p, m, n, o, a[d + 4], 11, 1272893353), o = g(o, p, m, n, a[d + 7], 16, -155497632), 
        n = g(n, o, p, m, a[d + 10], 23, -1094730640), m = g(m, n, o, p, a[d + 13], 4, 681279174), 
        p = g(p, m, n, o, a[d], 11, -358537222), o = g(o, p, m, n, a[d + 3], 16, -722521979), 
        n = g(n, o, p, m, a[d + 6], 23, 76029189), m = g(m, n, o, p, a[d + 9], 4, -640364487), 
        p = g(p, m, n, o, a[d + 12], 11, -421815835), o = g(o, p, m, n, a[d + 15], 16, 530742520), 
        n = g(n, o, p, m, a[d + 2], 23, -995338651), m = h(m, n, o, p, a[d], 6, -198630844), 
        p = h(p, m, n, o, a[d + 7], 10, 1126891415), o = h(o, p, m, n, a[d + 14], 15, -1416354905), 
        n = h(n, o, p, m, a[d + 5], 21, -57434055), m = h(m, n, o, p, a[d + 12], 6, 1700485571), 
        p = h(p, m, n, o, a[d + 3], 10, -1894986606), o = h(o, p, m, n, a[d + 10], 15, -1051523), 
        n = h(n, o, p, m, a[d + 1], 21, -2054922799), m = h(m, n, o, p, a[d + 8], 6, 1873313359), 
        p = h(p, m, n, o, a[d + 15], 10, -30611744), o = h(o, p, m, n, a[d + 6], 15, -1560198380), 
        n = h(n, o, p, m, a[d + 13], 21, 1309151649), m = h(m, n, o, p, a[d + 4], 6, -145523070), 
        p = h(p, m, n, o, a[d + 11], 10, -1120210379), o = h(o, p, m, n, a[d + 2], 15, 718787259), 
        n = h(n, o, p, m, a[d + 9], 21, -343485551), m = b(m, i), n = b(n, j), o = b(o, k), 
        p = b(p, l);
        return [ m, n, o, p ];
    }
    function j(a) {
        var b, c = "";
        for (b = 0; b < 32 * a.length; b += 8) c += String.fromCharCode(a[b >> 5] >>> b % 32 & 255);
        return c;
    }
    function k(a) {
        var b, c = [];
        for (c[(a.length >> 2) - 1] = void 0, b = 0; b < c.length; b += 1) c[b] = 0;
        for (b = 0; b < 8 * a.length; b += 8) c[b >> 5] |= (255 & a.charCodeAt(b / 8)) << b % 32;
        return c;
    }
    function l(a) {
        return j(i(k(a), 8 * a.length));
    }
    function m(a, b) {
        var c, d, e = k(a), f = [], g = [];
        for (f[15] = g[15] = void 0, e.length > 16 && (e = i(e, 8 * a.length)), c = 0; 16 > c; c += 1) f[c] = 909522486 ^ e[c], 
        g[c] = 1549556828 ^ e[c];
        return d = i(f.concat(k(b)), 512 + 8 * b.length), j(i(g.concat(d), 640));
    }
    function n(a) {
        var b, c, d = "0123456789abcdef", e = "";
        for (c = 0; c < a.length; c += 1) b = a.charCodeAt(c), e += d.charAt(b >>> 4 & 15) + d.charAt(15 & b);
        return e;
    }
    function o(a) {
        return unescape(encodeURIComponent(a));
    }
    function p(a) {
        return l(o(a));
    }
    function q(a) {
        return n(p(a));
    }
    function r(a, b) {
        return m(o(a), o(b));
    }
    function s(a, b) {
        return n(r(a, b));
    }
    function t(a, b, c) {
        return b ? c ? r(b, a) : s(b, a) : c ? p(a) : q(a);
    }
    "function" == typeof define && define.amd ? define(function() {
        return t;
    }) : a.md5 = t;
}(this);