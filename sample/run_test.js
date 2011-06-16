/**
 * @fileoverview JS UnitTest runner.
 * @author yo_waka <y.wakahara@gmail.com>
 * @license MIT-Licensed.
 */

/**
 * Wait until the test condition is true or timeout occurs.
 * @param {Function} testFn
 * @param {Function} onReadyFn
 * @param {number=} opt_timeout
 */
function waitFor(testFn, onReadyFn, opt_timeout) {
    var maxtimeOutMillis = opt_timeout || 600001; // Default max timeout is 600s
    var start = new Date().getTime();
    var condition = false;
    var timer = setInterval(function() {
        if ((maxtimeOutMillis > new Date().getTime() - start) && !condition) {
            condition = testFn.call(testFn);
        } else {
            if (!condition) {
                console.log('phantomjs: timeout');
                phantom.exit();
            } else {
                onReadyFn.call(onReadyFn);
                clearInterval(timer);
            }
        }
    }, 100);
}

if (phantom.args.length === 0) {
    console.log('Usage: phantomjs run_test.js <filepath>');
    console.log('   ex) phantomjs run_test.js ./test/foo/bar_test.html');
    console.log('   ex) phantomjs run_test.js ./test/all_test.html');
    phantom.exit();
} else {
    // Create the sandboxing.
    var page = new WebPage();

    // Route "console.log" calls from within the Page context to the PhantomJS context.
    page.onConsoleMessage = function(msg) {
        console.log(msg);
    };

    // Set view port size.
    page.viewportSize = {
        width: 1024,
        height: 768
    };

    // Open address.
    var address = phantom.args[0];
    page.open(address, function(status) {
        if (status === 'success') {
            waitFor(function() {
                return page.evaluate(function() {
                    var itemprop = document.body.getAttribute('itemprop');
                    if (itemprop === 'phantomjs-test-finished') {
                        return true;
                    }
                    return false;
                });
            }, function() {
                phantom.exit();
             });
        } else {
            console.log("phantomjs: Unable to load page. [" + address + ']');
            phantom.exit();
        }
    });
}
