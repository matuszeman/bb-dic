'use strict';

const _ = require('lodash');
const acorn = require('acorn');

class Parser {
  constructor(options) {
    this.options = _.defaults({
      asyncInitMethodNames: ['asyncInit'],
      ecmaVersion: 8
    }, options);
  }

  parseClass(target) {
    if(!_.isString(target)) {
      target = target.toString();
    }

    try {
      const node = acorn.parse(target, {
        ecmaVersion: this.options.ecmaVersion
      });
      return this.parseNode(node);
    } catch(e) {
      console.log('Failed to parse the class');//XXX
      console.log(target);//XXX
      console.log(e);//XXX
      throw e;
    }
  }

  parseFunction(fn) {
    const fnString = fn.toString();
    // First match everything inside the function argument parens.
    let matches = fnString.match(/function\s.*?\(([^)]*)\)/);
    if(matches === null) {
      //try arrow function (arg1, ...) =>
      matches = fnString.match(/\(([^)]*)\)\s*=>/);
    }
    if(!matches) {
      throw new Error('Function with invalid format, only "function()" and "() =>" allowed');
    }
    const args = matches[1];

    // Split the arguments string into an array comma delimited.
    const params = args.split(',').map(function(arg) {
      // Ensure no inline comments are parsed and trim the whitespace.
      return arg.replace(/\/\*.*\*\//, '').trim();
    }).filter(function(arg) {
      // Ensure no undefined values are added.
      return arg;
    });

    return {
      params: params
    }
  }

  isAsyncInitMethodName(name) {
    return _.includes(this.options.asyncInitMethodNames, name);
  }

  parseNode(node) {
    switch(node.type) {
      case 'Program':
        return this.parseNode(node.body[0]);
        break;
      case 'ClassDeclaration':
        return this.parseNode(node.body);
        break;
      case 'ClassBody':
        const ret = {
          factory: {
            type: 'ClassConstructor',
            params: []
          }
        };
        for (const methodNode of node.body) {
          if(methodNode.type === 'MethodDefinition') {
            if (methodNode.kind === 'constructor') {
              ret.factory = {
                type: 'ClassConstructor',
                params: this.getFunctionParams(methodNode.value)
              }
            }

            if (methodNode.kind === 'method') {
              if (this.isAsyncInitMethodName(methodNode.key.name)) {
                //TODO promises, etc etc?
                let type = 'sync';
                if (methodNode.value.generator) {
                  type = 'generator';
                // It looks like the plugin above strips "methodNode.value.async" async property at the end causing
                // jsdoc2md to fail: "Unable to parse .../bb-dic/src/parser.js: Unexpected token )"
                // https://www.npmjs.com/package/jsdoc-strip-async-await
                //} else if (methodNode.value.async) {
                } else if (methodNode.value['async']) {
                  type = 'async';
                }

                ret.init = {
                  name: methodNode.key.name,
                  type: type
                };
              }
            }
          }
        }
        return ret;
        break;
      case 'FunctionDeclaration':
        const ret1 = {};
        ret1.factory = {
          type: 'ClassConstructor',
          params: this.getFunctionParams(node)
        };
        return ret1;
      default:
        console.log(node);//XXX
        throw new Error(`Parser for type ${node.type} not implemented`);
    }
  }

  getFunctionParams(node) {
    if (!node.params) {
      throw new Error('Node has got no params');
    }

    return node.params.map(paramNode => paramNode.name);
  }

}

module.exports = Parser;
