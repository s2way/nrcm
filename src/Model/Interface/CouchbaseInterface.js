/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256, nomen: true */
'use strict';
var exceptions = require('./../../exceptions.js');
var Validator = require('./../../Component/Builtin/Validator.js');
var SchemaMatcher = require('./../../Component/Builtin/SchemaMatcher.js');
var utils = require('./../utils.js');
var util = require('util');
var ModelTrigger = require('./../ModelTrigger');

/**
 * CouchBaseInterface object
 *
 * @method CouchBaseInterface
 * @param {json} dataSource The connection to use
 * @param {json} configurations Rules
 */
function CouchbaseInterface(dataSource, configurations) {
    if (dataSource === undefined) {
        throw new exceptions.IllegalArgument('Invalid DataSource');
    }
    if (configurations === undefined) {
        throw new exceptions.IllegalArgument('The configurations parameter is mandatory');
    }
    if (configurations.type === undefined) {
        throw new exceptions.IllegalArgument('Type is not defined!');
    }
    this.dataSource = dataSource;
    // Record key: type prefix
    this.type = configurations.type;
    // Possible fields that are coing to be searched by
    this.keys = configurations.keys;
    // Field locks
    this.locks = configurations.locks;
    // Separator
    this.separator = configurations.separator;
    // SchemaMatcher
    this.schema = configurations.schema;
    // Bucket
    this.bucket = dataSource.index;
    // Validation rules
    this.validate = configurations.validate;

    if (this.validate === undefined || typeof this.validate !== 'object') {
        this.validate = {};
    }
    if (this.locks === undefined || typeof this.locks !== 'object') {
        this.locks = {};
    }
    if (this.keys === undefined || typeof this.keys !== 'object') {
        this.keys = {};
    }
    if (this.separator === undefined || typeof this.separator !== 'string') {
        this.separator = '_';
    }
    if (this.schema !== undefined) {
        this.sm = new SchemaMatcher(this.schema);
    }
    this.validator = new Validator(this.validate);
    // Methods that should be injected into the model (they are prefixed with $)
    this.methods = ['find', 'findByKey', 'findById', 'findAll', 'save', 'removeById', 'getMulti'];
    // Methods that should be mocked
    this.mockMethods = this.methods;
}

/**
 * Increment the counter for the key
 * It`s called automatically when id is missing on save method
 *
 * @method _incr
 * @param {String} keyName
 * @param {Function} callback
 */
CouchbaseInterface.prototype._counter = function (keyName, callback) {
    var that = this;
    that.dataSource.connect(function (connection) {
        that.log('[_counter] connected');
        connection.incr('counter:' + keyName, {}, function (err, result) {
            that.log('[_counter] key ' + 'counter:' + keyName);
            if (err) {
                that.log('[_counter] counter ' + err);
                connection.set('counter:' + keyName, 1, { }, function (err) {
                    if (err) {
                        that.log('[_counter] insert' + err);
                        callback(err);
                    } else {
                        that.log('[_counter] after insert value = ' + 1);
                        callback(null, 1);
                    }
                });
            } else {
                that.log('[_counter] value = ' + result.value);
                callback(null, result.value);
            }
        });
    }, function (err) {
        callback(err);
    });
};

/**
 * Check the options of locked fields
 *
 * @method _isLocked
 * @param {Object} data
 * @param {Object} lock
 * @param {String} status
 */
CouchbaseInterface.prototype._isLocked = function (data, lock, status) {
    var n;
    for (n in lock) {
        if (lock.hasOwnProperty(n)) {
            if (data[n] !== undefined) {
                if (typeof data[n] === 'object' && this._isLocked(data[n], lock[n], status)) {
                    return true;
                }
                if (status === lock[n]) {
                    return true;
                }
            }
        }
    }
    return false;
};

/**
 * Search
 *
 * @method _isLocked
 * @param {Object} data
 * @param {Object} keys
 */
