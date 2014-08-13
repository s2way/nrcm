/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256, nomen: true */
'use strict';
var exceptions = require('./../exceptions.js');
var Validator = require('./Validator.js');
var SchemaMatcher = require('./SchemaMatcher.js');
var utils = require('./utils.js');
var util = require('util');
var ModelTrigger = require('./ModelTrigger');
var QueryBuilder = require('./QueryBuilder');

function MySQLInterface(dataSource, configurations) {
    if (dataSource === undefined) {
        throw new exceptions.IllegalArgument('Invalid DataSource');
    }
    if (configurations === undefined) {
        throw new exceptions.IllegalArgument('The configurations parameter is mandatory');
    }
    this.dataSource = dataSource;
    // Methods that are going to be injected into the model (prefixed with $)
    this.methods = ['query', 'use', 'call', 'builder'];
    // Methods that should be mocked
    this.mockMethods = ['query', 'use', 'call'];
    // Database name
    this.database = configurations.database || dataSource.database;
    // Database selected
    this.databaseSelected = false;
}

MySQLInterface.prototype.builder = function () {
    if (this.queryBuilder === undefined) {
        this.queryBuilder = new QueryBuilder();
    }
    return this.queryBuilder;
};

MySQLInterface.prototype.query = function (query, params, callback) {
    var $this = this;
    this.dataSource.connect(function (connection) {
        if (!$this.databaseSelected && $this.database !== undefined) {
            $this.use($this.database, function (error) {
                if (error) {
                    callback(error);
                } else {
                    $this.databaseSelected = true;
                    connection.query(query, params, callback);
                }
            });
        } else {
            connection.query(query, params, callback);
        }
    }, function (error) {
        callback(error);
    });
};

MySQLInterface.prototype.use = function (database, callback) {
    this.dataSource.connect(function (connection) {
        connection.query('USE ' + connection.escapeId(database) + ';', function (error) {
            if (error) {
                callback(error);
            } else {
                callback();
            }
        });
    }, function (error) {
        callback(error);
    });
};

MySQLInterface.prototype.call = function (procedure, params, callback) {
    if (typeof procedure !== 'string') {
        throw new exceptions.IllegalArgument('The procedure parameter is mandatory');
    }

    this.dataSource.connect(function (connection) {
        var paramsString = '';
        var i;
        for (i = 0; i < params.length; i += 1) {
            if (paramsString !== '') {
                paramsString += ', ';
            }
            paramsString += '?';
        }
        connection.query('CALL ' + connection.escapeId(procedure) + '(' + paramsString + ')', params, callback);
    }, function (error) {
        callback(error);
    });
};

module.exports = MySQLInterface;