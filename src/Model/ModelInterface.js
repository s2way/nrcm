/*jslint devel: true, node: true, indent: 4 */
'use strict';
/*
 * Dependencies
 */
var CouchbaseInterface = require('./Interface/CouchbaseInterface');
var MySQLInterface = require('./Interface/MySQLInterface');
var ElasticsearchInterface = require('./Interface/ElasticsearchInterface');

var exceptions = require('./../exceptions');

function ModelInterface(dataSource, configurations) {
    var type = dataSource.type ? dataSource.type.toLowerCase() : null;
    this.dataSource = dataSource;
    if (type === 'couchbase') {
        this._model = new CouchbaseInterface(dataSource, configurations);
    } else if (type === 'mysql') {
        this._model = new MySQLInterface(dataSource, configurations);
    } else if (type === 'elasticsearch') {
        this._model = new ElasticsearchInterface(dataSource, configurations);
    } else {
        throw new exceptions.IllegalArgument('Invalid DataSource type: ' + dataSource.type);
    }
    this.methods = this._model.methods;
    this.mockMethods = this._model.mockMethods;
}

module.exports = ModelInterface;
