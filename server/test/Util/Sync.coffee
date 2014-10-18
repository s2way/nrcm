Sync = require("./../../src/Util/Sync")
assert = require("assert")
fs = require("fs")
path = require("path")

describe "Sync.js", ->
    describe "isFile", ->
        it "should return false if the file does not exist or if it exists but it is not a file", ->
            assert.equal false, Sync.isFile("/this/path/must/not/exist/please")

        it "should return true if the file exists", ->
            Sync.createFileIfNotExists "here.json", "{}"
            assert.equal true, Sync.isFile("here.json")
            fs.unlinkSync "here.json"

    describe "copyIfNotExists", ->
        it "should copy the file if it does not exist", ->
            Sync.createFileIfNotExists "here.json", "{}"
            Sync.copyIfNotExists "here.json", "there.json"
            assert.equal "{}", JSON.stringify(Sync.fileToJSON("there.json"))
            fs.unlinkSync "here.json"
            fs.unlinkSync "there.json"

        it "should return false if the file exists", ->
            Sync.createFileIfNotExists "here.json", "{}"
            assert.equal false, Sync.copyIfNotExists("here.json", "here.json")
            fs.unlinkSync "here.json"

        it "should throw a Fatal exception if it is not a file", ->
            e = undefined
            Sync.createDirIfNotExists "here"
            try
                assert.equal false, Sync.copyIfNotExists("here", "here")
                assert.fail()
            catch _error
                e = _error
                assert.equal "Fatal", e.name
            fs.rmdirSync "here"


    describe "copy", ->
        it "should copy the file Synchronously", ->
            Sync.createFileIfNotExists "here.json", "{}"
            Sync.copy "here.json", "there.json"
            assert.equal "{}", JSON.stringify(Sync.fileToJSON("there.json"))
            fs.unlinkSync "here.json"
            fs.unlinkSync "there.json"


    describe "loadNodeFilesIntoArray", ->
        it "should throw a Fatal exception if the param is not an array", ->
            e = undefined
            try
                Sync.loadNodeFilesIntoArray()
                return assert.fail()
            catch _error
                e = _error
                return assert.equal("Fatal", e.name)
            return

        it "should the node files into an array", ->
            file = undefined
            fileId = undefined
            fileName = undefined
            files = undefined
            filesJSON = undefined
            files =
                file0: "file0.js"
                file1: "file1.js"
                file2: "file2.js"

            file = undefined
            fileName = undefined
            filesJSON = undefined
            try
                for file of files
                    if files.hasOwnProperty(file)
                        fileName = files[file]
                        Sync.createFileIfNotExists fileName, "module.exports = { };"
                filesJSON = Sync.loadNodeFilesIntoArray(files)
            finally
                for file of files
                    if files.hasOwnProperty(file)
                        fileName = files[file]
                        fs.unlinkSync fileName
            fileId = undefined
            for fileId of filesJSON
                assert.equal JSON.stringify({}), JSON.stringify(filesJSON[fileId])    if filesJSON.hasOwnProperty(fileId)

    describe "fileToJSON", ->
        it "should return a valid JSON if the input file is a valid JSON file", ->
            fileName = undefined
            json = undefined
            json =
                prop: "value"
                anotherProp: "anotherValue"

            fileName = "fileToJSON.js"
            fs.writeFileSync fileName, JSON.stringify(json)
            assert.equal JSON.stringify(json), JSON.stringify(Sync.fileToJSON(fileName))
            fs.unlinkSync fileName

    describe "createDirIfNotExists", ->
        it "create the directory if it does not exists", ->
            dir = undefined
            dir = "path"
            Sync.createDirIfNotExists dir
            assert.equal true, fs.existsSync(dir)
            fs.rmdirSync dir
            return

        it "should work when called twice", ->
            dir = undefined
            dir = "path"
            Sync.createDirIfNotExists dir
            Sync.createDirIfNotExists dir
            assert.equal true, fs.existsSync(dir)
            fs.rmdirSync dir

    describe "createFileIfNotExists", ->
        it "create the file if it does not exists", ->
            dir = "file.txt"
            Sync.createFileIfNotExists dir
            assert.equal true, fs.existsSync(dir)
            fs.unlinkSync dir

        it "should work when called twice", ->
            dir = "file.txt"
            Sync.createFileIfNotExists dir
            Sync.createFileIfNotExists dir
            assert.equal true, fs.existsSync(dir)
            fs.unlinkSync dir

        it "should throw and exception if the file is a directory", ->
            dir = "file"
            fs.mkdirSync dir, parseInt("0777", 8)
            try
                Sync.createFileIfNotExists dir
            catch error
                e = error
                assert.equal "Fatal", e.name
                return
            finally
                fs.rmdirSync dir
            assert.fail()

    describe "listFilesFromDirRecursive", ->
        it "should return a list of files separated by / when the dir is valid and there are files and folders", ->
            files = undefined
            i = undefined
            list = undefined
            fs.mkdirSync "dir", parseInt("0777", 8)
            fs.mkdirSync "dir/sub", parseInt("0777", 8)
            files = [
                path.join("dir", "1.txt")
                path.join("dir", "2.txt")
                path.join("dir", "3.txt")
                path.join("dir", "sub", "4.txt")
            ]
            i = undefined
            list = undefined
            i = 0
            while i < files.length
                fs.writeFileSync files[i], ""
                i += 1
            try
                list = Sync.listFilesFromDir("dir")
            finally
                i = 0
                while i < files.length
                    fs.unlinkSync files[i]
                    i += 1
                fs.rmdirSync path.join("dir", "sub")
                fs.rmdirSync "dir"
            assert.equal JSON.stringify(files), JSON.stringify(list)

        it "should return an empty list when the dir is empty", ->
            dir = undefined
            dir = "dir"
            try
                fs.mkdirSync dir, parseInt("0777", 8)
                assert.equal "[]", JSON.stringify(Sync.listFilesFromDir(dir))
            finally
                fs.rmdirSync dir
