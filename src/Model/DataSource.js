/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256 */
'use strict';
var exceptions = require('./../exceptions');
var logger = require('./../Util/logger');

/**
 * DataSource object, the datasource is persistent and last the whole request
 *
 * @constructor
 * @method DataSource
 * @param {string} name ?
 * @param {json} configs The json with the database parameters
 */
function DataSource(name, configs) {
    if (typeof configs !== 'object' ||
            typeof configs.host !== 'string' ||
            typeof configs.port !== 'string' ||
            typeof configs.type !== 'string') {
        throw new exceptions.IllegalArgument('Invalid DataSource configurations');
    }
    this.name = name;
    this.host = configs.host;
    this.port = configs.port;
    this.type = configs.type;
    this.index = configs.index;

    if (typeof this.index !== 'string') {
        this.index = 'default';
    }

    this.connection = null;
    // This is necessary for Travis
    try {
        this.couchbase = require('couchbase');
    } catch (e) {
        console.log(e);
        return;
    }
}

// Log
DataSource.prototype.info = function (msg) {
    logger.info('[DataSource] [' + this.name + '] ' + msg);
};
DataSource.prototype.debug = function (msg) {
    logger.info('[DataSource] [' + this.name + '] ' + msg);
};

/**
 * Establish a connection with the database
 *
 * @method connect
 * @param {function} onSuccess Callback for the success
 * @param {function} onError Callback for the error
 */
DataSource.prototype.connect = function (onSuccess, onError) {
    var $this = this;
    if (typeof onSuccess !== 'function' ||
            typeof onError !== 'function') {
        throw new exceptions.IllegalArgument('DataSource.connect() onSuccess and onError must be functions');
    }
    if (this.connection !== null) {
        this.info('Recycling connection');
        onSuccess(this.connection);
        return;
    }
    if (this.type === 'Couchbase') {
        this.info('Connecting to ' + this.host + ':' + this.port);
        var connection = new this.couchbase.Connection({
            'host' : this.host + ':' + this.port,
            'bucket' : this.index
        }, function (error) {
            $this.connection = connection;
            if (error) {
                $this.info('Connection error: ' + error);
                onError(error);
            } else {
                $this.info('Connection successful');
                onSuccess(connection);
            }
        });
    } else {
        onError();
    }
};

/**
 * Disconnect from the database
 *
 * @method disconnect
 */
DataSource.prototype.disconnect = function () {
    if (this.connection !== null) {
        if (this.type === 'Couchbase') {
            this.info('Disconnecting');
            this.connection.shutdown();
            this.info('Disconnected');
            this.connection = null;
        }
    }
};

module.exports = DataSource;
