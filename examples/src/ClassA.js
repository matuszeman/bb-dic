//const classB = require('./ClassB');

module.exports = class ClassA {
  constructor(dep) {
    console.log('ClassA contstructoi', dep);//XXX
  }

  *asyncInit() {
    console.log('CLASS A INIT');//XXX
  }

  test() {
    console.log('>>>>>>>>>> test method ran');//XXX
  }
};
