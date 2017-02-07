'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');

var DicConfigLoader = function () {
  function DicConfigLoader(opts, dic) {
    _classCallCheck(this, DicConfigLoader);

    this.options = _.defaults(opts, {
      optionsSuffix: 'Opts'
    });
    this.dic = dic;
  }

  _createClass(DicConfigLoader, [{
    key: 'loadConfig',
    value: function loadConfig(obj) {
      var _this = this;

      _.each(obj.options, function (opts, service) {
        _this.dic.registerInstance(service + _this.options.optionsSuffix, opts);
      });

      _.each(obj.aliases, function (alias, service) {
        _this.dic.alias(alias, service);
      });

      _.each(obj.bindings, function (binding, containerName) {
        var child = _this.dic.getChild(containerName);

        var loader = new DicConfigLoader(_this.options, child);
        loader.loadConfig(binding);

        _.each(binding.imports, function (dicService, childService) {
          _this.dic.alias(dicService, containerName + _this.dic.options.containerSeparator + childService);
        });
      });
    }
  }]);

  return DicConfigLoader;
}();

module.exports = DicConfigLoader;