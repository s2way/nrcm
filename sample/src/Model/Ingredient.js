'use strict';

function Ingredient() {
    return;
}

Ingredient.prototype.init = function () {
    this.mysql = this.component('DataSource.MySQL', 'mro');
};

Ingredient.prototype.save = function (data, callback) {
    var $this = this;
    $this.mysql.query('SELECT 1', [], function (error) {
        $this.mysql.setDataSource('mrw');
        $this.mysql.query('SELECT 1', [], function () {
            $this.mysql.setDataSource('mro');
            $this.mysql.query('SELECT 1', [], function () {
                callback();
            });
        });
    });

};

Ingredient.prototype.delete = function (id, callback) {
    return;
};

Ingredient.prototype.findById = function (id, callback) {
    return;
};

Ingredient.prototype.findAll = function (query, callback) {
    return;
};

module.exports = Ingredient;