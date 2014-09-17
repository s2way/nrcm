/*jslint devel: true, node: true, indent: 4, unparam: true, stupid: true*/

'use strict';
var exceptions = require('./../../exceptions');

function QueryBuilder() {
    this.query = '';
}

QueryBuilder.prototype._fieldsToCommaList = function (fields, escaping) {
    var i, commaList = '';
    for (i in fields) {
        if (fields.hasOwnProperty(i)) {
            if (commaList !== '') {
                commaList += ', ';
            }
            if (escaping) {
                commaList += this.escape(fields[i]);
            } else {
                commaList += fields[i];
            }
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

QueryBuilder.prototype.update = function (table) {
    if (typeof table !== 'string') {
        throw new exceptions.IllegalArgument();
    }
    this.query += 'UPDATE ' + table + ' ';
    return this;
};

QueryBuilder.prototype.insertInto = function (table) {
    if (typeof table !== 'string') {
        throw new exceptions.IllegalArgument();
    }
    this.query += 'INSERT INTO ' + table + ' ';
    return this;
};

QueryBuilder.prototype.set = function (fields) {
    if (typeof fields !== 'object') {
        throw new exceptions.IllegalArgument();
    }
    var name, value, fieldList = '';
    for (name in fields) {
        if (fields.hasOwnProperty(name)) {
            if (fieldList !== '') {
                fieldList += ', ';
            }
            value = fields[name];
            fieldList += name + ' = ' + value;
        }
    }

    this.query += 'SET ' + fieldList + ' ';
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

QueryBuilder.prototype.in = function (field, params) {
    if (params === undefined || params.length === 0) {
        throw new exceptions.IllegalArgument();
    }
    if (field === null || typeof field !== 'string') {
        throw new exceptions.IllegalArgument();
    }
    return field + ' IN (' + this._fieldsToCommaList(params, true) + ')';
};

QueryBuilder.prototype.build = function () {
    var query = this.query.trim();
    this.query = '';
    return query;
};

QueryBuilder.prototype._conditions = function (conditions, operation) {
    var key, query = '';

    for (key in conditions) {
        if (conditions.hasOwnProperty(key)) {
            if (typeof key !== 'string') {
                throw new exceptions.IllegalArgument('All condition keys must be strings');
            }
            if (query !== '') {
                query += ' ' + operation + ' ';
            }
            query += conditions[key];
        }
    }

    return query.trim();
};

QueryBuilder.prototype.where = function () {
    this.query += 'WHERE ' + this._conditions(arguments, 'AND') + ' ';
    return this;
};

QueryBuilder.prototype.on = function () {
    if (arguments.length === 0) {
        throw new exceptions.IllegalArgument();
    }
    this.query += 'ON ' + this._conditions(arguments, 'AND') + ' ';
    return this;
};

QueryBuilder.prototype.join = function (table) {
    if (typeof table !== 'string') {
        throw new exceptions.IllegalArgument();
    }
    this.query += 'JOIN ' + table + ' ';
    return this;
};

QueryBuilder.prototype.innerJoin = function (table) {
    if (typeof table !== 'string') {
        throw new exceptions.IllegalArgument();
    }
    this.query += 'INNER JOIN ' + table + ' ';
    return this;
};

QueryBuilder.prototype.having = function () {
    this.query += 'HAVING ' + this._conditions(arguments, 'AND') + ' ';
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

QueryBuilder.prototype.notEqual = function (left, right) {
    if (left === undefined || right === undefined) {
        throw new exceptions.IllegalArgument();
    }
    if (right === null) {
        return left + ' IS NOT NULL';
    }
    return left + ' <> ' + right;
};

QueryBuilder.prototype.less = function (left, right) {
    if (left === undefined || right === undefined) {
        throw new exceptions.IllegalArgument();
    }
    return left + ' < ' + right;
};

QueryBuilder.prototype.lessOrEqual = function (left, right) {
    if (left === undefined || right === undefined) {
        throw new exceptions.IllegalArgument();
    }
    return left + ' <= ' + right;
};

QueryBuilder.prototype.greater = function (left, right) {
    if (left === undefined || right === undefined) {
        throw new exceptions.IllegalArgument();
    }
    return left + ' > ' + right;
};

QueryBuilder.prototype.greaterOrEqual = function (left, right) {
    if (left === undefined || right === undefined) {
        throw new exceptions.IllegalArgument();
    }
    return left + ' >= ' + right;
};

QueryBuilder.prototype.between = function (value, comp1, comp2) {
    if (value === undefined || comp1 === undefined || comp2 === undefined) {
        throw new exceptions.IllegalArgument();
    }
    return value + ' BETWEEN ' + comp1 + ' AND ' + comp2;
};

QueryBuilder.prototype.and = function () {
    if (arguments.length < 2) {
        throw new exceptions.IllegalArgument();
    }
    var i, expression = '(';
    for (i in arguments) {
        if (arguments.hasOwnProperty(i)) {
            if (expression !== '(') {
                expression += ' AND ';
            }
            expression += arguments[i];
        }
    }
    expression += ')';
    return expression;
};

QueryBuilder.prototype.or = function () {
    if (arguments.length < 2) {
        throw new exceptions.IllegalArgument();
    }
    var i, expression = '(';
    for (i in arguments) {
        if (arguments.hasOwnProperty(i)) {
            if (expression !== '(') {
                expression += ' OR ';
            }
            expression += arguments[i];
        }
    }
    expression += ')';
    return expression;
};

QueryBuilder.prototype.escape = function (value) {
    if (typeof value !== 'number') {
        return "'" + value + "'";
    }
    return value;
};


QueryBuilder.prototype.value = QueryBuilder.prototype.escape;
QueryBuilder.prototype['|'] = QueryBuilder.prototype.or;
QueryBuilder.prototype['||'] = QueryBuilder.prototype.or;
QueryBuilder.prototype['&'] = QueryBuilder.prototype.and;
QueryBuilder.prototype['&&'] = QueryBuilder.prototype.and;
QueryBuilder.prototype['='] = QueryBuilder.prototype.equal;
QueryBuilder.prototype['<>'] = QueryBuilder.prototype.notEqual;
QueryBuilder.prototype['!>'] = QueryBuilder.prototype.notEqual;
QueryBuilder.prototype['>'] = QueryBuilder.prototype.greater;
QueryBuilder.prototype['>='] = QueryBuilder.prototype.greaterOrEqual;
QueryBuilder.prototype['<'] = QueryBuilder.prototype.less;
QueryBuilder.prototype['<='] = QueryBuilder.prototype.lessOrEqual;

module.exports = QueryBuilder;