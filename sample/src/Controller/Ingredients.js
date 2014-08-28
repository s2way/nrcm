'use strict';


function Ingredients() {
    return;
}

Ingredients.prototype._handleError = function (error) {
    this.statusCode = 500;
    return {
        'error' : error
    };
};

Ingredients.prototype.delete = function (callback) {
    var $this = this;
    var id = this.segments[0];
    var ingredient = this.model('Ingredient');

    ingredient.delete(id, function (error, response) {
        if (error) {
            callback($this._handleError(error));
            return;
        }
        callback(response);
    });
};

Ingredients.prototype.put = function (callback) {
    var $this = this;
    var ingredient = this.model('Ingredient');

    ingredient.save(this.payload, function (error, response) {
        if (error) {
            callback($this._handleError(error));
            return;
        }
        callback(response);
    });
};

Ingredients.prototype.get = function (callback) {
    var $this = this;
    var ingredient = this.model('Ingredient');
    var id = this.query.id;
    var query = this.query.query;

    if (id) {
        ingredient.findById(id, function (error, response) {
            if (error) {
                callback($this._handleError(error));
                return;
            }
            callback(response._source);
        });
        return;
    }

    ingredient.findAll(query, function (error, results) {
        if (error) {
            callback($this._handleError(error));
            return;
        }
        callback(results.hits.hits);
    });
};

module.exports = Ingredients;

