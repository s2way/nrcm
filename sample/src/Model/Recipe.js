'use strict';

function Recipe() {
    return;
}

Recipe.prototype.init = function () {
    this.couchbase = this.component('DataSource.Couchbase');
};

module.exports = Recipe;