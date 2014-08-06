'use strict';
var exceptions = require('./../../src/exceptions');

function QueryBuilder() {
    this.query = '';
}

QueryBuilder.prototype._fieldsToCommaList = function (fields) {
    var commaList = '';
    var i;
    for (i in fields) {
        if (fields.hasOwnProperty(i)) {
            if (commaList !== '') {
                commaList += ', ';
            }
            commaList += fields[i];
        }
    }
    return commaList;
};

QueryBuilder.prototype.selectStarFrom = function (table) {
    if (table === undefined) {
        throw new exceptions.IllegalArgument();
    }
    this.query += 'SELECT * FROM ' + table + ' ';
    return this;
};

QueryBuilder.prototype.select = function () {
    if (arguments.length === 0) {
        throw new exceptions.IllegalArgument();
    }
    this.query += 'SELECT ' + this._fieldsToCommaList(arguments) + ' ';
    return this;
};

QueryBuilder.prototype.deleteFrom = function (table) {
    if (typeof table !== 'string') {
        throw new exceptions.IllegalArgument();
    }
    this.query += 'DELETE FROM ' + table + ' ';
    return this;
};

QueryBuilder.prototype.from = function (table) {
    if (typeof table !== 'string') {
        throw new exceptions.IllegalArgument();
    }
    this.query += 'FROM ' + table + ' ';
    return this;
};

QueryBuilder.prototype.groupBy = function () {
    if (arguments.length === 0) {
        throw new exceptions.IllegalArgument();
    }
    this.query += 'GROUP BY ' + this._fieldsToCommaList(arguments) + ' ';
    return this;
};

QueryBuilder.prototype.limit = function (p1, p2) {
    if (p1 === undefined) {
        throw new exceptions.IllegalArgument();
    }
    if (p2 === undefined) {
        this.query += 'LIMIT ' + p1 + ' ';
    } else {
        this.query += 'LIMIT ' + p1 + ', ' + p2 + ' ';
    }
    return this;
};

QueryBuilder.prototype.build = function () {
    var query = this.query.trim();
    this.query = '';
    return query;
};

// QueryBuilder.prototype._conditions = function (conditions, operation) {
//     var query = '';
//     var key;
//     var orKeys = ['OR', 'or', '|', '||'];
//     var andKeys = ['AND', 'and', '&', '&&'];
//     var acceptedOperations = [
//         'equal', 'eq', '=',
//         'greater', 'gr',
//         'less', 'ls',
//         'greaterOrEqual', 'ge',
//         'lessOrEqual', 'le'
//     ];

//     for (key in conditions) {
//         if (typeof key !== 'string') {
//             throw new exceptions.IllegalArgument('All condition keys must be strings');
//         }
//         if (query !== '') {
//             query += operation + ' ';
//         }
//         var exp = conditions[key];

//         if (orKeys.indexOf(key) !== -1 && typeof exp === 'object') {
//             query += '(' + this._conditions(exp, 'OR') + ') ';
//         } else if (andKeys.indexOf(key) !== -1 && typeof exp === 'object') {
//             query += '(' + this._conditions(exp, 'AND') + ') ';
//         } else {
//             // Operations
//             return;
//         }
//     }

//     return query.trim();
// };

QueryBuilder.prototype.where = function (conditions) {
    this.query += 'WHERE ' + this._conditions(conditions, 'AND') + ' ';
    return this;
};

QueryBuilder.prototype.having = function (conditions) {
    this.query += 'HAVING ' + this._conditions(conditions, 'AND') + ' ';
    return this;
};

QueryBuilder.prototype.equal = function (left, right) {
    if (left === undefined || right === undefined) {
        throw new exceptions.IllegalArgument();
    }
    if (right === null) {
        return left + ' IS NULL';
    }
    return left + ' = ' + right;
};

QueryBuilder.prototype.less = function (left, right) {
    if (left === undefined || right === undefined) {
        throw new exceptions.IllegalArgument();
    }
    return left + ' < ' + right;
};

QueryBuilder.prototype.greater = function (left, right) {
    if (left === undefined || right === undefined) {
        throw new exceptions.IllegalArgument();
    }
    return left + ' > ' + right;
};

module.exports = QueryBuilder;