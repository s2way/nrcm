assert = require("assert")
StringUtils = require("./../../../src/Component/Builtin/StringUtils")

describe "StringUtils.js", ->
    describe "firstLetterUp", ->
        it "should capitalize the first letter", ->
            assert.equal "CamelCase", StringUtils.firstLetterUp("camelCase")
            assert.equal "Lower_case_underscored", StringUtils.firstLetterUp("lower_case_underscored")

        it "should return an empty string if an empty string is passed", ->
            assert.equal "", StringUtils.firstLetterUp("")

    describe "lowerCaseUnderscoredToCamelCase", ->
        it "should convert lowercase underscored strings to camelcase", ->
            assert.equal "CamelCase.CamelCase", StringUtils.lowerCaseUnderscoredToCamelCase("camel_case.camel_case")

    describe "camelCaseToLowerCaseUnderscored", ->
        it "should convert camelcase strings to lowercase underscored", ->
            assert.equal "camel_case.camel_case", StringUtils.camelCaseToLowerCaseUnderscored("CamelCase.CamelCase")