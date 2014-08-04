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
            typeof configs.type !== 'string') {
        throw new exceptions.IllegalArgument('Invalid DataSource configurations');
    }
    this.name = name;
    // General
    this.host = configs.host;
    this.port = configs.port;
    this.type = configs.type;
    // Couchbase specific
    this.index = configs.index;
    // MySQL specific
    this.user = configs.user;
    this.password = configs.password;

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
    this.mysql = require('mysql');
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
    var connection;
    if (typeof onSuccess !== 'function' ||
            typeof onError !== 'function') {
        throw new exceptions.IllegalArgument('DataSource.connect() onSuccess and onError must be functions');
    }
    if (this.connection !== null) {
        this.info('Recycling connection');
        onSuccess(this.connection);
        return;
    }
    this.info('Connecting to ' + this.host + ':' + this.port);
    if (this.type === 'Couchbase') {
        connection = new this.couchbase.Connection({
            'host' : this.host + ':' + this.port,
            'bucket' : this.index
        }, function (error) {
            if (error) {
                $this.info('Connection error: ' + error);
                onError(error);
            } else {
                $this.connection = connection;
                $this.info('Connection successful');
                onSuccess(connection);
            }
        });
    } else if (this.type === 'MySQL') {
        connection = this.mysql.createConnection({
            'host': this.host,
            'user': this.user,
            'password': this.password
        });
        connection.connect(function (error) {
            if (error) {
                $this.info('Connection error: ' + error);
                onError(error);
            } else {
                $this.connection = connection;
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
        this.info('Disconnecting');
        if (this.type === 'Couchbase') {
            this.connection.shutdown();
        } else if (this.type === 'MySQL') {
            this.connection.end();
        }
        this.connection = null;
        this.info('Disconnected');
    }
};

module.exports = DataSource;
