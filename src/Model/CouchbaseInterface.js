/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256, nomen: true */
'use strict';
var exceptions = require('./../exceptions.js');
var Validator = require('./Validator.js');
var utils = require('./utils.js');
var util = require('util');
var ModelTrigger = require('./ModelTrigger');
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
    if (configurations.uid === undefined) {
        throw new exceptions.IllegalArgument('Uid is not defined!');
    }
    this.dataSource = dataSource;
    // Record key: uid prefix
    this.uid = configurations.uid;
    // Possible fields that are coing to be searched by
    this.keys = configurations.keys;
    // Field locks
    this.locks = configurations.locks;
    // Required fields
    this.requires = configurations.requires;
    // Separator
    this.separator = configurations.separator;
    // Validation rules
    this.validate = configurations.validate;
    if (this.validate === undefined || typeof this.validate !== 'object') {
        this.validate = {};
    }
    if (this.locks === undefined || typeof this.locks !== 'object') {
        this.locks = {};
    }
    if (this.requires === undefined || typeof this.requires !== 'object') {
        this.requires = {};
    }
    if (this.keys === undefined || typeof this.keys !== 'object') {
        this.keys = {};
    }
    if (this.separator === undefined || typeof this.separator !== 'string') {
        this.separator = '_';
    }
    this.validator = new Validator(this.validate);
}
/*
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
/*
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
                    removeIds.push(that.uid + that.separator + n + that.separator + data[n]);
                }
            }
        }
    }
    searchKeys(keys, data);
    return removeIds;
};
/**
 * Delete a document
 *
 * @method removeById
 * @param {string} id Id that will be used with uid/prefix to delete the document
 * @param {function} callback
 * @param {json} data Options to report to the database behavior
 */