CouchbaseInterface.prototype._searchKeys = function (keys, data) {
    var removeIds = [];
    var that = this;
    this.log('Searching keys');
    function searchKeys(keys, data) {
        var n;
        for (n in keys) {
            if (keys.hasOwnProperty(n)) {
                if (typeof keys[n] === 'object') {
                    searchKeys(keys[n], data[n]);
                } else if (typeof data[n] !== 'object' && data[n] !== undefined) {
                    removeIds.push(that.type + that.separator + n + that.separator + data[n]);
                }
            }
        }
    }
    searchKeys(keys, data);
    return removeIds;
};
/**
 * getMulti - Retrieve multiples doc
 *
 * @method getMulti
 * @param {array} keys Ids that will be used to retrieve data
 * @param {json} options Options
 * @param {function} callback
 */
CouchbaseInterface.prototype.getMulti = function (keys, options, callback) {
    var that = this;
    options = options || {};
    if (typeof callback !== 'function') {
        throw new exceptions.IllegalArgument('callback is not a function');
    }
    if (!Array.isArray(keys)) {
        callback(new exceptions.IllegalArgument('keys must be an array'));
        return;
    }
    that.dataSource.connect(function (connection) {
        connection.getMulti(keys, options, function (err, result) {
            callback(err, result);
        });
    }, function (err) {
        callback(err);
    });
};

/**
 * Delete a document
 *
 * @method removeById
 * @param {string} id Id that will be used with type/prefix to delete the document
 * @param {function} callback
 * @param {json} data Options to report to the database behavior
 */
CouchbaseInterface.prototype.removeById = function (id, callback, options) {
    var that = this;
    if (options === undefined) {
        options = {};
    }
    if (typeof callback !== 'function' || id === undefined) {
        throw new exceptions.IllegalArgument('All arguments are mandatory');
    }
    var operation = function (callback) {
        that.dataSource.connect(function (connection) {
            that.log('[removeById] connected');
            connection.get(id, {}, function (err, result) {
                if (err) {
                    that.log('[removeById] NOT found');
                    callback(err);
                    return;
                }
                that.log('[removeById] found');
                var data = result.value;
                connection.remove(id, options, function (err) {
                    if (err) {
                        that.log('[removeById] Err');
                        callback(err);
                        return;
                    }
                    that.log('[removeById] main record removed');
                    var ids = that._searchKeys(that.keys, data);
                    if (ids.length === 0) {
                        callback(null, {});
                    } else {
                        connection.removeMulti(ids, {}, function (err) {
                            if (!err) {
                                that.log('[removeById] keys removed');
                            }
                            callback(err);
                        });
                    }
                });
            });
        }, function (err) {
            callback(err);
        });
    };

    var trigger = new ModelTrigger(this.beforeRemove, operation, this.afterRemove, callback);
    trigger.execute();
};

CouchbaseInterface.prototype._saveKeys = function (keys, data, id, oldData, callback) {
    var documents = {};
    var removeIds = [];
    var that = this;
    var documentsCount = 0;
    function searchKeys(keys, data, id, oldData) {
        var n;
        for (n in keys) {
            if (keys.hasOwnProperty(n)) {
                if (typeof keys[n] === 'object') {
                    searchKeys(keys[n], data[n], id, oldData[n]);
                } else {
                    if (typeof data[n] !== 'object' && data[n] !== undefined) {
                        if (oldData !== undefined && oldData[n] !== undefined && oldData[n] !== null) {
                            removeIds.push(that.type + that.separator + n + that.separator + oldData[n]);
                        }
                        documents[that.type + that.separator + n + that.separator + data[n]] = {'value' : {'key' : id }};
                        documentsCount += 1;
                    }
                }
            }
        }
    }
    this.log('Searching keys');
    searchKeys(keys, data, id, oldData);
    function deleteOldKeys(callback) {
        if (removeIds.length === 0) {
            callback();
        } else {
            that.dataSource.connect(function (connection) {
                connection.removeMulti(removeIds, {}, function (err) {
                    callback(err);
                });
            }, function (err) {
                callback(err);
            });
        }
    }
    function createKeys(callback) {
        if (documentsCount === 0) {
            that.log('No keys to create');
            callback();
        } else {
            that.dataSource.connect(function (connection) {
                connection.setMulti(documents, {}, function (err) {
                    if (!err) {
                        that.log('Keys created');
                    }
                    callback(err);
                });
            }, function (err) {
                callback(err);
            });
        }
    }
    this.log('Deleting old keys');
    deleteOldKeys(function (err) {
        if (err) {
            callback(err);
        } else {
            that.log('Creating keys');
            createKeys(callback);
        }
    });
};

