'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');

var GlobalInstanceLoader = function () {
  function GlobalInstanceLoader() {
    _classCallCheck(this, GlobalInstanceLoader);
  }

  _createClass(GlobalInstanceLoader, [{
    key: 'hasInstance',
    value: function hasInstance(name) {
      return _.has(global, name);
    }
  }, {
    key: 'getInstance',
    value: function getInstance(name) {
      if (!this.hasInstance(name)) {
        throw new Error('Unknown global instance ' + name);
      }

      return global[name];
    }
  }]);

  return GlobalInstanceLoader;
}();