CouchbaseInterface.prototype.removeById = function (id, callback, options) {
    var that = this;
    if (options === undefined) {
        options = {};
    }
    if (typeof callback !== 'function') {
        throw new exceptions.IllegalArgument('callback is not a fucntion');
    }
    var operation = function (callback) {
        that.dataSource.connect(function (connection) {
            that.log('[removeById] connected');
            connection.get(that.uid + that.separator + id, {}, function (err, result) {
                if (err) {
                    callback(err);
                    return;
                }
                that.log('[removeById] found');
                var data = result.value;
                connection.remove(that.uid + that.separator + id, options, function () {
                    that.log('[removeById] main record removed');
                    var ids = that._searchKeys(that.keys, data);
                    if (ids.length === 0) {
                        callback();
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
    trigger.execute({'id' : id});
};
// Save keys
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
                            removeIds.push(that.uid + that.separator + n + that.separator + oldData[n]);
                        }
                        documents[that.uid + that.separator + n + that.separator + data[n]] = {'value' : {'key' : id }};
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
// Check if it is required
CouchbaseInterface.prototype._checkRequired = function (data, requiredFields) {
    var that = this;
    var n;
    for (n in requiredFields) {
        if (requiredFields.hasOwnProperty(n)) {
            if (typeof data[n] === 'object') {
                that._checkRequired(data[n], requiredFields[n]);
            } else if (data[n] === undefined || data[n] === null) {
                return false;
            }
        }
    }
    return true;
};
/*
* Retrieve documents from the bucket
*
* @method find
* @param {Object} condition Conditions to match
* @param {Object} options Rules like limit, skip, order
* @param {Object} callback
*/
CouchbaseInterface.prototype._find = function (conditions, options, callback) {
    var that = this;
    if (conditions._id !== undefined) {
        this.dataSource.connect(function (connection) {
            connection.get(conditions._id, options, callback);
        }, function (err) {
            that.log('findById error: ' + err);
            callback(err);
        });
    }
};
/**
 * Get a document using one of the related keys that points to this document
 *
 * @method findByKey
 * @param {string} keyValue Value that will be used with prefix to find the document
 * @param {string} keyName Prefix of the key
 * @param {function} callback
 */
CouchbaseInterface.prototype.findByKey = function (keyValue, keyName, callback) {
    var that = this;
    if (keyValue === undefined || keyName === undefined || typeof callback !== 'function') {
        throw new exceptions.IllegalArgument('All parameters are mandatory');
    }
    that.dataSource.connect(function (connection) {
        that.log('[findByKey] connected');
        connection.get(that.uid + that.separator + keyName + that.separator + keyValue, {}, function (err, result) {
            if (err) {
                that.log('[findByKey] ' + err);
                callback(err);
            } else {
                if (result.value === undefined || result.value.key === undefined) {
                    callback(new exceptions.InvalidKeyFormat());
                } else {
                    that.log('[findByKey] key = ' + result.value.key);
                    connection.get(result.value.key, {}, callback);
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
 * @param {string} id Id that will be used with uid to find the document
 * @param {function} callback
 */
CouchbaseInterface.prototype.findById = function (id, callback) {
    if (id === undefined || typeof callback !== 'function') {
        throw new exceptions.IllegalArgument('All arguments are mandatory');
    }
    this.log('findById(' + id + ')');
    this._find({'_id' : this.uid + this.separator + id}, {}, callback);
};
// Log
CouchbaseInterface.prototype.log = function (msg) {
    console.log('[CouchbaseInterface] ' + (typeof msg === 'object' ? JSON.stringify(msg) : msg));
};
/**
 * Index a document in the database
 *
 * @method save
 * @param {string} id Id that will be used with uid/prefix to index the document
 * @param {json} data Document data to index
 * @param {function} callback
 * @param {string} prefix If using a related document
 * @param {json} data Options to report to the database behavior
 */
CouchbaseInterface.prototype.save = function (id, data, callback, prefix, options) {
    if (options === undefined) {
        options = {};
    }
    if (options.saveOptions === undefined) {
        options.saveOptions = {};
    }
    var that = this;
    if (prefix === undefined || prefix === null) {
        prefix = that.uid;
    }
    if (typeof callback !== 'function') {
        throw new exceptions.IllegalArgument('callback must be a function');
    }
    if (id === undefined || id === null) {
        throw new exceptions.IllegalArgument('id is not defined or it is null');
    }
    var operation = function (callback) {
        that.dataSource.connect(function (connection) {
            connection.get(prefix + that.separator + id, {}, function (err, result) {
                var isUpdate = !err;
                var isSave = !isUpdate;
                var oldData = isUpdate ? result.value : {};
                var mergedData = utils.merge(data, oldData);

                function performValidation(onSuccess) {
                    that.log('Performing validation');
                    that.validator.isValid(data, function (expired, succeeded, validatedFields) {
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
                    that.log('Checking locked fields');
                    if (that._isLocked(data, that.locks, isUpdate ? 'M' : 'C')) {
                        callback(new exceptions.FieldLocked());
                        return;
                    }
                    onSuccess();
                }

                function checkRequired(onSuccess) {
                    that.log('Checking required fields');
                    if (isSave) {
                        if (that._checkRequired(data, that.requires)) {
                            onSuccess();
                        } else {
                            callback(new exceptions.FieldRequired());
                        }
                    } else {
                        onSuccess();
                    }
                }

                function setOrReplace() {
                    that.log('Setting/replacing');
                    if (isUpdate) {
                        connection.replace(prefix + that.separator + id, mergedData, options.saveOptions, callback);
                    } else {
                        connection.set(prefix + that.separator + id, mergedData, options.saveOptions, callback);
                    }
                }

                // Saving in the same model: should perform validation, check locked fields and save keys
                if (prefix === that.uid) {
                    checkRequired(function () {
                        performValidation(function () {
                            checkLockedFields(function () {
                                try {
                                    that.log('Saving keys');
                                    that._saveKeys(that.keys, data, prefix + that.separator + id, oldData, function (err) {
                                        that.log('Keys saved');
                                        if (err) {
                                            callback(err);
                                        } else {
                                            setOrReplace();
                                        }
                                    });
                                } catch (e) {
                                    callback(e);
                                    return;
                                }
                            });
                        });
                    });
                } else {
                    setOrReplace();
                }
            });
        }, function (err) {
            callback(err);
        });
    };

    var trigger = new ModelTrigger(this.beforeSave, operation, this.afterSave, callback);
    trigger.execute({'id' : id, 'data' : data});
};

module.exports = CouchbaseInterface;
