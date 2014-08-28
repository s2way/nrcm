/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256 */
'use strict';
var exceptions = require('./../exceptions');

/**
 * DataSource object, the data source is persistent and last the whole request
 *
 * @constructor
 * @method DataSource
 * @param {object} logger The logger which will be used by the DataSource
 * @param {string} name The name of the DataSource as specified in the configuration file
 * @param {object} configs
 */
function DataSource(logger, name, configs) {
    if (typeof configs !== 'object' ||
            typeof configs.type !== 'string') {
        throw new exceptions.IllegalArgument('Invalid DataSource configurations');
    }
    var validTypes = ['couchbase', 'mysql', 'elasticsearch'];

    this.logger = logger;
    this.name = name;

    (function copyDataSourceConfigs($this) {
        var configProp;
        for (configProp in configs) {
            if (configs.hasOwnProperty(configProp)) {
                $this[configProp] = configs[configProp];
            }
        }
    }(this));

    if (this.type) {
        this.type = this.type.toLowerCase();
    }

    if (typeof this.index !== 'string') {
        this.index = 'default';
    }

    (function loadDataSourceModule($this) {
        $this.connection = null;
        if (validTypes.indexOf($this.type) !== -1) {
            try {
                /* This is necessary for Travis */
                $this[$this.type] = require($this.type);
            } catch (e) {
                console.log(e);
                return;
            }
        }
    }(this));
}

DataSource.prototype.info = function (msg) {
    this.logger.info('[DataSource] [' + this.name + '] ' + msg);
};
DataSource.prototype.debug = function (msg) {
    this.logger.info('[DataSource] [' + this.name + '] ' + msg);
};

/**
 * Establish a connection with the database
 *
 * @method connect
 * @param {function} onSuccess Callback for success
 * @param {function} onError Callback for the
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
    if (this.type === 'couchbase') {
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
    } else if (this.type === 'mysql') {
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
    } else if (this.type === 'elasticsearch') {
        connection = new this.elasticsearch.Client({
            'host' : this.host + ':' + this.port,
            'log' : 'trace'
        });
        this.connection = connection;
        onSuccess();
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
    var isConnected = this.connection !== null;
    var isCouchbase = this.type === 'couchbase';
    var isMySQL = this.type === 'mysql';

    if (isConnected) {
        this.info('Disconnecting');
        if (isCouchbase) {
            this.connection.shutdown();
        } else if (isMySQL) {
            this.connection.end();
        }
        this.connection = null;
        this.info('Disconnected');
    }
};

module.exports = DataSource;
