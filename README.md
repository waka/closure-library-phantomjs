Closure Library PhantomJS
================================


DESCRIPTION
---------------------------------------
Closure Library PhantomJS is the unittest runner on command-line.  
This runs tests under [phantomjs](http://code.google.com/p/phantomjs/) and [Google Closure Library](http://code.google.com/closure/library/index.html).  
And this will be able to output the test results in a variety of formats including formats [TAP](http://testanything.org/), Spec, Dot.


USAGE
---------------------------------------

### Prepare

    $ git clone https://github.com/waka/closure-library-phantomjs.git

### Running sample test script with PhantomJS

    $ git submodule update --init
    # assume you have built and installed phantomjs
    # And you will type the following command to create deps.js
    $ python vendor/google-closure-library/closure/bin/build/depswriter.py --output_file=deps.js --root_with_prefix="sample ../../../../sample"
    # Run all test scripts
    $ phantomjs lib/closure-library-phantomjs.js sample/test/all_tests.html
    # If you run single test script
    $ phantomjs lib/closure-library-phantomjs.js sample/test/ui/textarea_test.html

### Using from command-line script (with Node.js)

    $ npm install
    $ bin/closure-library-phantomjs sample/test/all_tests.html
    $ bin/closure-library-phantomjs sample/test/ui/textarea_test.html

or

    $ npm install closure-library-phantomjs
    # installed command-line script in your npm packages directory
    $ closure-library-phantomjs path/to/your_all_tests.html
    $ closure-library-phantomjs path/to/your_single_test.html

### Output to any formats

Spec format (default)

    $ closure-library-phantomjs test.html -r spec
    # or
    $ phantomjs lib/closure-library-phantomjs.js test.html spec
 
[TAP format](http://en.wikipedia.org/wiki/Test_Anything_Protocol)

    $ closure-library-phantomjs test.html -r tap
    # or
    $ phantomjs lib/closure-library-phantomjs.js test.html tap
    # if you use with CI tool (Jenkins, etc)
    $ phantomjs lib/closure-library-phantomjs.js test.html tap > js_test_result_tap.txt

Dot format

    $ closure-library-phantomjs test.html -r dot
    # or
    $ phantomjs lib/closure-library-phantomjs.js test.html dot

### Other configurations

Set timeout of phantomjs (default: 600000 ms)

    $ closure-library-phantomjs --timeout 1000
    # or
    $ phantomjs lib/closure-library-phantomjs.js test.html spec {"timeout": 1000}

Set cookie (default: none)

    $ closure-library-phantomjs --cookie app=key
    # or
    $ phantomjs lib/closure-library-phantomjs.js test.html spec {"cookies": {"app": "key"}}

Set http header (default: none)

    $ closure-library-phantomjs --header X-TEST=foo
    # or
    $ phantomjs lib/closure-library-phantomjs.js test.html spec {"headers": {"X-TEST": "foo"}}

Set settings (default: none)
See [PhantomJS API document](https://github.com/ariya/phantomjs/wiki/API-Reference-WebPage#wiki-webpage-settings)

    $ closure-library-phantomjs --setting userAgent=Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)
    # or
    $ phantomjs lib/closure-library-phantomjs.js test.html spec {"settings": {"userAgent": "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)"}}

Set webpage viewport size (default: 1024x768)

    $ closure-library-phantomjs --view 1280x900
    # or
    $ phantomjs lib/closure-library-phantomjs.js test.html spec {"viewport": {"width": 1280, "height": 900}}
