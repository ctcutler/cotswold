basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'app/lib/angular-1.0.2.min.js',
  'app/lib/jquery-1.8.2.min.js',
  'app/js/view.js',
  'app/js/spantree.js',
  'app/js/controller.js',
  'test/unit/**/*.js',
];

autoWatch = true;

browsers = ['Chrome'];

junitReporter = {
  outputFile: 'test_out/unit.xml',
  suite: 'unit'
};
