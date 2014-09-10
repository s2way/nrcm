'use strict';
var exceptions = require('../../../exceptions');

function Couchbase(dataSourceName) {
    dataSourceName = dataSourceName || 'default';
    this._couchbase = require('couchbase');
    this._connection = null;
    this._dataSourceName = dataSourceName;
}

/**
 * Logging method
 * @param {string} msg The log message
 */
Couchbase.prototype.info = function (msg) {
    this.logger.info('[Couchbase] ' + msg);
};

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
 * Connects to the database or returns the same connection object
 * @param callback Calls the callback passing an error or the connection object if successful
 * @private
 */
Couchbase.prototype.connect = function (callback) {
    if (this._connection !== null) {
        callback(null, this._connection);
        return;
    }
    var $this = this, connection;
    connection = new this._couchbase.Connection({
        'host': this.host + ':' + this.port,
        'bucket': this.index
    }, function (error) {
        if (error) {
            $this.info('Connection error: ' + error);
            callback(error);
        } else {
            $this.info('Connection successful');
            $this._connection = connection;
            callback(null, connection);
        }
    });
};

Couchbase.prototype.destroy = function () {
    this.info('Shutting down connections');
    if (this._connection !== null) {
        this._connection.shutdown();
    }
};

module.exports = Couchbase;