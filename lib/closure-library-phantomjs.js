/**
 * @fileoverview The google-closure-library's test reporter in PhantomJS.
 * @author yo_waka <y.wakahara@gmail.com>
 */


/**
 * Module dependencies.
 */

var system = require('system');
var webpage = require('webpage');
var reporters = require('./reporters');


/**
 * Constants.
 */

var DEFAULT_REPORTER = 'spec';//spec or dot or tap
var DEFAULT_TIMEOUT = 600000;
var DEFAULT_CONFIG = {
  cookies: {},
  headers: {},
  settings: {},
  viewport: {width: 1024, height: 768}
};


/**
 * Exit when occured error.
 *
 * @param {string} msg .
 * @param {Array.<string>} trace .
 */
function exitOnError(msg, trace) {
  var msgStack = ['ERROR: ' + msg];
  if (trace) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line +
        (t.function ? ' (in function ' + t.function + ')' : ''));
    });
  }
  console.log(msgStack.join('\n'));
  phantom.exit(1);
}


/**
 * Exit when occured error.
 *
 * @param {string} msg .
 * @param {Array.<string>} trace .
 */
function continueOnError(msg, trace) {
}


/**
 * Wait timeout.
 *
 * @param {number=} opt_timeout .
 * @return {number} .
 */
function waitTimeout(opt_timeout) {
  // Default max timeout is 600s
  var timeout = opt_timeout || DEFAULT_TIMEOUT;

  var timer = setTimeout(function() {
    console.log('PHANTOM_JS: Timeout');
    phantom.exit(1);
  }, timeout);
  return timer;
}


/**
 * Check arguments.
 */

if (2 > system.args.length) {
  console.log('  Usage: phantomjs closure-library-phantomjs.js <testfile>');
  console.log('     ex) phantomjs closure-library-phantomjs bar_test.html');
  console.log('     ex) phantomjs closure-library-phantomjs all_test.html');
  console.log('     ex) phantomjs closure-library-phantomjs http://server.com/all_test.html');
  phantom.exit(1);
}


/**
 * Setup phantom object.
 */

// If occued error, exit phantomjs
phantom.onError = exitOnError;


/**
 * Setup configurations.
 */

var reporter = (function() {
  var type = (system.args[2] || DEFAULT_REPORTER).toLowerCase();
  var klassName = type.charAt(0).toUpperCase() + type.slice(1);
  return new reporters[klassName];
})();

var config = (function() {
  var c = {};
  try {
    c = JSON.parse(system.args[3] || '{}');
  } catch (err) {
  }
  return c;
})();


/**
 * Setup sandbox.
 */

// Create sandbox
var page = webpage.create();

// Set cookie if exists
if (config.cookies) {
  page.addCookie(config.cookies);
}

// Set headers if exists
if (config.headers) {
  page.customHeaders = config.headers;
}

// Set headers if exists
if (config.settings) {
  page.settings = config.settings;
}

// Set view port size
page.viewportSize = config.viewport || DEFAULT_CONFIG.viewport;

// Route "console.log" calls from within the Page context
// to the PhantomJS context
page.onConsoleMessage = function(msg, lineNum, sourceId) {
  console.log(msg);
};

// If occued error in page
page.onError = continueOnError;

// Inject adapter.js in page
page.onInitialized = function() {
  page.injectJs('./adapter.js');
};

// Handle reporter events
page.onCallback = function(obj) {
  var type = obj.type;
  var data = obj.data;

  switch (type) {
    case 'head':
      reporter.writeHead(data);
      break;
    case 'success':
    case 'failure':
      reporter.writeResult(data);
      break;
    case 'finish':
      reporter.writeFinish(data);
      // exit
      clearTimeout(waitTimer);
      phantom.exit(0);
      break;
  }
  return 'Accepted';
};


/**
 * Go!
 */

var testPath = system.args[1];
var waitTimer = null;
page.open(testPath, function(status) {
  if (status === 'success') {
    waitTimer = waitTimeout(config.timeout);
  } else {
    console.log('PHANTOM_JS: Unable to load page. [' + testPath + ']');
    phantom.exit(1);
  }
});
