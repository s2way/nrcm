/*jslint devel: true, node: true, indent: 4 */
'use strict';

function MockedModelInterface(dataSource, configurations) {
    this.dataSource = dataSource;
    this.configurations = configurations;
}

MockedModelInterface.prototype.find = function (query, callback) {
    this.query = query;
    callback();
};

MockedModelInterface.prototype.removeById = function (id, callback, options) {
    this.id = id;
    this.options = options;
    callback();
};

MockedModelInterface.prototype.findByKey = function (keyValue, keyName, callback) {
    this.keyValue = keyValue;
    this.keyName = keyName;
    callback();
};

MockedModelInterface.prototype.findAll = function (viewName, viewOptions, queryOptions, callback) {
    this.viewName = viewName;
    this.viewOptions = viewOptions;
    this.queryOptions = queryOptions;
    callback();
};

MockedModelInterface.prototype.findById = function (id, callback) {
    this.id = id;
    callback();
};

MockedModelInterface.prototype.save = function (id, data, callback, prefix, options) {
    this.id = id;
    this.data = data;
    this.prefix = prefix;
    this.options = options;
    callback();
};

module.exports = MockedModelInterface;
