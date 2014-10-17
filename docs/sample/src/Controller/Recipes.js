'use strict';

function Recipes() {
    return;
}

Recipes.prototype.get = function (callback) {
    var myself = this.component('Bridge', 'myself');

    myself.put('recipes', {}, function (error, response) {
        callback(response.body);
    });

};

Recipes.prototype.put = function (callback) {
    callback({
        'ok' : false
    });
};

module.exports = Recipes;
