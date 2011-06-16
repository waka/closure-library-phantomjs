/**
 * @fileoverview A TAP Output producer Plugin for Closure-Library and PhantomJS.
 * @author yo_waka <y.wakahara@gmail.com>
 * @license MIT-Licensed.
 */

/**
 * Namespace
 * @type {Object}
 */
var ClosureLibraryTap = {};

/**
 * @param {string} log
 */
ClosureLibraryTap.writeLog = function(log) {
    var lines = log.split('\n');
    for (var i = 0, len = lines.length; i < len; i++) {
        var line = lines[i];

        if (line.length > 0 && line !== " ") {
            line = line.replace(/&quot;/g, '\"');
            console.log(line);
        }
    }
    document.body.setAttribute('itemprop', 'phantomjs-test-finished');
};

try {
    if (!goog.testing.MultiTestRunner) {
        var onComplete_ = goog.testing.TestRunner.prototype.onComplete_;
        goog.testing.TestRunner.prototype.onComplete_ = function() {
            onComplete_.call(this);
            if (this.isSuccess()) {
                console.log(this.testCase.getName() + ' [PASSED]');
            } else {
                var log = this.getReport();
                ClosureLibraryTap.writeLog(log);
            }
        }
        goog.testing.TestCase.prototype.getName = function() {
            return this.name_;
        };
        goog.testing.TestCase.prototype.log = function(val) {};
    } else {
        var finish_ = goog.testing.MultiTestRunner.prototype.finish_;
        goog.testing.MultiTestRunner.prototype.finish_ = function() {
            if (this.getTestsThatFailed().length === 0) {
                console.log("Closure Unit Tests - All test has completed!!!");
            }
            window.parent.document.body.setAttribute('itemprop', 'phantomjs-test-finished');
        };
        window.onload = function() {
            window.testRunner.start();
        };
    }
} catch (err) {
    ClosureLibraryTap.writeLog(err.toString());
}