/**
* Retrieve documents from the bucket
*
* @method find
* @param {object} condition Conditions to match
* @param {object} options Rules like limit, skip, order
* @param {function} callback
*/
CouchbaseInterface.prototype._find = function (conditions, options, callback) {
    var that = this;
    var keysToGet = [];
    if (conditions._id !== undefined) {
        keysToGet.push(conditions._id);
        this.dataSource.connect(function (connection) {
            connection.getMulti(keysToGet, options, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result[conditions._id]);
                }
            });
        }, function (err) {
            that.log('findById error: ' + err);
            callback(err);
        });
    }
};

/**
 * Get few documents using a view
 *
 * @method findAll
 * @param {object} params (viewName, viewOptions and queryOptions)
 * @param {function} callback
 */
CouchbaseInterface.prototype.findAll = function (params,  callback) {
    var $this = this;
    var viewName = params.viewName;
    var viewOptions = params.viewOptions || {};
    var queryOptions = params.queryOptions || {};
    var keysToGet = [];
    var i = 0;
    var l = 0;

    $this.dataSource.connect(function (connection) {
        $this.log('[findAll] connected ' + $this.bucket + ' | ' + viewName);
        queryOptions.limit = queryOptions.limit === undefined ? 10 : queryOptions.limit;

        connection.view(viewName, viewName, viewOptions).query(queryOptions, function (err, result) {
            if (err) {
                $this.log('[findAll] err' + err);
                callback(err);
            } else {
                $this.log('[findAll] ok');
                for (i = 0, l = result.length; i < l; i += 1) {
                    keysToGet.push(result[i].id);
                }
                connection.getMulti(keysToGet, {}, function (err, result) {
                    callback(err, result);
                });
            }
        });
    }, function (err) {
        callback(err);
    });
};

/**
 * Get a document using one of the related keys that points to this document
 *
 * @method findByKey
 * @param {object} params Object with 'key' and 'value'
 * @param {function} callback
 */
CouchbaseInterface.prototype.findByKey = function (params, callback) {
    var that = this;
    if (params === undefined || params.value === undefined || params.key === undefined || typeof callback !== 'function') {
        throw new exceptions.IllegalArgument('All parameters are mandatory');
    }
    var completeKey = that.type + that.separator + params.key + that.separator + params.value;
    that.dataSource.connect(function (connection) {
        that.log('[findByKey] connected');
        connection.getMulti([completeKey], {}, function (err, result) {
            if (err) {
                that.log('[findByKey] ' + err);
                callback(err);
            } else {
                if (result[completeKey] === undefined || result[completeKey].value === undefined) {
                    callback(new exceptions.InvalidKeyFormat());
                } else {
                    that.log('[findByKey] key = ' + result[completeKey].value.key);
                    connection.getMulti([
                        result[completeKey].value.key
                    ], {}, callback);
                }
            }
        });
    }, function (err) {
        callback(err);
    });
};

/**
 * Get a document using the id
 *
 * @method findById
 * @param {string} id Id that will be used with type to find the document
 * @param {function} callback
 */
