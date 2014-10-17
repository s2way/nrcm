/*jslint devel: true, node: true, indent: 4, unparam: true */
/*globals describe, it, beforeEach */
'use strict';

var MySQL = require('./../../../../src/Component/Builtin/DataSource/MySQL');
var expect = require('expect.js');

describe('MySQL.js', function () {

    var instance;

    beforeEach(function () {
        instance = new MySQL('default');
        instance.core = {
            'dataSources' : {
                'default' : {
                    'host' : 'localhost',
                    'user' : 'root',
                    'password' : '',
                    'database' : 's2way',
                    'port' : 3306
                }
            }
        };
        instance.component = function (componentName) {
            if (componentName === 'Logger') {
                return {
                    'init' : function () { return; },
                    'log' : function () { return; },
                    'info' : function () { return; }
                };
            }
        };
        instance.init();
    });

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

    describe('MySQL()', function () {
        it('should use default if no parameter is passed', function () {
            instance = new MySQL();
            expect(instance._dataSourceName).to.be.ok();
        });
    });

    describe('query()', function () {

        it('should call MySQL query method', function (done) {
            var myQuery = 'SELECT * FROM x WHERE y = ?';
            var myParams = [1];
            var myFields = ['something'];
            var myResult = [{
                'something' : 'here'
            }, {
                'something' : 'there'
            }];
            instance._databaseSelected['default'] = true;
            instance._mysql = mockMySQL({
                'query' : function (query, params, callback) {
                    expect(query).to.be(myQuery);
                    expect(params).to.be(myParams);
                    setImmediate(function () {
                        callback(null, myResult, myFields);
                    });
                }
            });
            instance.query(myQuery, myParams, function (err, rows, fields) {
                expect(err).not.to.be.ok();
                expect(rows).to.be(myResult);
                expect(fields).to.be(myFields);
                done();
            });
        });

        it('should call the use command before query if the database configuration is specified', function (done) {
            instance._mysql = mockMySQL({
                'query' : function (query, params, callback) {
                    setImmediate(function () {
                        callback();
                    });
                }
            });
            instance.use = function (database, callback) {
                expect(database).to.be('s2way', database);
                callback();
            };
            instance.query('SELECT * FROM sky', [], function () {
                done();
            });
        });

        it('should call the use command before executing the query if the database is specified in the DataSource configurations', function (done) {
            instance._mysql = mockMySQL({
                'query' : function (query, params, callback) {
                    setImmediate(function () {
                        callback();
                    });
                }
            });
            instance.use = function (database, callback) {
                expect(database).to.be('s2way');
                callback();
            };
            instance.query('SELECT * FROM sky', [], function () {
                done();
            });
        });

        it('should call the callback passing an error if uses fails', function (done) {
            instance._mysql = mockMySQL({
                'query' : function () {
                    expect().fail();
                }
            });
            instance.use = function (database, callback) {
                callback({});
            };

            instance.query('SELECT * FROM sky', [], function (err) {
                expect(err).to.be.ok();
                done();
            });
        });

        it('should recycle the connection if the query method is called twice', function (done) {
            var query = 'SELECT * FROM sky';
            instance._databaseSelected['default'] = true;
            instance._mysql = mockMySQL({
                'query' : function (query, params, callback) {
                    callback();
                }
            });
            instance.query(query, [], function () {
                instance.query(query, [], function () {
                    done();
                });
            });
        });

        it('should call the callback passing an error if a connection error occurs', function (done) {
            var connectionError = { 'error' : 'connection' };
            instance._mysql = mockMySQL({}, connectionError);
            instance.query('SELECT * FROM sky', [], function (err) {
                expect(err).to.be(connectionError);
                done();
            });
        });
    });

    describe('use()', function () {

        it('should issue USE DATABASE command', function (done) {
            var expectedQuery = 'USE database;';
            instance._mysql = mockMySQL({
                'query' : function (query, callback) {
                    expect(query).to.be(expectedQuery);
                    setImmediate(function () {
                        callback(null);
                    });
                }
            });
            instance.use('database', function (err) {
                done();
            });
        });

        it('should call the callback passing an error if a connection error occurs', function (done) {
            var expectedQuery = 'USE database;';
            instance._mysql = mockMySQL({
                'query' : function (query, callback) {
                    expect(query).to.be(expectedQuery);
                    setImmediate(function () {
                        var err = { };
                        callback(err);
                    });
                }
            });
            instance.use('database', function (err) {
                expect(err).to.be.ok();
                done();
            });
        });

        it('should call the callback passing an error if an error occurs in the query function', function (done) {
            var connectionError = { };
            instance._mysql = mockMySQL({}, connectionError);
            instance.use('database', function (err) {
                expect(err).to.be.ok();
                done();
            });
        });

    });

    describe('call()', function () {

        it('should call the callback passing an error if an error occurs in the query function', function (done) {
            var connectionError = { };
            instance._mysql = mockMySQL({}, connectionError);
            instance.call('some_procedure', [], function (err) {
                expect(err).to.be.ok();
                done();
            });
        });

        it('should call the use command before query if the database configuration is specified', function (done) {
            var useCommandIssued = false;
            instance._mysql = mockMySQL({
                'query' : function (query, params, callback) {
                    setImmediate(function () {
                        callback();
                    });
                }
            });
            instance.use = function (database, callback) {
                expect(database).to.be('s2way', database);
                useCommandIssued = true;
                callback();
            };
            instance.call('minha_procedure', [], function () {
                expect(useCommandIssued).to.be.ok();
                done();
            });
        });

        it('should issue a CALL procedure command', function (done) {
            var procedureParams = [1, 'two'];
            instance._databaseSelected['default'] = true;
            instance._mysql = mockMySQL({
                'query' : function (query, params, callback) {
                    expect(query).to.be('CALL some_procedure(?, ?)');
                    expect(params).to.be(procedureParams);
                    callback(null);
                }
            });
            instance.call('some_procedure', procedureParams, function () {
                done();
            });
        });

        it('should throw an IllegalArgument if the first parameter is not a string', function () {
            instance._mysql =  mockMySQL({});
            expect(function () {
                instance.call();
            }).to.throwException(function (e) {
                expect(e.name).to.be('IllegalArgument');
            });
        });
    });

    describe('destroy()', function () {

        it('should call connection.end()', function (done) {
            instance._connections['default'] = {
                'end' : function () {
                    done();
                }
            };
            instance.destroy();
        });

    });
});