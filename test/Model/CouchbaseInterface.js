/*jslint devel: true, node: true, indent: 4, unparam: true */
/*globals describe, it */
'use strict';
var assert = require('assert');
var util = require('util');
var CouchbaseInterface = require('./../../src/Model/CouchbaseInterface');
var DataSource = require('./../../src/Model/DataSource');

describe('CouchbaseInterface.js', function () {

    function blankFunction() {
        return;
    }

    var controlVars = { };
    var data = {
        'email' : 'davi@versul.com.br',
        'senha' : '123456',
        'endereco' : {
            'logradouro' : 'Rua José de Alencar',
            'cep' : '93310210',
        },
        'preferencias' : ['Cerveja', 'Salgadinho']
    };

    function mockCouchbase(options) {
        if (options === undefined) {
            options = {};
        }
        return {
            'Connection' : function (connOptions, connectionCallback) {
                this.set = options.set;
                this.setMulti = options.setMulti;
                this.getMulti = options.getMulti;
                this.removeMulti = options.removeMulti;
                this.get = options.get;
                this.replace = options.replace;
                this.incr = options.incr;
                this.remove = options.remove;
                this.view = options.view;
                if (connectionCallback !== undefined) {
                    // Assync callback
                    setImmediate(function () {
                        connectionCallback();
                        controlVars.connectionCallbackCalled = true;
                    });
                }
            }
        };
    }

    function createDataSource(couchbase) {
        var ds = new DataSource('default', {
            'index' : 'bucket',
            'type' : 'Couchbase',
            'host' : 'localhost',
            'port' : '8091'
        });
        ds.log = function (msg) {
            this.msg = msg;
        };
        if (couchbase === undefined) {
            couchbase = mockCouchbase();
        }
        ds.couchbase = couchbase;
        return ds;
    }

    function createModelInterface(couchbase) {
        if (couchbase === undefined) {
            couchbase = mockCouchbase({
                'getResult' : {
                    'value' : data
                }
            });
        }
        var modelInterface = new CouchbaseInterface(createDataSource(couchbase), {'uid': 'pessoa'});
        modelInterface.log = blankFunction;
        return modelInterface;
    }
    describe('CouchbaseInterface', function () {
        it('should throw an exception if the uid is not provided', function () {
            try {
                var ci = new CouchbaseInterface(createDataSource(), { 'bucket' : 'bucket' });
                assert.equal(true, ci !== null);
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
        it('should throw an exception if the dataSource parameter is not passed', function () {
            try {
                var ci = new CouchbaseInterface();
                assert.equal(true, ci !== null);
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
        it('should throw an exception if the configurations parameter is not passed', function () {
            try {
                var ci = new CouchbaseInterface(createDataSource());
                assert.equal(true, ci !== null);
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
    });

    describe('findByKey', function () {
        it('should throw an exception if the id is undefined', function () {
            var modelInterface = new CouchbaseInterface(createDataSource(), {'uid': 'pessoa'});
            modelInterface.log = blankFunction;
            try {
                modelInterface.findByKey();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
        it('should find the record by key', function (done) {
            var mainKey = 'pessoa_02895328099';
            var emailKey = 'pessoa_email_davi@versul.com.br';
            var couchbase = mockCouchbase({
                'getMulti' : function (keys, options, callback) {
                    if (keys[0] === emailKey) {
                        callback(null, {
                            'pessoa_email_davi@versul.com.br' : {
                                'value' : {
                                    'key' : 'pessoa_02895328099',
                                }
                            }
                        });
                    } else if (keys[0] === mainKey) {
                        callback(null, {
                            'pessoa_02895328099' : {
                                'value' : {
                                    'nome' : 'Davi',
                                    'email' : 'davi@versul.com.br'
                                }
                            }
                        });
                    } else {
                        assert.fail();
                    }
                },
            });
            var modelInterface = new CouchbaseInterface(createDataSource(couchbase), {'uid' : 'pessoa'});
            modelInterface.log = blankFunction;
            modelInterface.findByKey('davi@versul.com.br', 'email', function (err, result) {
                assert.equal('Davi', result[mainKey].value.nome);
                assert.equal('davi@versul.com.br', result[mainKey].value.email);
                assert.equal(undefined, err);
                done();
            });
        });
    });

    describe('findAll', function () {
        var document = {
            'nome' : 'Davi',
            'cpf' : '02895328099'
        };
        var modelInterface = new CouchbaseInterface(createDataSource(mockCouchbase({
            'view' : function () {
                return {
                    'query' : function (queryOptions, callback) {
                        callback(null, true);
                    }
                };
            },
            'getMulti' : function (keys, options, callback) {
                callback(null, {
                    'pessoa_02895328099' : {
                        'value' : document
                    }
                });
            },
        })), {'uid' : 'pessoa'});
        modelInterface.log = blankFunction;

        it('should return all records if the id is missing', function (done) {
            modelInterface.findAll('viewName', {}, {}, function (err) {
                assert.equal(undefined, err);
                done();
            });
        });
    });
    describe('find', function () {
        var document = {
            'nome' : 'Davi',
            'cpf' : '02895328099'
        };
        var couchbase = mockCouchbase({
            'getMulti' : function (keys, options, callback) {
                callback(null, {
                    'pessoa_02895328099' : {
                        'value' : document
                    }
                });
            },
            'view' : function () {
                return {
                    'query' : function (queryOptions, callback) {
                        callback(null, true);
                    }
                };
            }
        });
        var modelInterface = new CouchbaseInterface(createDataSource(couchbase), {'uid' : 'pessoa'});
        modelInterface.log = blankFunction;
        it('should return all records calling findAll if the id is missing', function (done) {
            modelInterface.find({}, function (err) {
                assert.equal(undefined, err);
                done();
            });
        });

        it('should return the record calling find if the id is present', function (done) {
            modelInterface.find({id : '02895328099'}, function (err, result) {
                assert.equal(JSON.stringify(document), JSON.stringify(result.value));
                assert.equal(undefined, err);
                done();
            });

        });
    });
    describe('findById', function () {
        var doc = {
            'nome' : 'Davi',
            'cpf' : '02895328099'
        };
        var couchbase = mockCouchbase({
            'getMulti' : function (keys, options, callback) {
                callback(null, {
                    'pessoa_02895328099' : {
                        'value' : doc
                    }
                });
            }
        });
        var modelInterface = new CouchbaseInterface(createDataSource(couchbase), {'uid' : 'pessoa'});
        modelInterface.log = blankFunction;
        it('should throw an exception if the id is not passed or if the callback is not a function', function () {
            try {
                modelInterface.findById();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
        it('should find the record by id', function (done) {
            modelInterface.findById('02895328099', function (err, result) {
                assert.equal(JSON.stringify(doc), JSON.stringify(result.value));
                assert.equal(undefined, err);
                done();
            });
        });
    });
    describe('removeById', function () {
        var document = {
            'nome' : 'Davi'
        };
        var couchbase = mockCouchbase({
            'getResult' : {
                'value' : document
            }
        });
        it('should throw an IllegalArgument exception if the passed callback is not a function', function () {
            try {
                var modelInterface = new CouchbaseInterface(createDataSource(couchbase), {'uid': 'pessoa'});
                modelInterface.log = blankFunction;
                modelInterface.removeById('02895328099', 'pessoa', null, {});
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
        it('should call couchbase remove function to remove a document by id from the bucket', function (done) {
            var removeKey, removeOptions;
            var modelInterface = new CouchbaseInterface(createDataSource(mockCouchbase({
                'get' : function (id, options, callback) {
                    setImmediate(function () {
                        callback(null, { 'value' : { } });
                    });
                },
                'remove' : function (key, options, callback) {
                    removeKey = key;
                    removeOptions = options;
                    setImmediate(function () {
                        callback();
                    });
                }
            })), {'uid': 'pessoa'});
            modelInterface.log = blankFunction;
            modelInterface.removeById('pessoa_02895328099', function () {
                assert.equal('pessoa_02895328099', removeKey);
                assert.equal('{}', JSON.stringify(removeOptions));
                done();
            });
        });
        it('should call beforeRemove and proceed with the operation if true is passed to the callback', function (done) {
            var beforeRemoveCalled = false;
            var removeCalled = false;
            var modelInterface = createModelInterface(mockCouchbase({
                'get' : function (id, options, callback) {
                    setImmediate(function () {
                        callback(null, { 'value' : { } });
                    });
                },
                'remove' : function (key, options, callback) {
                    removeCalled = true;
                    setImmediate(function () {
                        callback();
                    });
                }
            }));
            modelInterface.beforeRemove = function (callback) {
                setImmediate(function () {
                    beforeRemoveCalled = true;
                    callback(true);
                });
            };
            modelInterface.removeById('pessoa_02895328099', function (err, result) {
                assert.equal(JSON.stringify({}), JSON.stringify(result));
                assert.equal(null, err);
                assert.equal(true, removeCalled);
                assert.equal(true, beforeRemoveCalled);
                done();
            });
        });
        it('should call afterRemove and pass the id', function (done) {
            var removeCalled = false;
            var afterRemoveCalled = false;
            var modelInterface = createModelInterface(mockCouchbase({
                'get' : function (id, options, callback) {
                    setImmediate(function () {
                        callback(null, { 'value' : { } });
                    });
                },
                'remove' : function (key, options, callback) {
                    removeCalled = true;
                    setImmediate(function () {
                        callback();
                    });
                }
            }));
            modelInterface.afterRemove = function (callback, err, result) {
                afterRemoveCalled = true;
                setImmediate(function () {
                    callback(err, result);
                });
            };
            modelInterface.removeById('pessoa_02895328099', function () {
                assert.equal(true, removeCalled);
                assert.equal(true, afterRemoveCalled);
                done();
            });
        });
    });

    describe('getMulti', function () {
        it('should throw an IllegalArgument exception if the callback is not a function', function () {
            var modelInterface = new CouchbaseInterface(createDataSource(), {'uid' : 'pessoa'});
            try {
                modelInterface.getMulti([]);
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });
        it('should throw an IllegalArgument exception if the keys is not an array', function (done) {
            var modelInterface = new CouchbaseInterface(createDataSource(), {'uid' : 'pessoa'});
            try {
                modelInterface.getMulti(null, {}, function (err) {
                    try {
                        if (err) {
                            throw err;
                        }
                        assert.fail();
                        done();
                    } catch (e) {
                        assert.equal('IllegalArgument', e.name);
                        done();
                    }
                });
            } catch (e) {
                assert.fail();
                done();
            }
        });
        it('should return an array of documents', function (done) {
            var expectedResult = {
                'pessoa_02895328099' : {
                    'value' : {
                        'nome' : 'Davi',
                        'endereco' : 'Rua José de Alencar'
                    }
                },
                'pessoa_19100000000' : {
                    'value' : {
                        'nome' : 'Alguém',
                        'endereco' : 'Rua sem nome'
                    }
                }
            };
            var modelInterface = new CouchbaseInterface(createDataSource(mockCouchbase({
                'getMulti' : function (keys, options, callback) {
                    setImmediate(function () {
                        callback(null, expectedResult);
                    });
                }
            })), {'uid' : 'pessoa'});
            modelInterface.getMulti(['pessoa_02895328099', 'pessoa_19100000000'], {}, function (err, result) {
                if (err) {
                    assert.fail();
                }
                assert(expectedResult, result);
                done();
            });
        });
    });

    describe('save', function () {
        it('should throw an IllegalArgument exception if the callback is not a function', function (done) {
            var modelInterface = createModelInterface();
            try {
                modelInterface.save({}, {}, {}, {});
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
                done();
            }
        });
        it('should autoincrement if the id is not defined', function (done) {
            var incrCalled = false;
            var setCalled = false;

            var modelInterface = createModelInterface(mockCouchbase({
                'set' : function (key, value, setOptions, callback) {
                    setCalled = true;
                    setImmediate(function () {
                        callback();
                    });
                },
                'incr' : function (keyName, options, callback) {
                    incrCalled = true;
                    setImmediate(function () {
                        callback(null, {
                            'value' : 2
                        });
                    });
                }
            }));
            modelInterface.save(null, {'dado' : 'dado'}, function (err, result) {
                assert.equal(true, incrCalled);
                assert.equal(true, setCalled);
                done();
            });
        });
        it('should connect to the database, read the record and call the callback if the record is found', function (done) {
            var replaceCalled = false;
            var getMultiCalled = false;
            var modelInterface = createModelInterface(mockCouchbase({
                'getMulti' : function (ids, options, callback) {
                    getMultiCalled = true;
                    setImmediate(function () {
                        callback(null, {
                            'pessoa_02895328099' : {
                                'value' : { }
                            }
                        });
                    });
                },
                'replace' : function (key, data, saveOptions, callback) {
                    replaceCalled = true;
                    setImmediate(function () {
                        callback();
                    });
                }
            }));
            modelInterface.save('02895328099', data, function (err) {
                assert.equal(null, err);
                assert.equal(true, replaceCalled);
                assert.equal(true, getMultiCalled);
                done();
            });
        });
        it('should call beforeSave and afterSave', function (done) {
            var beforeCalled = false;
            var afterCalled = false;
            var replaceCalled = false;
            var modelInterface = createModelInterface(mockCouchbase({
                'getMulti' : function (ids, options, callback) {
                    setImmediate(function () {
                        callback(null, {
                            'pessoa_02895328099' : {
                                'value' : { }
                            }
                        });
                    });
                },
                'replace' : function (key, data, saveOptions, callback) {
                    replaceCalled = true;
                    setImmediate(function () {
                        callback(null, {});
                    });
                }
            }));
            modelInterface.beforeSave = function (callback) {
                beforeCalled = true;
                setImmediate(function () {
                    callback(true);
                });
            };
            modelInterface.afterSave = function (callback, err, result) {
                afterCalled = true;
                setImmediate(function () {
                    callback(err, result);
                });
            };
            modelInterface.save('02895328099', data, function (err, result) {
                assert.equal(null, err);
                assert.equal(true, beforeCalled);
                assert.equal(true, afterCalled);
                assert.equal(true, replaceCalled);
                done();
            });
        });
        it('should connect to the database, read the record and call the callback if the record is not found', function (done) {
            // Couchbase returns an error when the record is not found
            var document = { };
            var couchbase = mockCouchbase({
                'getMulti' : function (id, options, callback) {
                    setImmediate(function () {
                        // error, record not found
                        callback({});
                    });
                },
                'set' : function (id, data, options, callback) {
                    setImmediate(function () {
                        callback(null, document);
                    });
                }
            });
            var modelInterface = createModelInterface(couchbase);
            modelInterface.save('02895328099', data, function (err) {
                assert.equal(null, err);
                done();
            });
        });
        it('should not call replace if the document is being updated and the validation rules do not pass', function (done) {
            var document = { };
            var modelInterface = createModelInterface(mockCouchbase({
                'replace' : function () {
                    assert.fail();
                },
                'getMulti' : function (key, options, callback) {
                    callback(null, {
                        'pessoa_02895328099' : {
                            'value' : document
                        }
                    });
                }
            }));
            modelInterface.validator.isValid = function (data, callback) {
                assert.equal(true, data !== undefined);
                assert.equal(true, callback !== undefined);
                setImmediate(function () {
                    callback(false, false, {});
                });
            };
            modelInterface.save('02895328099', document, function (exception) {
                assert.equal('ValidationFailed', exception.name);
                assert.equal(undefined, controlVars.replaceCalled);
                done();
            });
        });
        it('should not call replace if one of the locked fields is being passed', function (done) {
            var document = { };
            var modelInterface = createModelInterface(mockCouchbase({
                'replace' : function () {
                    assert.fail();
                },
                'getMulti' : function (key, options, callback) {
                    callback(null, {
                        'pessoa_02895328099' : {
                            'value' : document
                        }
                    });
                }
            }));
            modelInterface.validator.isValid = function (data, callback) {
                assert.equal(true, data !== undefined);
                setImmediate(function () {
                    callback(false, true, {});
                });
            };
            modelInterface.locks = {
                'senha' : 'M'
            };
            modelInterface.save('02895328099', data, function (exception) {
                assert.equal('FieldLocked', exception.name);
                assert.equal(undefined, controlVars.replaceCalled);
                done();
            });
        });
        it('should not call set if the validation rules do not pass', function (done) {
            var couchbase = mockCouchbase({
                'getMulti' : function (keys, options, callback) {
                    setImmediate(function () {
                        callback({});
                    });
                },
                'set' : function () {
                    assert.fail();
                }
            });
            var modelInterface = createModelInterface(couchbase);
            modelInterface.validator.isValid = function (data, callback) {
                assert.equal(true, data !== undefined);
                setImmediate(function () {
                    callback(false, false, {});
                });
            };
            modelInterface.save('02895328099', data, function (exception) {
                assert.equal('ValidationFailed', exception.name);
                done();
            });
        });

        it('should save the keys when the document is being created', function (done) {
            var document = {
                'email' : 'davi@versul.com.br',
                'senha' : '123456',
                'endereco' : {
                    'logradouro' : 'Rua José de Alencar',
                    'cep' : '93310210',
                },
                'preferencias' : ['Cerveja', 'Salgadinho']
            };
            var setMultiDocuments, removeMultiIds;
            var couchbase = mockCouchbase({
                'set' : function (key, value, setOptions, callback) {
                    setImmediate(function () {
                        callback();
                    });
                },
                'getMulti' : function (keys, options, callback) {
                    setImmediate(function () {
                        callback({});
                    });
                },
                'setMulti' : function (documents, options, callback) {
                    setMultiDocuments = documents;
                    setImmediate(function () {
                        callback();
                    });
                },
                'removeMulti' : function (ids, options, callback) {
                    removeMultiIds = ids;
                    setImmediate(function () {
                        callback(null, {});
                    });
                }
            });
            var modelInterface = createModelInterface(couchbase);
            modelInterface.keys = {
                'email' : 'email'
            };
            modelInterface.validator.isValid = function (data, callback) {
                assert.equal(true, data !== undefined);
                setImmediate(function () {
                    callback(false, true, {});
                });
            };
            modelInterface.save('02895328099', document, function (exception, result) {
                var expectedKeys = {
                    'pessoa_email_davi@versul.com.br' : {
                        'value' : {
                            'key' : 'pessoa_02895328099'
                        }
                    }
                };
                assert.equal(undefined, exception);
                assert.equal(undefined, result);
                assert.equal(
                    JSON.stringify(expectedKeys),
                    JSON.stringify(setMultiDocuments)
                );
                assert.equal(undefined, removeMultiIds);
                done();
            });
        });

        it('should pass the data to SchemaMatcher and not save the record if something is wrong', function (done) {
            var document = {
                'email' : 'davi@versul.com.br',
                'senha' : '123456',
                'endereco' : {
                    'logradouro' : 'Rua José de Alencar',
                    'cep' : '93310210',
                },
                'preferencias' : ['Cerveja', 'Salgadinho']
            };
            var couchbase = mockCouchbase({
                'set' : function (key, value, setOptions, callback) {
                    setImmediate(function () {
                        callback();
                    });
                },
                'getMulti' : function (keys, options, callback) {
                    setImmediate(function () {
                        callback({});
                    });
                }
            });
            var modelInterface = new CouchbaseInterface(createDataSource(couchbase), {
                'uid': 'pessoa',
                'schema' : {
                    'senha' : false
                }
            });
            modelInterface.log = blankFunction;
            modelInterface.validator.isValid = function (data, callback) {
                assert.equal(true, data !== undefined);
                setImmediate(function () {
                    callback(false, true, {});
                });
            };
            modelInterface.save('02895328099', document, function (exception, result) {
                assert.equal('InvalidSchema', exception.name);
                done();
            });
        });

        it('should remove the keys and save them again when the document is being updated', function (done) {
            var document = {
                'email' : 'davi@versul.com.br',
                'senha' : '123456',
                'endereco' : {
                    'logradouro' : 'Rua José de Alencar',
                    'cep' : '93310210',
                },
                'preferencias' : ['Cerveja', 'Salgadinho']
            };
            var setMultiDocuments, removeMultiIds;
            var couchbase = mockCouchbase({
                'getMulti' : function (keys, options, callback) {
                    setImmediate(function () {
                        callback(null, {
                            'pessoa_02895328099' : {
                                'value' : document
                            }
                        });
                    });
                },
                'replace' : function (key, data, options, callback) {
                    setImmediate(function () {
                        callback(null, {});
                    });
                },
                'setMulti' : function (documents, options, callback) {
                    setMultiDocuments = documents;
                    setImmediate(function () {
                        callback(null, {});
                    });
                },
                'removeMulti' : function (ids, options, callback) {
                    removeMultiIds = ids;
                    setImmediate(function () {
                        callback(null, {});
                    });
                }
            });

            var modelInterface = createModelInterface(couchbase);
            modelInterface.keys = {
                'email' : 'email'
            };
            modelInterface.validator.isValid = function (data, callback) {
                assert.equal(true, data !== undefined);
                setImmediate(function () {
                    callback(false, true, {});
                }, 1);
            };
            modelInterface.save('02895328099', document, function (exception, result) {
                var expectedKeys = {
                    'pessoa_email_davi@versul.com.br' : {
                        'value' : {
                            'key' : 'pessoa_02895328099'
                        }
                    }
                };
                var expectedIdsRemove = [
                    'pessoa_email_davi@versul.com.br'
                ];
                assert(!exception);
                assert.equal(
                    JSON.stringify(expectedKeys),
                    JSON.stringify(setMultiDocuments)
                );
                assert.equal(
                    JSON.stringify(expectedIdsRemove),
                    JSON.stringify(removeMultiIds)
                );
                done();
            });
        });
    });
});
