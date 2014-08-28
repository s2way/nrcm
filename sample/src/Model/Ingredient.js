'use strict';

function Ingredient() {
    return;
}

Ingredient.prototype.save = function (data, callback) {
    var couchbase = this.component('Couchbase', {
        'dataSource' : 'default'
    });

};

Ingredient.prototype.delete = function (id, callback) {
};

Ingredient.prototype.findById = function (id, callback) {
};

Ingredient.prototype.findAll = function (query, callback) {

    var elasticsearch = this.component('ElasticSearch', {
        'dataSource' : 'elasticsearch'
    });
};

module.exports = Ingredient;