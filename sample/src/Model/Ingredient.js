/*jslint unparam: true*/
'use strict';

var uuid = require('node-uuid');

var KEY_NOT_FOUND = 13;

function Ingredient() {
    this.validate = {
        'name' : function (value, data, callback) {
            if (typeof value !== 'string') {
                callback({ 'message': 'Name should be a string' });
                return;
            }
            if (!value) {
                callback({ 'message' : 'Name cannot be empty' });
                return;
            }
            if (value.length > 100) {
                callback({ 'message' : 'Name should contain less than 100 chars'});
                return;
            }
            callback();
        },
        'amount' : function (value, data, callback) {
            if (typeof value !== 'number') {
                callback({ 'message' : 'Amount should be a number' });
                return;
            }
            if (!value) {
                callback({ 'message' : 'Amount is mandatory'});
                return;
            }
            if (value < 0) {
                callback({ 'message' : 'Amount should be positive' });
                return;
            }
            callback();
        },
        'measure' : function (value, data, callback) {
            if (typeof value !== 'string') {
                callback({ 'message' : 'Measure should be a string' });
                return;
            }
            if (!value) {
                callback({ 'message' : 'Measure is mandatory' });
                return;
            }
            if (value.length > 10) {
                callback({ 'message' : 'Measure cannot be greater than 10 chars' });
                return;
            }
            callback();
        }
    };
}

Ingredient.prototype.init = function () {
    this.couchbase = this.component('DataSource.Couchbase');
    this.validator = this.component('Validator', {
        'validate' : this.validate
    });
    this.stringUtils = this.component('StringUtils');
};

Ingredient.prototype._generateKey = function () {
    return this.stringUtils.camelCaseToLowerCaseUnderscored(this.name) + '_' + uuid.v1();
};

Ingredient.prototype.save = function (data, callback) {
    var $this = this;
    if (!this.validator.match(data)) {
        callback({
            'error' : 'InvalidSchema',
            'schema' : this.validate
        });
    }
    this.validator.validate(data, function (error) {
        if (error) {
            callback(error);
            return;
        }

        data._type = 'ingredient';

        $this.couchbase.connect(function (error, bucket) {
            if (error) {
                callback(error);
                return;
            }

            var key = $this._generateKey();
            bucket.insert(key, data, {}, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }
                callback(null, {
                    'key' : key
                });
            });

        });
    });

};

Ingredient.prototype.findByKey = function (key, callback) {
    var $this;
    $this = this;
    $this.couchbase.connect(function (error, bucket) {
        if (error) {
            callback(error);
            return;
        }
        bucket.get(key, function (error, result) {
            if (error && error.code !== KEY_NOT_FOUND) {
                callback(error);
                return;
            }
            callback(null, result);
        });
    });
    return;
};


//Ingredient.prototype.remove = function (id, callback) {
//    return;
//};
//
//
Ingredient.prototype.findAll = function (query, callback) {
    var $this;
    $this = this;
    this.couchbase.connect(function (error, bucket) {
        if (error) {
            callback(error);
            return;
        }
        var query = $this.couchbase.ViewQuery.from('_design/ingredients', 'ingredients');
        bucket.query(query, function (error, result) {
            callback(error, result);
        });
    });
};

module.exports = Ingredient;