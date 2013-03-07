/**
 * @fileoverview The adapter from closure-library to PhantomJS.
 * @author yo_waka
 */

(function() {
  
  var ENABLE_CONSOLE = true;

  // disabled default console logger
  noConsole();

  /**
   * Apply replacers
   */

  window.onload = function() {
    if (goog.isDef(goog.testing.MultiTestRunner)) {
      // Run all tests
      replaceMultiTestRunner();
      if (window.testRunner) {
        setTimeout(function() {
          window.testRunner.start();
        }, 100);
      } else {
        throw Error('"testRunner" variable must be defined');
      }
    } else {
      // Run single test
      if (goog.isDef(goog.testing.AsyncTestCase)) {
        replaceAsyncTestCase();
      } else {
        replaceTestCase();
      }
      replaceTestRunner();
      // testrunner will start in testfile
    }
  };


  /**
   * Send data to phantomjs from browser script.
   */
  function sendToPhantomJS(type, data) {
    if (typeof window.callPhantom === 'function') {
      var state = window.callPhantom({
        'type': type,
        'data': data
      });
      if (state !== 'Accepted') {
        throw Error('Can not send data to PhantomJS object');
      }
    } else {
      throw Error('window.callPhantom has not exist');
    }
  }

  /**
   */
  function noConsole(opt_global) {
    if (ENABLE_CONSOLE) {
      return;
    }
    var obj = opt_global || window;
    obj.console.log = function() {};
    obj.console.debung = function() {};
    obj.console.error = function() {};
  }


  /**
   * Replace goog.testing.TestCase.
   */
  function replaceTestCase(opt_global) {
    var global = opt_global || goog.global;

    noConsole(global);
    goog.mixin(
        global.goog.testing.TestCase.prototype,
        getReplacedTestCase());
    goog.mixin(
        global.goog.testing.TestCase.Test.prototype,
        getReplacedTest());
  }

  /**
   * Replace goog.testing.AsyncTestCase.
   */
  function replaceAsyncTestCase(opt_global, opt_noTerminate) {
    var global = opt_global || goog.global;

    noConsole(global);
    goog.mixin(
        global.goog.testing.AsyncTestCase.prototype,
        getReplacedAsycTestCase(global, opt_noTerminate));
    goog.mixin(
        global.goog.testing.TestCase.Test.prototype,
        getReplacedTest());
  }

  /**
   * Replace goog.testing.TestRunner.
   */
  function replaceTestRunner(opt_global) {
    var global = opt_global || goog.global;
    goog.mixin(
        global.goog.testing.TestRunner.prototype,
        getReplacedTestRunner());
  }

  /**
   * Replace goog.testing.MultiTestRunner.
   */
  function replaceMultiTestRunner(opt_global) {
    var global = opt_global || goog.global;

    goog.mixin(
        global.goog.testing.MultiTestRunner.prototype,
        getReplacedMultiTestRunner());

    /**
     * Oops, original method is private...
     *
     * @override
     */
    global.goog.testing.MultiTestRunner.TestFrame.prototype.onIframeLoaded_ =
        function(e) {
      this.iframeLoaded_ = true;

      var js = goog.dom.getFrameContentWindow(this.iframeEl_);
      if (goog.isDef(js.goog.testing.AsyncTestCase)) {
        replaceAsyncTestCase(js, true);
      } else {
        replaceTestCase(js);
      }
    };
  }


  /**
   * Replaced methods for goog.testing.TestCase.
   */
  function getReplacedTestCase() {
    return getReplacedTestCase.methods_ || (getReplacedTestCase.methods_ = {
      /** @override */
      log: goog.nullFunction,
      /** @override */
      runTests: function() {
        var data = {
          name: this.name_,
          num: this.getCount()
        };
        sendToPhantomJS('head', data);

        try {
          this.setUpPage();
        } catch (e) {
          this.exceptionBeforeTest = e;
        }
        this.execute();
      },
      /** @override */
      doSuccess: function(test) {
        this.result_.successCount++;

        var data = {
          success: true,
          name: test.name,
          time: test.runTime || 0
        };
        sendToPhantomJS('success', data);
      },
      /** @override */
      doError: function(test, opt_e) {
        var err = this.logError(test.name, opt_e);
        this.result_.errors.push(err);

        var data = {
          success: false,
          name: test.name,
          time: test.runTime || 0,
          error: err
        };
        sendToPhantomJS('failure', data);
      }
    });
  }

  /**
   * Replaced methods goog.testing.TestCase.Test.
   */
  function getReplacedTest() {
    return getReplacedTest.methods_ || (getReplacedTest.methods_ = {
      /** @override */
      execute: function() {
        var startTime = new Date().getTime();
        this.ref.call(this.scope);
        this.runTime = (new Date().getTime()) - startTime;
      }
    });
  }

  /**
   * Replaced methods for goog.testing.AsyncTestCase.
   */
  function getReplacedAsycTestCase(opt_global, opt_noTerminate) {
    var global = opt_global || goog.global;
    var noTerminate = opt_noTerminate || false;

    return getReplacedAsycTestCase.methods_ || (getReplacedAsycTestCase.methods_ = {
      /** @type {Array.<Object>} */
      adapterResults_: null,
      /** @override */
      log: goog.nullFunction,
      /** @override */
      runTests: function() {
        this.adapterResults_ = [];

        // set callback at completed
        this.setCompletedCallback(goog.bind(function() {
          this.adapterResults_.forEach(function(result) {
            // fire results!
            sendToPhantomJS(result.evt, result.data);
          });
          this.adapterResults_ = null;

          if (!noTerminate) {
            var data = {
              success: this.result_.isSuccess()
            };
            sendToPhantomJS('finish', data);
          }
        }, this));

        var data = {
          name: this.name_,
          num: this.getCount()
        };
        this.adapterResults_.push({evt: 'head', data: data});

        this.hookAssert_();
        this.hookOnError_();
        this.setNextStep_(this.doSetUpPage_, 'setUpPage');
        this.pump_();
      },
      /** @override */
      doSuccess: function(test) {
        this.result_.successCount++;

        var data = {
          success: true,
          name: test.name,
          time: test.runTime || 0
        };
        this.adapterResults_.push({evt: 'success', data: data});
      },
      /** @override */
      doError: function(test, opt_e) {
        var err = this.logError(test.name, opt_e);
        this.result_.errors.push(err);

        var data = {
          success: false,
          name: test.name,
          time: test.runTime || 0,
          error: err
        };
        this.adapterResults_.push({evt: 'failure', data: data});
      }
    });
  }

  /**
   * Replaced methods for goog.testing.TestRunner.
   */
  function getReplacedTestRunner() {
    return getReplacedTestRunner.methods_ || (getReplacedTestRunner.methods_ = {
      /** @override */
      execute: goog.isDef(goog.testing.AsyncTestCase) ? function() {
        if (!this.testCase) {
          throw Error('The test runner must be initialized ' +
                      'with a test case before ' +
                      'execute can be called.');
        }
        this.testCase.runTests();
      } :
      function() {
        if (!this.testCase) {
          throw Error('The test runner must be initialized ' +
                      'with a test case before ' +
                      'execute can be called.');
        }
        this.testCase.setCompletedCallback(goog.bind(function() {
          var result = this.testCase.result_;
          var data = {
            success: result.isSuccess()
          };
          console.log(data.success);
          sendToPhantomJS('finish', data);
        }, this));
        this.testCase.runTests();
      }
    });
  }

  /**
   * Replaced methods for goog.testing.MultiTestRunner.
   */
  function getReplacedMultiTestRunner() {
    return getReplacedMultiTestRunner.methods_ || (getReplacedMultiTestRunner.methods_ = {
      /** @override */
      processResult: function(frame) {
        var success = frame.isSuccess();
        var report = frame.getReport();
        var test = frame.getTestFile();

        this.stats_.push(frame.getStats());
        this.finished_[test] = true;

        this.resultCount_++;

        if (success) {
          this.passes_++;
        }

        if (!this.stopped_ && this.startedCount_ < this.activeTests_.length) {
          var self = this;
          setTimeout(function() {
            self.runNextTest_(frame);
          }, 10);
        } else if (this.resultCount_ == this.activeTests_.length) {
          var fn = goog.bind(function() {
            // Compute tests that did not finish before the stop button was hit.
            var unfinished = [];
            for (var i = 0; i < this.activeTests_.length; i++) {
              var test = this.activeTests_[i];
              if (!this.finished_[test]) {
                unfinished.push(test);
              }
            }
            var data = {
              success: !(this.getTestsThatFailed().length || unfinished.length)
            };
            sendToPhantomJS('finish', data);
          }, this);
          fn();
        }
      }
    });
  }

})();
