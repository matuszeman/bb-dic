'use strict';

const _ = require('lodash');
const acorn = require('acorn');
const loose = require('acorn/dist/acorn_loose');
//const walk = require('acorn/dist/walk');

require('acorn-es7-plugin')(acorn);

class Parser {
  constructor(options) {
    this.options = {
      asyncInitMethodNames: ['asyncInit']
    }
  }

  parseClass(target) {
    if(!_.isString(target)) {
      target = target.toString();
    }

    try {
      //const node = loose.parse_dammit(target, {
      const node = acorn.parse(target, {
        //sourceType: 'script',
        plugins: {
          asyncawait: true
        },
        ecmaVersion: 7
      });
      return this.parseNode(node);
    } catch(e) {
      console.log('XXX');//XXX
      console.log(e);//XXX
      throw e;
    }
  }

  parseFunction(fn) {
    // First match everything inside the function argument parens.
    var args = fn.toString().match(/function\s.*?\(([^)]*)\)/)[1];

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