CouchbaseInterface.prototype.findById = function (id, callback) {
    if (id === undefined || typeof callback !== 'function') {
        throw new exceptions.IllegalArgument('All arguments are mandatory');
    }
    this.log('[CouchbaseInterface] findById(' + id + ')');
    var wholeDocumentKey = this.type + this.separator + id;
    this._find({'_id' : wholeDocumentKey}, {}, callback);
};

/**
 * Log function
 * Mocked in tests
 * @param msg The log message
 */
CouchbaseInterface.prototype.log = function (msg) {
    console.log('[CouchbaseInterface] ' + (typeof msg === 'object' ? JSON.stringify(msg) : msg));
};

/**
 * Index a document in the database
 *
 * @method save
 * @param {object} Save parameters (id, data, type, options)
 * @param {function} callback Function that will be called after the operation is complete
 */
CouchbaseInterface.prototype.save = function (params, callback) {
    var $this = this;
    var id = params.id;
    var data = params.data;
    var options = params.options;
    var type = params.type;

    if (options === undefined) {
        options = {};
    }
    if (options.saveOptions === undefined) {
        options.saveOptions = {};
    }
    if (type === undefined || type === null) {
        type = this.type;
    }

    var completeKey = id ? type + $this.separator + id : false;

    if (typeof callback !== 'function') {
        throw new exceptions.IllegalArgument('callback must be a function');
    }
    if (this.sm !== undefined) {
        var smData = this.sm.match(data);
        if (smData !== true) {
            callback(new exceptions.InvalidSchema(smData));
            return;
        }
    }

    var operation = function (callback) {
        $this.dataSource.connect(function (connection) {

            function getMultiCallback(err, result) {
                var isUpdate = completeKey !== false && !err;
                var oldData = isUpdate ? result[completeKey].value : {};
                var mergedData = utils.merge(data, oldData);

                function performValidation(onSuccess) {
                    $this.log('Performing validation');
                    $this.validator.isValid(data, function (expired, succeeded, validatedFields) {
                        if (expired) {
                            callback(new exceptions.ValidationExpired(), validatedFields);
                        } else if (!succeeded) {
                            callback(new exceptions.ValidationFailed(), validatedFields);
                        } else {
                            onSuccess();
                        }
                    });
                }

                function checkLockedFields(onSuccess) {
                    $this.log('Checking locked fields');
                    if ($this._isLocked(data, $this.locks, isUpdate ? 'M' : 'C')) {
                        callback(new exceptions.FieldLocked());
                        return;
                    }
                    onSuccess();
                }

                function controlId(callback) {
                    if (id === undefined || id === null) {
                        $this._counter(type, function (err, value) {
                            if (err) {
                                callback(err);
                            } else {
                                id = value;
                                callback();
                            }
                        });
                    } else {
                        callback();
                    }
                }

                function setOrReplace() {
                    $this.log('Setting/replacing');
                    if (isUpdate) {
                        connection.replace(type + $this.separator + id, mergedData, options.saveOptions, callback);
                    } else {
                        connection.set(type + $this.separator + id, mergedData, options.saveOptions, callback);
                    }
                }

                // Saving in the same model: should perform validation, check locked fields and save keys
                if (type === $this.type) {
                    performValidation(function () {
                        checkLockedFields(function () {
                            controlId(function (err) {
                                if (err) {
                                    callback(err);
                                    return;
                                }
                                $this.log('Saving keys');
                                $this._saveKeys($this.keys, data, type + $this.separator + id, oldData, function (err) {
                                    $this.log('Keys saved');
                                    if (err) {
                                        callback(err);
                                    } else {
                                        setOrReplace();
                                    }
                                });
                            });
                        });
                    });
                } else {
                    setOrReplace();
                }
            }

            if (completeKey) {
                connection.getMulti([completeKey], {}, getMultiCallback);
            } else {
                getMultiCallback();
            }
        }, function (err) {
            callback(err);
            return;
        });
    };

    var trigger = new ModelTrigger(this.beforeSave, operation, this.afterSave, callback);
    trigger.execute();
};

module.exports = CouchbaseInterface;
