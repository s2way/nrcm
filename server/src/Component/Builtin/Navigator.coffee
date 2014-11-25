class Navigator

    get: (object, expression) ->
        parts = expression.split('.')
        for part in parts
            return object[part] unless object[part]?
            object = object[part]
        object

module.exports = Navigator