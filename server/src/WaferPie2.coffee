###
# Copyright 2014 Versul Tecnologias Ltda
# Copyright(c) 2015 Juliano Jorge Lazzarotto aka dOob
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
###

# Dependencies
path = require 'path'
_ = require 'underscore'
Exceptions = require './../src/Util/Exceptions'

class WaferPie

    # Defaults
    @VERSION: '2.0.0'

    # Configs
    @CONFIG_URL_FORMAT: 'urlFormat'

    # Exceptions
    @ERROR_INVALID_CONFIG_FILE: 'Config file is invalid.'
    @ERROR_INVALID_CONFIG_PARAMETER: 'Config parameter is invalid.'

    constructor: ->
        # Injectable dependencies
        @Files = require './../src/Component/Builtin/Files.coffee'

        @_paths =
            root: path.resolve './'

        @config = {}

    # Setup the basic configurations
    configure: (configFileName) ->
        try
            @config = @Files.file2JSON configFileName
        catch e
            throw new Exceptions.Fatal WaferPie.ERROR_INVALID_CONFIG_FILE, e

        # Setup defaults
        @config[WaferPie.CONFIG_URL_FORMAT] = '/$application/$controller' unless @config[WaferPie.CONFIG_URL_FORMAT]

        # Check config
        throw new Exceptions.Fatal WaferPie.ERROR_INVALID_CONFIG_PARAMETER unless _.isString @config[WaferPie.CONFIG_URL_FORMAT]

module.exports = WaferPie
