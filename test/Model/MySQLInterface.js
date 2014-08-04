/*jslint devel: true, node: true, indent: 4, unparam: true */
/*globals describe, it */
'use strict';
var assert = require('assert');
var util = require('util');
var MySQLInterface = require('./../../src/Model/MySQLInterface');
var DataSource = require('./../../src/Model/DataSource');

describe('MySQLInterface.js', function () {
    var blankFunction = function () { return; };

    DataSource.prototype.info = blankFunction;
    DataSource.prototype.debug = blankFunction;

    function mockMySQL(methods, connectionError) {
        return {
            'createConnection' : function () {
                return {
                    'connect' : function (callback) {
                        setImmediate(function () {
                            callback(connectionError);
                        });
                    },
                    'end' : function () { return; },
                    'query' : methods.query,
                    'escapeId' : function (value) { return value; }
                };
            }
        };
    }

    function createDataSource(mysql) {
        var ds = new DataSource('default', {
            'type' : 'MySQL',
        });
        ds.log = function (msg) {
            this.msg = msg;
        };
        if (mysql === undefined) {
            mysql = mockMySQL();
        }
        ds.mysql = mysql;
        return ds;
    }

    function createModelInterface(mysql) {
        if (mysql === undefined) {
            mysql = mockMySQL();
        }
        var modelInterface = new MySQLInterface(createDataSource(mysql), {'uid': 'pessoa'});
        return modelInterface;
    }

    // Constructor tests
    describe('MySQLInterface', function () {

        it('should throw an IllegalArgument exception if the DataSource is not passed', function () {
            try {
                var mysqlInterface = new MySQLInterface();
                assert(!mysqlInterface);
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
                assert.equal('Invalid DataSource', e.message);
            }
        });

        it('should throw an IllegalArgument exception if the configurations are not passed', function () {
            try {
                var mysqlInterface = new MySQLInterface({});
                assert(!mysqlInterface);
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
                assert.equal('The configurations parameter is mandatory', e.message);
            }
        });

    });

    describe('query', function () {

        it('should call MySQL query method', function (done) {
            var myQuery = 'SELECT * FROM x WHERE y = ?';
            var myParams = [1];
            var myFields = ['something'];
            var myResult = [{
                'something' : 'here',
            }, {
                'something' : 'there'
            }];
            var modelInterface = createModelInterface(mockMySQL({
                'query' : function (query, params, callback) {
                    assert.equal(myQuery, query);
                    assert.equal(myParams, params);
                    setImmediate(function () {
                        callback(null, myResult, myFields);
                    });
                }
            }));
            modelInterface.query(myQuery, myParams, function (err, rows, fields) {
                assert(!err);
                assert.equal(myResult, rows);
                assert.equal(myFields, fields);
                done();
            });
        });

        it('should call the callback passing an error if a connection error occurs', function (done) {
            var connectionError = { 'error' : 'connection' };
            var modelInterface = createModelInterface(mockMySQL({}, connectionError));
            modelInterface.query('SELECT * FROM sky', [], function (err) {
                assert.equal(connectionError, err);
                done();
            });
        });
    });

    describe('use', function () {

        it('should issue USE DATABASE command', function (done) {
            var expectedQuery = 'USE database;';
            var modelInterface = createModelInterface(mockMySQL({
                'query' : function (query, callback) {
                    assert.equal(expectedQuery, query);
                    setImmediate(function () {
                        callback(null);
                    });
                }
            }));
            modelInterface.use('database', function (err) {
                done();
            });
        });

        it('should call the callback passing an error if a connection error occurs', function (done) {
            var expectedQuery = 'USE database;';
            var modelInterface = createModelInterface(mockMySQL({
                'query' : function (query, callback) {
                    assert.equal(expectedQuery, query);
                    setImmediate(function () {
                        var err = { };
                        callback(err);
                    });
                }
            }));
            modelInterface.use('database', function (err) {
                assert(err);
                done();
            });
        });

        it('should call the callback passing an error if an error occurs in the query function', function (done) {
            var connectionError = { };
            var modelInterface = createModelInterface(mockMySQL({}, connectionError));
            modelInterface.use('database', function (err) {
                assert(err);
                done();
            });
        });

    });
});