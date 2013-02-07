/**
 * @fileoverview The reporter of test result.
 * @author yo_waka
 */


/**
 * Module dependencies.
 */

var fs = require('fs');
var system = require('system');


/**
 * Colors of console.
 *
 * @enum {string}
 */
var Colors = {
  GREEN: '\u001b[32m',
  RED: '\u001b[31m',
  GRAY: '\u001b[90m',
  RESET: '\u001b[0m'
};


/**
 * Symbols of console.
 */
var Symbols = {
  OK: (system.os.name === 'windows') ? '\u221A' : '✓',
  NG: (system.os.name === 'windows') ? '\u00D7' : '✖',
  DOT: '.'
};


/**
 * @param {string} str .
 * @return {string} .
 */
function green(str) {
  return Colors.GREEN + str + Colors.RESET;
}

/**
 * @param {string} str .
 * @return {string} .
 */
function red(str) {
  return Colors.RED + str + Colors.RESET;
}

/**
 * @param {string} str .
 * @return {string} .
 */
function gray(str) {
  return Colors.GRAY + str + Colors.RESET;
}


/**
 * @interface
 */
function IReporter() {}

/**
 * @param {Object} testcase .
 */
IReporter.prototype.writeHead;

/**
 * @param {Object} result .
 */
IReporter.prototype.writeResult;

/**
 * @param {Object} results .
 */
IReporter.prototype.writeFinish;


/**
 * Output with dot format.
 *
 * @constructor
 * @implements {IReporter}
 */
function DotReporter() {
  this.stats_ = {
    passed: 0,
    failed: 0,
    time: 0,
    errors: []
  };
  console.log('');

  // TODO after 1.9 released, use system module
  fs.write('/dev/stdout', '  ', 'w');
  //system.stdout.write('  ');
}

/**
 * @type {Object}
 * @private
 */
DotReporter.prototype.stats_;

/**
 * @override
 */
DotReporter.prototype.writeHead = function(testcase) {
};

/**
 * @override
 */
DotReporter.prototype.writeResult = function(result) {
  this.stats_[result.success ? 'passed' : 'failed'] += 1;
  this.stats_.time += result.time;
  result.error && this.stats_.errors.push(result.error);

  if (result.success) {
    // TODO after 1.9 released, use system module
    fs.write('/dev/stdout', gray(Symbols.DOT), 'w');
    //system.stdout.write(gray(Symbols.DOT));
  } else {
    // TODO after 1.9 released, use system module
    fs.write('/dev/stdout', red(Symbols.DOT), 'w');
    //system.stdout.write(red(Symbols.DOT));
  }
};

/**
 * @override
 */
DotReporter.prototype.writeFinish = function(results) {
  var stats = this.stats_;

  var buf = [];
  buf.push('  ');
  if (results.success) {
    buf.push(green(stats.passed + ' tests complate'));
    buf.push(gray(' (' + stats.time + ' ms)'));
  } else {
    buf.push(
      red(Symbols.NG + ' ' + stats.failed + ' of ' +
          (stats.passed + stats.failed) + ' tests failed'));
    buf.push(gray(':'));
  }
  console.log('');
  console.log('');
  console.log(buf.join(''));
  console.log('');

  if (results.success) {
    console.log('');
  } else {
    stats.errors.forEach(function(err, idx) {
      console.log('  ' + (idx + 1) + ') ' + err.source + ':');
      console.log('     ' + red(err.message));
      err.stack.split('\n').forEach(function(s) {
        console.log('      ' + gray(s));
      });
    });
    console.log('');
  }
};


/**
 * Output with spec format.
 *
 * @constructor
 * @implements {IReporter}
 */
function SpecReporter() {
  this.stats_ = {
    passed: 0,
    failed: 0,
    time: 0,
    errors: []
  };
  console.log('');
}

/**
 * @type {Object}
 * @private
 */
SpecReporter.prototype.stats_;

/**
 * @override
 */
SpecReporter.prototype.writeHead = function(testcase) {
  console.log('');
  console.log('  ' + testcase.name);
};

/**
 * @override
 */
SpecReporter.prototype.writeResult = function(result) {
  this.stats_[result.success ? 'passed' : 'failed'] += 1;
  this.stats_.time += result.time;
  result.error && this.stats_.errors.push(result.error);

  var buf = [];
  buf.push('    ');
  if (result.success) {
    buf.push(green(Symbols.OK) + ' ' + gray(result.name));
  } else {
    buf.push(red(this.stats_.failed + ') ' + result.name));
  }
  buf.push(gray(' (' + result.time + ' ms)'));

  console.log(buf.join(''));
};

/**
 * @override
 */
SpecReporter.prototype.writeFinish = function(results) {
  var stats = this.stats_;

  var buf = [];
  buf.push('  ');
  if (results.success) {
    buf.push(green(stats.passed + ' tests complate'));
    buf.push(gray(' (' + stats.time + ' ms)'));
  } else {
    buf.push(
      red(Symbols.NG + ' ' + stats.failed + ' of ' +
          (stats.passed + stats.failed) + ' tests failed'));
    buf.push(gray(':'));
  }
  console.log('');
  console.log('');
  console.log(buf.join(''));
  console.log('');

  if (results.success) {
    console.log('');
  } else {
    stats.errors.forEach(function(err, idx) {
      console.log('  ' + (idx + 1) + ') ' + err.source + ':');
      console.log('     ' + red(err.message));
      err.stack.split('\n').forEach(function(s) {
        console.log('      ' + gray(s));
      });
    });
    console.log('');
  }
};


/**
 * Output with TAP format.
 *
 * @constructor
 * @implements {IReporter}
 */
function TapReporter() {
  this.stats_ = {
    total: 0,
    passed: 0,
    failed: 0
  };
}

/**
 * @type {Object}
 * @private
 */
TapReporter.prototype.stats_;

/**
 * @override
 */
TapReporter.prototype.writeHead = function(testcase) {
  console.log('# ' + testcase.name);
};

/**
 * @override
 */
TapReporter.prototype.writeResult = function(result) {
  this.stats_[result.success ? 'passed' : 'failed'] += 1;

  if (result.success) {
    console.log('ok ' + (++this.stats_.total) + ' ' + result.name);
  } else {
    console.log('not ok ' + (++this.stats_.total) + ' ' + result.name);
    console.log('  ' + result.error.message);
    result.error.stack.split('\n').forEach(function(s) {
      if (!!s) {
        console.log('      ' + s);
      }
    });
  }
};

/**
 * @override
 */
TapReporter.prototype.writeFinish = function(results) {
  var stats = this.stats_;

  console.log('1..' + stats.total);
  console.log('# tests ' + stats.total);
  console.log('# pass ' + stats.passed);
  console.log('# fail ' + stats.failed);
};


/**
 * Expose
 */
module.exports = {
  Dot: DotReporter,
  Spec: SpecReporter,
  Tap: TapReporter
};
