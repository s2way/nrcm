/*jslint devel: true, node: true, indent: 4, unparam: true */
/*globals describe, it, beforeEach */
'use strict';
var assert = require('assert');
var util = require('util');

var QueryBuilder = require('./../../src/Model/QueryBuilder');

describe('QueryBuilder.js', function () {

    var $;

    beforeEach(function () {
        $ = new QueryBuilder();
    });

    describe('selectStarFrom', function () {

        it('should output SELECT * FROM + table', function () {
            assert.equal('SELECT * FROM sky', $.selectStarFrom('sky').build());
        });

        it('should throw an exception if the parameter table is not passed', function () {
            try {
                $.selectStarFrom();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('select', function () {

        it('should output SELECT + the parameters if they are passed', function () {
            assert.equal('SELECT c1, c2, c3', $.select('c1', 'c2', 'c3').build());
        });

        it('should throw an exception if the parameter table is not passed', function () {
            try {
                $.select();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('from', function () {

        it('should output FROM + table if the parameter is passed', function () {
            assert.equal('FROM sky', $.from('sky').build());
        });

        it('should throw an exception if the parameter table is not a string', function () {
            try {
                $.from(1);
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('deleteFrom', function () {

        it('should output DELETE FROM + table if the parameter is passed', function () {
            assert.equal('DELETE FROM sky', $.deleteFrom('sky').build());
        });

        it('should throw an exception if the parameter table is not a string', function () {
            try {
                $.deleteFrom(1);
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('where', function () {

        it('should output a WHERE + conditions separated by ANDs', function () {
            assert.equal('WHERE a > 10 AND b < 10', $.where('a > 10', 'b < 10').build());
        });
    });

    describe('join', function () {

        it('should output a JOIN + table name', function () {
            assert.equal('JOIN sky', $.join('sky').build());
        });

        it('should throw an exception if no parameters are passed', function () {
            try {
                $.join();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('innerJoin', function () {

        it('should output an INNER JOIN + table name', function () {
            assert.equal('INNER JOIN sky', $.innerJoin('sky').build());
        });

        it('should throw an exception if no parameters are passed', function () {
            try {
                $.innerJoin();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('on', function () {

        it('should output an ON + conditions', function () {
            assert.equal('ON a = b AND c = d', $.on('a = b', 'c = d').build());
        });

        it('should throw an exception if no parameters are passed', function () {
            try {
                $.on();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('update', function () {

        it('should output an UPDATE + table name', function () {
            assert.equal('UPDATE sky', $.update('sky').build());
        });

        it('should throw an exception if no parameters are passed', function () {
            try {
                $.update();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('set', function () {

        it('should output a SET + fields and values', function () {
            assert.equal("SET one = 1, two = 2, three = 'three'", $.set({
                'one' : $.value(1),
                'two' : $.value(2),
                'three' : $.value('three')
            }).build());
        });

        it('should throw an exception if no parameters are passed', function () {
            try {
                $.set();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('insertInto', function () {

        it('should output an INSERT INTO + table name', function () {
            assert.equal('INSERT INTO sky', $.insertInto('sky').build());
        });

        it('should throw an exception if no parameters are passed', function () {
            try {
                $.insertInto();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('groupBy', function () {

        it('should output GROUP BY + fields if they are passed', function () {
            assert.equal('GROUP BY c1, c2, c3', $.groupBy('c1', 'c2', 'c3').build());
        });

        it('should throw an exception if no parameters are passed', function () {
            try {
                $.groupBy();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('having', function () {

        it('should output HAVING + conditions', function () {
            assert.equal('HAVING a > 10 AND b < 10', $.having('a > 10', 'b < 10').build());
        });

    });

    describe('limit', function () {

        it('should output LIMIT + parameters if they are passed',  function () {
            assert.equal('LIMIT :limit, 1000', $.limit(':limit', 1000).build());
        });

        it('should output LIMIT + parameter if only one is passed', function () {
            assert.equal('LIMIT 1', $.limit(1).build());
        });

        it('should throw an exception if no parameters are passed', function () {
            try {
                $.limit();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    // Operations
    describe('equal', function () {

        it('should output an equals expression', function () {
            assert.equal('x = 10', $.equal('x', 10));
        });

        it('should output an IS NULL if the right parameter is null', function () {
            assert.equal('x IS NULL', $.equal('x', null));
        });

        it('should throw an IllegalArgument exception if one of the parameters is undefined', function () {
            try {
                $.equal();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('notEqual', function () {

        it('should output a not equals expression', function () {
            assert.equal('x <> 10', $.notEqual('x', 10));
        });

        it('should output an IS NOT NULL if the right parameter is null', function () {
            assert.equal('x IS NOT NULL', $.notEqual('x', null));
        });

        it('should throw an IllegalArgument exception if one of the parameters is undefined', function () {
            try {
                $.notEqual();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('less', function () {

        it('should output a less expression', function () {
            assert.equal('x < 10', $.less('x', 10));
        });

        it('should throw an exception if one of the parameters is missing', function () {
            try {
                $.less(1);
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('lessOrEqual', function () {

        it('should output a less or equal expression', function () {
            assert.equal('x <= 10', $.lessOrEqual('x', 10));
        });

        it('should throw an exception if one of the parameters is missing', function () {
            try {
                $.lessOrEqual(1);
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('greater', function () {

        it('should output a greater expression', function () {
            assert.equal('x > 10', $.greater('x', 10));
        });

        it('should throw an exception if one of the parameters is missing', function () {
            try {
                $.greater(1);
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('greaterOrEqual', function () {

        it('should output a greater or equal expression', function () {
            assert.equal('x >= 10', $.greaterOrEqual('x', 10));
        });

        it('should throw an exception if one of the parameters is missing', function () {
            try {
                $.greaterOrEqual(1);
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('between', function () {

        it('should output a BETWEEN expression', function () {
            assert.equal('b BETWEEN a AND c', $.between('b', 'a', 'c'));
        });

        it('should throw an exception if one of the parameters is missing', function () {
            try {
                $.between();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

    });

    describe('or', function () {

        it('should throw an IllegalArgument exception if less than two parameters are passed', function () {
            try {
                $.or();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

        it('should output an OR expression', function () {
            assert.equal('(a OR b OR c)', $.or('a', 'b', 'c'));
        });

    });

    describe('and', function () {

        it('should throw an IllegalArgument exception if less than two parameters are passed', function () {
            try {
                $.and();
                assert.fail();
            } catch (e) {
                assert.equal('IllegalArgument', e.name);
            }
        });

        it('should output an AND expression', function () {
            assert.equal('(a AND b AND c)', $.and('a', 'b', 'c'));
        });

    });

    describe('Integration Tests', function () {

        it('should output: SELECT c1, c2, c3 FROM sky WHERE y = :y AND z < :z AND x BETWEEN NOW() AND AAAA AND (y = 10 OR z > 20 OR x BETWEEN 10 AND 200)', function () {

            var sql = $
                .select('c1', 'c2', 'c3')
                .from('sky')
                .where(
                    $.equal('y', ':y'),
                    $.less('z', ':z'),
                    $.between('x', 'NOW()', 'AAAA'),
                    $.or(
                        $.equal('y', $.value(10)),
                        $.greater('z', $.value(20)),
                        $.between('x', $.value(10), $.value(200))
                    )
                ).build();
            var expected = "SELECT c1, c2, c3 FROM sky WHERE y = :y AND z < :z AND x BETWEEN NOW() AND AAAA AND (y = 10 OR z > 20 OR x BETWEEN 10 AND 200)";
            assert.equal(expected, sql);
        });

        it('should output: SELECT * FROM sky GROUP BY x HAVING z > 10 AND z < 100 LIMIT 100, 1000', function () {
            var sql = $
                .selectStarFrom('sky')
                .groupBy('x')
                .having(
                    $.greater('z', 10),
                    $.less('z', 100)
                )
                .limit(100, 1000)
                .build();
            var expected = 'SELECT * FROM sky GROUP BY x HAVING z > 10 AND z < 100 LIMIT 100, 1000';
            assert.equal(expected, sql);
        });

        it('should output: DELETE FROM sky WHERE x = y', function () {
            var sql = $
                .deleteFrom('sky')
                .where(
                    $.equal('x', 'y')
                ).build();
            var expected = 'DELETE FROM sky WHERE x = y';
            assert.equal(expected, sql);
        });

        it('should output: UPDATE sky SET one = 1, two = 2', function () {
            var sql = $
                .update('sky')
                .set({
                    'one' : 1,
                    'two' : 2
                })
                .where(
                    $.or(
                        $.greater('id', 0),
                        $.less('id', 1000)
                    )
                ).build();
            var expected = 'UPDATE sky SET one = 1, two = 2 WHERE (id > 0 OR id < 1000)';
            assert.equal(expected, sql);
        });

        it('should output: INSERT INTO log SET message = \'This is a message\'', function () {
            var sql = $
                .insertInto('log')
                .set({
                    'message' : $.value('This is a message')
                }).build();
            var expected = 'INSERT INTO log SET message = \'This is a message\'';
            assert.equal(expected, sql);
        });

        it('should output: SELECT * FROM sky INNER JOIN heaven ON heaven.jesus = sky.jesus', function () {
            var sql = $
                .selectStarFrom('sky')
                .innerJoin('heaven')
                .on(
                    $.equal('heaven.jesus', 'sky.jesus')
                ).build();
            var expected = 'SELECT * FROM sky INNER JOIN heaven ON heaven.jesus = sky.jesus';
            assert.equal(expected, sql);
        });

    });

});