'use strict';

var exceptions = require('../../../exceptions');

/**
 * MySQL DataSource component
 * @param {string} dataSourceName The name of the DataSource defined in the application core.json
 * @constructor
 */
function MySQL(dataSourceName) {
    this._mysql = require('mysql');
    this._dataSourceName = dataSourceName;
    this._connection = null;
    this._databaseSelected = false;
    if (!dataSourceName) {
        this._dataSource = 'default';
    }
}

/**
 * Component initialization
 * Validates if the DataSource exists
 */
MySQL.prototype.init = function () {
    var dataSource = this.core.dataSources[this._dataSourceName];

    if (!this._dataSourceName || dataSource === undefined) {
        throw new exceptions.IllegalArgument('Invalid DataSource');
    }

    this._dataSource = dataSource;
};

/**
 * Logging method
 * @param {string} msg The log message
 */
MySQL.prototype.info = function (msg) {
    this.logger.info('[MySQL] ' + msg);
};

/**
 * Connects to the database or returns the same connection object
 * @param callback Calls the callback passing an error or the connection object if successful
 * @private
 */
MySQL.prototype._connect = function (callback) {
    if (this._connection !== null) {
        this.info('Recycling connection');
        callback(null, this._connection);
        return;
    }

    var $this = this;
    var connection = this._mysql.createConnection({
        'host': this._dataSource.host + ':' + this._dataSource.port,
        'user': this._dataSource.user,
        'password': this._dataSource.password
    });
    connection.connect(function (error) {
        if (error) {
            callback(error);
        } else {
            $this._connection = connection;
            $this.info('Connection successful');
            callback(null, connection);
        }
    });
};

/**
 * Shutdowns the connection
 */
MySQL.prototype.destroy = function () {
    var $this = this;
    (function shutdownConnection() {
        $this.info('Shutting down connection...');
        if ($this._connection !== null) {
            $this._connection.end();
        }
    }());
};

MySQL.prototype.query = function (query, params, callback) {
    var $this = this;
    this._connect(function (error, connection) {
        if (error) {
            callback(error);
            return;
        }
        if (!$this._databaseSelected) {
            $this.use($this._dataSource.database, function (error) {
                if (error) {
                    callback(error);
                    return;
                }
                $this._databaseSelected = true;
                connection.query(query, params, callback);
            });
            return;
        }
        connection.query(query, params, callback);
    });
};

MySQL.prototype.use = function (database, callback) {
    this._connect(function (error, connection) {
        if (error) {
            callback(error);
            return;
        }
        connection.query('USE ' + connection.escapeId(database) + ';', function (error) {
            if (error) {
                callback(error);
            } else {
                callback();
            }
        });
    });
};

MySQL.prototype.call = function (procedure, params, callback) {
    if (typeof procedure !== 'string') {
        throw new exceptions.IllegalArgument('The procedure parameter is mandatory');
    }

    this._connect(function (error, connection) {
        if (error) {
            callback(error);
            return;
        }
        var paramsString = '';
        var i;
        for (i = 0; i < params.length; i += 1) {
            if (paramsString !== '') {
                paramsString += ', ';
            }
            paramsString += '?';
        }
        connection.query('CALL ' + connection.escapeId(procedure) + '(' + paramsString + ')', params, callback);
    });
};


module.exports = MySQL;