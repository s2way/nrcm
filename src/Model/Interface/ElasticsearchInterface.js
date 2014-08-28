/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256, nomen: true */
'use strict';
var exceptions = require('./../../exceptions.js');
var elasticsearch = require('elasticsearch');

function ElasticsearchInterface(dataSource, configurations) {
    if (dataSource === undefined) {
        throw new exceptions.IllegalArgument('Invalid DataSource');
    }
    if (configurations === undefined) {
        throw new exceptions.IllegalArgument('The configurations parameter is mandatory');
    }

    this.dataSource = dataSource;
    this.methods = ['elasticsearch'];
    this.mockMethods = this.methods;
}

ElasticsearchInterface.prototype.elasticsearch = function () {
    this.dataSource.connect(function () {
        return;
    }, function () {
        return;
    });
    return this.dataSource.connection;
};

module.exports = ElasticsearchInterface;