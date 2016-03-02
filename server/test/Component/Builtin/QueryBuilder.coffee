assert = require("assert")
util = require("util")
QueryBuilder = require("./../../../src/Component/Builtin/QueryBuilder")
expect = require 'expect.js'

describe 'QueryBuilder.js', ->
    $ = null
    beforeEach ->
        $ = new QueryBuilder()

    describe 'selectStarFrom', ->
        it 'should output SELECT * FROM + table', ->
            assert.equal "SELECT * FROM sky", $.selectStarFrom("sky").build()

        it 'should throw an exception if the parameter table is not passed', ->
            try
                $.selectStarFrom()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'selectCountStarFrom', ->
        it 'should output SELECT COUNT(*) AS count FROM + table', ->
            assert.equal "SELECT COUNT(*) AS count FROM sky", $.selectCountStarFrom("sky").build()

        it 'should throw an exception if the parameter table is not passed', ->
            expect(->
                $.selectCountStarFrom()
            ).to.throwException((e) ->
                expect(e.name).to.be 'IllegalArgument'
            )

    describe 'select', ->
        it 'should output SELECT + the parameters if they are passed', ->
            assert.equal "SELECT c1, c2, c3", $.select("c1", "c2", "c3").build()

        it 'should throw an exception if the parameter table is not passed', ->
            try
                $.select()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'from', ->
        it 'should output FROM + table if the parameter is passed', ->
            assert.equal "FROM sky", $.from("sky").build()

        it 'should throw an exception if the parameter table is not a string', ->
            try
                $.from 1
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'deleteFrom', ->
        it 'should output DELETE FROM + table if the parameter is passed', ->
            assert.equal "DELETE FROM sky", $.deleteFrom("sky").build()

        it 'should throw an exception if the parameter table is not a string', ->
            try
                $.deleteFrom 1
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'where', ->
        it 'should output a WHERE + conditions separated by ANDs if multiple parameters are passed', ->
            assert.equal "WHERE a > 10 AND b < 10", $.where("a > 10", "b < 10").build()

        it 'should output a WHERE + conditions separated by ANDs if the parameter is an array containing the conditions', ->
            assert.equal "WHERE a > 10 AND b < 10", $.where(["a > 10", "b < 10"]).build()

    describe 'join', ->
        it 'should output a JOIN + table name', ->
            assert.equal "JOIN sky", $.join("sky").build()

        it 'should throw an exception if no parameters are passed', ->
            try
                $.join()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'innerJoin', ->
        it 'should output an INNER JOIN + table name', ->
            assert.equal "INNER JOIN sky", $.innerJoin("sky").build()

        it 'should throw an exception if no parameters are passed', ->
            try
                $.innerJoin()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'leftJoin', ->
        it 'should output an LEFT JOIN + table name', ->
            assert.equal "LEFT JOIN sky", $.leftJoin("sky").build()

        it 'should throw an exception if no parameters are passed', ->
            try
                $.leftJoin()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'on', ->
        it 'should output an ON + conditions', ->
            assert.equal "ON a = b AND c = d", $.on("a = b", "c = d").build()

        it 'should throw an exception if no parameters are passed', ->
            try
                $.on()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'update', ->
        it 'should output an UPDATE + table name', ->
            assert.equal "UPDATE sky", $.update("sky").build()

        it 'should throw an exception if no parameters are passed', ->
            try
                $.update()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'set', ->
        it 'should output a SET + fields and values', ->
            assert.equal "SET one = 1, two = 2, three = 'three'", $.set(
                one: $.value(1)
                two: $.value(2)
                three: $.value("three")
            ).build()

        it 'should throw an exception if no parameters are passed', ->
            try
                $.set()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'insertInto', ->
        it 'should output an INSERT INTO + table name', ->
            assert.equal "INSERT INTO sky", $.insertInto("sky").build()

        it 'should throw an exception if no parameters are passed', ->
            try
                $.insertInto()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'orderBy', ->
        it 'should output an order by expression', ->
            assert.equal "ORDER BY id DESC", $.orderBy("id", "DESC").build()

        it 'should throw an exception if no parametes were passed', ->
            try
                $.orderBy()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'groupBy', ->
        it 'should output GROUP BY + fields if they are passed', ->
            assert.equal "GROUP BY c1, c2, c3", $.groupBy("c1", "c2", "c3").build()

        it 'should throw an exception if no parameters are passed', ->
            try
                $.groupBy()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'having', ->
        it 'should output HAVING + conditions', ->
            assert.equal "HAVING a > 10 AND b < 10", $.having("a > 10", "b < 10").build()

    describe 'limit', ->
        it 'should output LIMIT + parameters if they are passed', ->
            assert.equal "LIMIT :limit, 1000", $.limit(":limit", 1000).build()

        it 'should output LIMIT + parameter if only one is passed', ->
            assert.equal "LIMIT 1", $.limit(1).build()

        it 'should throw an exception if no parameters are passed', ->
            try
                $.limit()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    # Operations
    describe 'equal', ->
        it 'should output an equals expression', ->
            assert.equal "x = 10", $.equal("x", 10)

        it 'should output an IS NULL if the right parameter is null', ->
            assert.equal "x IS NULL", $.equal("x", null)

        it 'should throw an IllegalArgument exception if one of the parameters is undefined', ->
            try
                $.equal()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    # Operations
    describe 'like', ->
        it 'should output a like expression', ->
            assert.equal "x LIKE 10", $.like("x", 10)

        it 'should throw an IllegalArgument exception if one of the parameters is undefined', ->
            expect(-> $.like()).to.throwException((e) -> expect(e.name).to.be 'IllegalArgument')

    describe 'notEqual', ->
        it 'should output a not equals expression', ->
            assert.equal "x <> 10", $.notEqual("x", 10)

        it 'should output an IS NOT NULL if the right parameter is null', ->
            assert.equal "x IS NOT NULL", $.notEqual("x", null)

        it 'should throw an IllegalArgument exception if one of the parameters is undefined', ->
            try
                $.notEqual()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'less', ->
        it 'should output a less expression', ->
            assert.equal "x < 10", $.less("x", 10)

        it 'should throw an exception if one of the parameters is missing', ->
            try
                $.less 1
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'lessOrEqual', ->
        it 'should output a less or equal expression', ->
            assert.equal "x <= 10", $.lessOrEqual("x", 10)

        it 'should throw an exception if one of the parameters is missing', ->
            try
                $.lessOrEqual 1
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'greater', ->
        it 'should output a greater expression', ->
            assert.equal "x > 10", $.greater("x", 10)

        it 'should throw an exception if one of the parameters is missing', ->
            try
                $.greater 1
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'greaterOrEqual', ->
        it 'should output a greater or equal expression', ->
            assert.equal "x >= 10", $.greaterOrEqual("x", 10)

        it 'should throw an exception if one of the parameters is missing', ->
            try
                $.greaterOrEqual 1
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'between', ->
        it 'should output a BETWEEN expression', ->
            assert.equal "b BETWEEN a AND c", $.between("b", "a", "c")

        it 'should throw an exception if one of the parameters is missing', ->
            try
                $.between()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'in', ->
        it 'should output an IN expression', ->
            assert.equal "id IN (1, 2, 3)", $["in"]("id", [
                1
                2
                3
            ])
            assert.equal "id IN ('1', 'a', 3)", $["in"]("id", [
                "1"
                "a"
                3
            ])

        it 'should throw an exception if no parameters were passed', ->
            try
                $["in"]()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

    describe 'as', ->
        it 'should throw an IllegalArgument exception if origin or alias are not a string', ->
            try
                $.as()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

        it 'should output an AS expression if arguments are right', ->
            assert.equal "name AS newName", $.as "name", "newName"

    describe 'or', ->
        it 'should throw an IllegalArgument exception if less than two parameters are passed', ->
            try
                $.or()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

        it 'should output an OR expression if multiple parameters are passed', ->
            assert.equal "(a OR b OR c)", $.or("a", "b", "c")

        it 'should output an OR expression if a single array is passed', ->
            assert.equal "(a OR b OR c)", $.or(["a", "b", "c"])

    describe 'escape', ->
        it 'should output an quoted string if value is string', ->
            assert.equal "'string'", $.escape "string"

        it 'should output a non-quoted null value if the parameter is null', ->
            assert.equal null, $.escape null

    describe 'and', ->
        it 'should throw an IllegalArgument exception if less than two parameters are passed', ->
            try
                $.and()
                assert.fail()
            catch e
                assert.equal "IllegalArgument", e.name

        it 'should output an AND expression if multiple parameters are passed', ->
            assert.equal "(a AND b AND c)", $.and("a", "b", "c")

        it 'should output an AND expression if a single array is passed', ->
            assert.equal "(a AND b AND c)", $.and(["a", "b", "c"])

    describe 'Integration Tests', ->
        it 'should output: SELECT c1, c2, c3 FROM sky WHERE y = :y AND z < :z AND x BETWEEN NOW() AND AAAA AND (y = 10 OR z > 20 OR x BETWEEN 10 AND 200)', ->
            sql = $.select("c1", "c2", "c3")
            .from("sky")
            .where(
                $.equal("y", ":y"),
                $.less("z", ":z"),
                $.between("x", "NOW()", "AAAA"),
                $.or(
                    $.equal("y", $.value(10)),
                    $.greater("z", $.value(20)),
                    $.between("x", $.value(10), $.value(200))
                )
            ).build()
            expected = "SELECT c1, c2, c3 FROM sky WHERE y = :y AND z < :z AND x BETWEEN NOW() AND AAAA AND (y = 10 OR z > 20 OR x BETWEEN 10 AND 200)"
            assert.equal expected, sql

        it 'should output: SELECT * FROM sky GROUP BY x HAVING z > 10 AND z < 100 LIMIT 100, 1000', ->
            sql = $.selectStarFrom("sky").groupBy("x").having($.greater("z", 10), $.less("z", 100)).limit(100, 1000).build()
            expected = "SELECT * FROM sky GROUP BY x HAVING z > 10 AND z < 100 LIMIT 100, 1000"
            assert.equal expected, sql

        it 'should output: DELETE FROM sky WHERE x = y', ->
            sql = $.deleteFrom("sky").where($.equal("x", "y")).build()
            expected = "DELETE FROM sky WHERE x = y"
            assert.equal expected, sql

        it 'should output: UPDATE sky SET one = 1, two = 2', ->
            sql = $.update("sky").set(
                one: 1
                two: 2
            ).where($.or($.greater("id", 0), $.less("id", 1000))).build()
            expected = "UPDATE sky SET one = 1, two = 2 WHERE (id > 0 OR id < 1000)"
            assert.equal expected, sql

        it "should output: INSERT INTO log SET message = 'This is a message'", ->
            sql = $.insertInto("log").set(message: $.value("This is a message")).build()
            expected = "INSERT INTO log SET message = 'This is a message'"
            assert.equal expected, sql

        it 'should output: SELECT * FROM sky INNER JOIN heaven ON heaven.jesus = sky.jesus', ->
            sql = $.selectStarFrom("sky").innerJoin("heaven").on($.equal("heaven.jesus", "sky.jesus")).build()
            expected = "SELECT * FROM sky INNER JOIN heaven ON heaven.jesus = sky.jesus"
            assert.equal expected, sql
