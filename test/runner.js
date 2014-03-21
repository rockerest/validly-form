requirejs.config({
    "baseUrl": "../",
    "paths":{
        "validly":          "vendor/validly/validly",
        "validly-password": "vendor/validly-password/validly-password",
        // Testing Libraries
        "chai":             "vendor/chai/chai",
        "mocha":            "vendor/mocha/mocha",
        "sinon":            "vendor/sinon/lib/sinon",
        "sinon-chai":       "vendor/sinon-chai/lib/sinon-chai"
    },
    "config": {
        "testRunner": {
            "tests": [
                "test/validly-form"
            ]
        }
    }
});

define(
    "testRunner",
    ["require", "module", "chai", "sinon-chai"],
    function( require, module, chai, sinonChai ){
        var should = chai.should();

        chai.use( sinonChai );

        // Mocha setup
        mocha.setup( 'bdd' );

        // tests
        require(
            module.config().tests,
            function(){
                if( window.mochaPhantomJS ){
                    mochaPhantomJS.run();
                }
                else{
                    mocha.run();
                }
            }
        );
    }
);

require(["testRunner"]);
