const expect = require('chai').expect;
const {Parser} = require('./index');

const functions = [
  function(arg1, arg2) {},
  function some(arg1, arg2) {},
  (arg1, arg2) => {},
  (arg1, arg2) => console.log,
];

describe('Parser', () => {
  beforeEach(function() {
    this.parser = new Parser();
  });

  describe('#parseFunction()', () => {
    for (const fn of functions) {
      it(`parses: ${fn.toString()}`, function() {
        const ret = this.parser.parseFunction(fn);
        expect(ret).eql({
          params: ['arg1', 'arg2']
        })
      });
    }
  });

});
