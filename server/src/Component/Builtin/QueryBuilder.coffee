Exceptions = require("./../../Util/Exceptions")

class QueryBuilder
    constructor: ->
        @query = ""

    _fieldsToCommaList: (fields, escaping) ->
        i = undefined
        commaList = ""
        for i of fields
            if fields.hasOwnProperty(i)
                commaList += ", "  if commaList isnt ""
                if escaping
                    commaList += @escape(fields[i])
                else
                    commaList += fields[i]
        commaList

    selectStarFrom: (table) ->
        throw new Exceptions.IllegalArgument() if table is undefined
        @query += "SELECT * FROM " + table + " "
        this

    select: ->
        throw new Exceptions.IllegalArgument() if arguments.length is 0
        @query += "SELECT " + @_fieldsToCommaList(arguments) + " "
        this

    deleteFrom: (table) ->
        throw new Exceptions.IllegalArgument() if typeof table isnt "string"
        @query += "DELETE FROM " + table + " "
        this

    from: (table) ->
        throw new Exceptions.IllegalArgument() if typeof table isnt "string"
        @query += "FROM " + table + " "
        this

    update: (table) ->
        throw new Exceptions.IllegalArgument() if typeof table isnt "string"
        @query += "UPDATE " + table + " "
        this

    insertInto: (table) ->
        throw new Exceptions.IllegalArgument() if typeof table isnt "string"
        @query += "INSERT INTO " + table + " "
        this

    set: (fields) ->
        throw new Exceptions.IllegalArgument() if typeof fields isnt "object"
        name = undefined
        value = undefined
        fieldList = ""
        for name of fields
            if fields.hasOwnProperty(name)
                fieldList += ", "  if fieldList isnt ""
                value = fields[name]
                fieldList += name + " = " + value
        @query += "SET " + fieldList + " "
        this

    groupBy: ->
        throw new Exceptions.IllegalArgument() if arguments.length is 0
        @query += "GROUP BY " + @_fieldsToCommaList(arguments) + " "
        this

    orderBy: (fieldList, direction = "ASC") ->
        throw new Exceptions.IllegalArgument() if arguments.length is 0
        fields = if Array.isArray(fieldList) then fieldList.join() else fieldList
        @query += "ORDER BY " + fieldList + " " + direction + " "
        this

    limit: (p1, p2) ->
        throw new Exceptions.IllegalArgument() if p1 is undefined
        if p2 is undefined
            @query += "LIMIT " + p1 + " "
        else
            @query += "LIMIT " + p1 + ", " + p2 + " "
        this

    in: (field, params) ->
        throw new Exceptions.IllegalArgument() if params is undefined or params.length is 0
        throw new Exceptions.IllegalArgument() if field is null or typeof field isnt "string"
        field + " IN (" + @_fieldsToCommaList(params, true) + ")"

    build: ->
        query = @query.trim()
        @query = ""
        query

    _conditions: (conditions, operation) ->
        conditions = conditions[0] if conditions.length is 1 and Array.isArray(conditions[0])
        query = ""
        for key of conditions
            if conditions.hasOwnProperty(key)
                throw new Exceptions.IllegalArgument("All condition keys must be strings")  if typeof key isnt "string"
                query += " " + operation + " "  if query isnt ""
                query += conditions[key]
        query.trim()

    where: ->
        @query += "WHERE " + @_conditions(arguments, "AND") + " "
        this

    on: ->
        throw new Exceptions.IllegalArgument() if arguments.length is 0
        @query += "ON " + @_conditions(arguments, "AND") + " "
        this

    join: (table) ->
        throw new Exceptions.IllegalArgument() if typeof table isnt "string"
        @query += "JOIN " + table + " "
        this

    innerJoin: (table) ->
        throw new Exceptions.IllegalArgument() if typeof table isnt "string"
        @query += "INNER JOIN " + table + " "
        this

    having: ->
        @query += "HAVING " + @_conditions(arguments, "AND") + " "
        this

    equal: (left, right) ->
        throw new Exceptions.IllegalArgument() if left is undefined or right is undefined
        return left + " IS NULL"  if right is null
        left + " = " + right

    like: (left, right) ->
        throw new Exceptions.IllegalArgument() if left is undefined or right is undefined
        left + " LIKE " + right

    notEqual: (left, right) ->
        throw new Exceptions.IllegalArgument() if left is undefined or right is undefined
        return left + " IS NOT NULL"  if right is null
        left + " <> " + right

    less: (left, right) ->
        throw new Exceptions.IllegalArgument() if left is undefined or right is undefined
        left + " < " + right

    lessOrEqual: (left, right) ->
        throw new Exceptions.IllegalArgument() if left is undefined or right is undefined
        left + " <= " + right

    greater: (left, right) ->
        throw new Exceptions.IllegalArgument() if left is undefined or right is undefined
        left + " > " + right

    greaterOrEqual: (left, right) ->
        throw new Exceptions.IllegalArgument() if left is undefined or right is undefined
        left + " >= " + right

    between: (value, comp1, comp2) ->
        throw new Exceptions.IllegalArgument() if value is undefined or comp1 is undefined or comp2 is undefined
        value + " BETWEEN " + comp1 + " AND " + comp2

    and: ->
        conditions = arguments
        conditions = arguments[0] if arguments.length is 1 and Array.isArray(arguments[0])
        throw new Exceptions.IllegalArgument() if conditions.length < 2
        expression = "("
        for i of conditions
            if conditions.hasOwnProperty(i)
                expression += " AND "  if expression isnt "("
                expression += conditions[i]
        expression += ")"
        expression

    or: ->
        conditions = arguments
        conditions = arguments[0] if arguments.length is 1 and Array.isArray(arguments[0])
        throw new Exceptions.IllegalArgument() if conditions.length < 2
        i = undefined
        expression = "("
        for i of conditions
            if conditions.hasOwnProperty(i)
                expression += " OR "  if expression isnt "("
                expression += conditions[i]
        expression += ")"
        expression

    escape: (value) ->
        return "'" + value + "'"  if typeof value isnt "number"
        value

QueryBuilder::value = QueryBuilder::escape
QueryBuilder::["|"] = QueryBuilder::or
QueryBuilder::["||"] = QueryBuilder::or
QueryBuilder::["&"] = QueryBuilder::and
QueryBuilder::["&&"] = QueryBuilder::and
QueryBuilder::["="] = QueryBuilder::equal
QueryBuilder::["<>"] = QueryBuilder::notEqual
QueryBuilder::["!>"] = QueryBuilder::notEqual
QueryBuilder::[">"] = QueryBuilder::greater
QueryBuilder::[">="] = QueryBuilder::greaterOrEqual
QueryBuilder::["<"] = QueryBuilder::less
QueryBuilder::["<="] = QueryBuilder::lessOrEqual

module.exports = QueryBuilder
