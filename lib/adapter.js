/**
 * @fileoverview The adapter from closure-library to PhantomJS.
 * @author yo_waka
 */

(function() {

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
   * Replacer testrunner prototype methods.
   */

  function replaceTestCase(opt_global) {
    var global = opt_global || goog.global;

    /**
     * @override
     */
    global.goog.testing.TestCase.prototype.log = goog.nullFunction;

    /**
     * @override
     */
    global.goog.testing.TestCase.prototype.runTests = function() {
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
    };

    /**
     * @override
     */
    global.goog.testing.TestCase.prototype.doSuccess = function(test) {
      this.result_.successCount++;

      var data = {
        success: true,
        name: test.name,
        time: test.runTime || 0
      };
      sendToPhantomJS('success', data);
    };

    /**
     * @override
     */
    global.goog.testing.TestCase.prototype.doError = function(test, opt_e) {
      var err = this.logError(test.name, opt_e);
      this.result_.errors.push(err);

      var data = {
        success: false,
        name: test.name,
        time: test.runTime || 0,
        error: err
      };
      sendToPhantomJS('failure', data);
    };

    /**
     * @override
     */
    global.goog.testing.TestCase.Test.prototype.execute = function() {
      var startTime = new Date().getTime();
      this.ref.call(this.scope);
      this.runTime = (new Date().getTime()) - startTime;
    };
  }

  function replaceTestRunner() {
    /**
     * @override
     */
    goog.testing.TestRunner.prototype.execute = function() {
      if (!this.testCase) {
        throw Error('The test runner must be initialized ' +
                    'with a test case before ' +
                    'execute can be called.');
      }
      this.testCase.setCompletedCallback(goog.bind(onComplete, this));
      this.testCase.runTests();
    };

    var onComplete = function() {
      var result = this.testCase.result_;
      var data = {
        success: result.isSuccess()
      };
      sendToPhantomJS('finish', data);
    };
  }

  function replaceMultiTestRunner() {
    /**
     * @override
     */
    goog.testing.MultiTestRunner.prototype.processResult = function(frame) {
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
        this.runNextTest_(frame);
      } else if (this.resultCount_ == this.activeTests_.length) {
        goog.bind(finish, this)();
      }
    };

    var finish = function() {
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
    };

    /**
     * Oops, original method is private...
     *
     * @override
     */
    goog.testing.MultiTestRunner.TestFrame.prototype.onIframeLoaded_ =
        function(e) {
      this.iframeLoaded_ = true;

      var js = goog.dom.getFrameContentWindow(this.iframeEl_);
      replaceTestCase(js);
    };
  }


  // apply replacer
  window.onload = function() {
    if (!goog.isDef(goog.testing.MultiTestRunner)) {
      replaceTestCase();
      replaceTestRunner();
      // testrunner will start in testfile
    } else {
      replaceMultiTestRunner();
      if (window.testRunner) {
        window.testRunner.start();
      } else {
        throw Error('"testRunner" variable must be defined');
      }
    }
  };

})();
