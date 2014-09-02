'use strict';
var exceptions = require('../../../exceptions');

function ElasticSearch() {
    this._elasticsearch = require('elasticsearch');
}

ElasticSearch.prototype.client = function (dataSourceName) {
    dataSourceName = dataSourceName || 'default';
    var dataSource = this.core.dataSources[dataSourceName];
    if (!dataSource) {
        throw new exceptions.IllegalArgument('DataSource not found!');
    }

    return new this._elasticsearch.Client({
        'host' : dataSource.host + ':' + dataSource.port,
        'log' : dataSource.log
    });

};

module.exports = ElasticSearch;