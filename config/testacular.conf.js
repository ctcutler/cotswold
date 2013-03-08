basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'app/lib/*.js',
  'app/js/layout.js',
  'app/js/hardcoded.js
  'app/js/spantree.js
  'app/js/cotswold.js
  'app/js/directives.js
  'test/unit/**/*.js'
];

autoWatch = true;

browsers = ['Chrome'];

junitReporter = {
  outputFile: 'test_out/unit.xml',
  suite: 'unit'
};
