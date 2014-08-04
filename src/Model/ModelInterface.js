/*jslint devel: true, node: true, indent: 4 */
'use strict';
/*
 * Dependencies
 */
var CouchbaseInterface = require('./CouchbaseInterface');
var MySQLInterface = require('./MySQLInterface');

var exceptions = require('./../exceptions');

function ModelInterface(dataSource, configurations) {
    this.dataSource = dataSource;
    if (dataSource.type === 'Couchbase') {
        this._model = new CouchbaseInterface(dataSource, configurations);
    } else if (dataSource.type === 'MySQL') {
        this._model = new MySQLInterface(dataSource, configurations);
    } else {
        throw new exceptions.IllegalArgument('Invalid DataSource type: ' + dataSource.type);
    }
    this.methods = this._model.methods;
}

module.exports = ModelInterface;
