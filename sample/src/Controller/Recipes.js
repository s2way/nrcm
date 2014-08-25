'use strict';

function Recipes() {
    return;
}

Recipes.prototype.get = function (callback) {
    this.responseHeaders['X-Header'] = 'A Header';
    callback({
        'a' : 'recipe'
    });
};

module.exports = Recipes;