/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256, nomen: true */
'use strict';
var exceptions = require('./../exceptions.js');
var Validator = require('./Validator.js');
var SchemaMatcher = require('./SchemaMatcher.js');
var utils = require('./utils.js');
var util = require('util');
var ModelTrigger = require('./ModelTrigger');
var logger = require('../Util/logger');

function MySQLInterface(dataSource, configurations) {
    if (dataSource === undefined) {
        throw new exceptions.IllegalArgument('Invalid DataSource');
    }
    if (configurations === undefined) {
        throw new exceptions.IllegalArgument('The configurations parameter is mandatory');
    }
    this.dataSource = dataSource;
    // Methods that are going to be injected into the model (prefixed with $)
    this.methods = ['query', 'use'];
}

MySQLInterface.prototype.info = function (msg) {
    logger.info('[MySQLInterface] ' + msg);
};

MySQLInterface.prototype.query = function (query, params, callback) {
    this.dataSource.connect(function (connection) {
        connection.query(query, params, callback);
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

module.exports = MySQLInterface;