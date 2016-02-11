var ES5Class = require('es5class');
var sprintf = require('sprintf').sprintf;

var OptionsDsl = ES5Class.$define('OptionsDsl', function () {
  var keyExtractor = function (options, key) {
    if (!options.hasOwnProperty(key)) {
      throw new Error(sprintf('Expect options: %s to have argument: %s', JSON.stringify(options), key));
    }
    return options[key];
  };
  return {
    construct: function (options) {
      this.isDefined = !!options;
      this.options = options;
    },
    expect: function (objectToExtend, key) {
      var obj;
      
      if (objectToExtend instanceof Object) {
        obj = objectToExtend;
      } else {
        obj = {};
        key = objectToExtend;
      }

      if (!this.isDefined) {
        throw new Error(sprintf('Undefined options can not contain a %s key', key));
      }
      
      if (Array.isArray(key)) {
        return key.reduce(function (prev, cur) {
          prev[cur] = keyExtractor(this.options, cur);
          return prev;
        }.bind(this), obj);
      } else {
        return keyExtractor(this.options, key);
      }
    },
    default: function (key, value) {
      var obj = (obj instanceof Object) ? obj : {};
      
      if (!this.isDefined || !this.options.hasOwnProperty(key)) {
        return value;
      }
      return this.options[key];
    }
  };
});

var Options = module.exports = ES5Class.$define('Options', {
  options: function (options) {
    return Options.for(options);
  }
},
{ // Static methods
  for: function (options) {
    if (options && options.$className && options.$className === OptionsDsl.$className) {
      return options;
    }
    return OptionsDsl.$create(options);
  }
});
