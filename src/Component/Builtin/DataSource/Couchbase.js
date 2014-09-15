'use strict';
var exceptions = require('../../../exceptions');

function Couchbase(dataSourceName) {
    dataSourceName = dataSourceName || 'default';
    this._couchbase = require('couchbase');
    this._dataSourceName = dataSourceName;
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
 */
Couchbase.prototype.connect = function () {
    var cluster = new this._couchbase.Cluster(this.host + ':' + this.port);
    return cluster.openBucket(this.index);
};

module.exports = Couchbase;
