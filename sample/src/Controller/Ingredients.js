'use strict';


function Ingredients() {
    return;
}

Ingredients.prototype._handleError = function (error) {
    this.statusCode = 500;
    return {
        'message' : error.toString(),
        'error' : error
    };
};

Ingredients.prototype.delete = function (callback) {
    var $this, id, ingredient;
    $this = this;
    id = this.segments[0];
    ingredient = this.model('Ingredient');

    ingredient.delete(id, function (error, response) {
        if (error) {
            callback($this._handleError(error));
            return;
        }
        callback(response);
    });
};

Ingredients.prototype.put = function (callback) {
    var $this, ingredient;
    $this = this;
    ingredient = this.model('Ingredient');

    ingredient.save(this.payload, function (error, response) {
        if (error) {
            callback($this._handleError(error));
            return;
        }
        callback(response);
    });
};

Ingredients.prototype.get = function (callback) {
    var $this, ingredient, key, query;
    $this = this;
    ingredient = this.model('Ingredient');
    key = this.segments[0];
    query = this.query.query;

    if (key) {
        ingredient.findByKey(key, function (error, result) {
            if (error) {
                callback($this._handleError(error));
                return;
            }
            if (result === null) {
                $this.statusCode = 404;
            }
            callback(result);
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

