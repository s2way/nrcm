/*jslint devel: true, node: true, indent: 4, unparam: true */
/*globals describe, it */
'use strict';
var assert = require('assert');
var util = require('util');
var MySQLInterface = require('./../../src/Model/MySQLInterface');
var DataSource = require('./../../src/Model/DataSource');

describe('MySQLInterface.js', function () {

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

    var logger = {
        'debug' : function () { return; },
        'info' : function () { return; }
    };

    var configurations = {'uid': 'pessoa'};

    function createDataSource(mysql) {
        var ds = new DataSource(logger, 'default', {
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
        var modelInterface = new MySQLInterface(createDataSource(mysql), configurations);
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

        it('should call the use command before query if the database configuration is specified', function (done) {
            var modelInterface = new MySQLInterface(createDataSource(mockMySQL({
                'query' : function (query, params, callback) {
                    setImmediate(function () {
                        callback();
                    });
                }
            })), {
                'database' : 'my_database'
            });
            modelInterface.use = function (database, callback) {
                assert.equal('my_database', database);
                callback();
            };
            modelInterface.query('SELECT * FROM sky', [], function () {
                done();
            });
        });

        it('should call the callback passing an error if uses fails', function (done) {
            var modelInterface = new MySQLInterface(createDataSource(mockMySQL({
                'query' : function (query, params, callback) {
                    assert.fail();
                }
            })), {
                'database' : 'my_database'
            });
            modelInterface.use = function (database, callback) {
                callback({});
            };
            modelInterface.query('SELECT * FROM sky', [], function (err) {
                assert(err);
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

    describe('call', function () {

        it('should call the callback passing an error if an error occurs in the query function', function (done) {
            var connectionError = { };
            var modelInterface = createModelInterface(mockMySQL({}, connectionError));
            modelInterface.call('some_procedure', [], function (err) {
                assert(err);
                done();
            });
        });

        it('should issue a CALL procedure command', function (done) {
            var procedureParams = [1, 'two'];
            var modelInterface = createModelInterface(mockMySQL({
                'query' : function (query, params, callback) {
                    assert.equal('CALL some_procedure(?, ?)', query);
                    assert.equal(procedureParams, params);
                    callback(null);
                }
            }));
            modelInterface.call('some_procedure', procedureParams, function (err) {
                done();
            });
        });

        it('should throw an IllegalArgument if the first parameter is not a string', function () {
            var modelInterface = createModelInterface(mockMySQL({}));
            try {
                modelInterface.call();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
    });

    describe('builder', function () {

        it('should return an instance of the QueryBuilder', function () {
            var modelInterface = createModelInterface(mockMySQL());
            var $ = modelInterface.builder();
            assert.equal('SELECT * FROM sky', $.selectStarFrom('sky').build());
        });

    });

});