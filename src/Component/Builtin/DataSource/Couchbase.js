'use strict';
var exceptions = require('../../../exceptions');

function Couchbase(dataSourceName) {
    dataSourceName = dataSourceName || 'default';
    this._couchbase = require('couchbase');
    this._dataSourceName = dataSourceName;
    this.ViewQuery = this._couchbase.ViewQuery;
}

/**
 * Component initialization
 * Check if the data source specified in the constructor exists
 */
Couchbase.prototype.init = function () {
    this._dataSource = this.core.dataSources[this._dataSourceName];
    if (!this._dataSource) {
        throw new exceptions.IllegalArgument("Couldn't find data source '" + this._dataSourceName + "'. Take a look at your core.json.");
    }
};

/**
 * Connects to the database or returns the bucket object
 * @param {function} callback
 */
Couchbase.prototype.connect = function (callback) {
    var cluster, db;
    cluster = new this._couchbase.Cluster(this._dataSource.host + ':' + this._dataSource.port);
    db = cluster.openBucket(this._dataSource.bucket);
    db.on('connect', function (error) {
        callback(error, db);
    });
    db.on('error', function (error) {
        callback(error);
    });
};

module.exports = Couchbase;
