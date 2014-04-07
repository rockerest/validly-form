define(
    ["validly-form", "chai"],
    function( Validly, Chai ){
        describe( "Validly.form", function(){
            var expect = Chai.expect,
                html = document.getElementById( "validly-form" ),
                div = document.getElementById( "mocha" ),
                iv,form;

            beforeEach( function(){
                iv = new Validly();
                form = new iv.form( html, {"autostart":false} );
            });

            it( "should return a constructor", function(){
                iv.form.should.be.a( "function" );
            });

            it( "should throw an error when constructed with nothing", function(){
                expect( function(){ new iv.form(); } ).to.throw( Error );
            });

            it( "should throw an error when constructed with something other than a FORM tag", function(){
                expect( function(){ new iv.form( div ); } ).to.throw( Error );
            });

            describe( "#match", function(){
                var pass = document.getElementById( "passwordInput" ),
                    strn = document.getElementById( "passwordStrengthInput" );

                beforeEach(function(){
                    sinon.spy( form.validator, "equals" );

                    strn.value = "password";
                    pass.value = "not_password";

                    form.validateField( strn, 1 );
                });

                afterEach(function(){
                    form.validator.equals.restore();
                });

                it( "should make a call to ::validator#equals", function(){
                    form.validator.equals.should.have.been.calledOnce;
                });

                it( "should call ::validator#equals with the value of this field and the value of the matched field", function(){
                    form.validator.equals.should.have.been.calledWithExactly( "password", "not_password" );
                });
            });

            describe( "#trigger", function(){
                var triggerer = document.getElementById( "triggerer" ),
                    penguins = document.getElementById( "penguinInput" );

                beforeEach(function(){
                    sinon.spy( form, "validateField" );
                    form.manageField( penguins );
                });

                afterEach(function(){
                    form.validateField.restore();
                });

                it( "should trigger a keyup on the specified field", function(){
                    form.validateField( triggerer, 1 );

                    // Assert proper internal behavior
                    form.validateField.callCount.should.equal( 2 );

                    // assert deeper behavior
                    var callTwo = form.validateField.getCall( 1 );
                    callTwo.should.have.been.calledWithExactly( penguins, undefined );
                });
            });

            describe( "#getFieldsToValidate", function(){
                it( "should return an array", function(){
                    form.getFieldsToValidate().should.be.a( "array" );
                });

                it( "should return an array of every node in the form to be processed by Validly", function(){
                    form.getFieldsToValidate().length.should.equal( 6 );
                });

                it( "should push the HTML DomNode directly onto the array", function(){
                    form.getFieldsToValidate()[5].should.equal( document.getElementById( "penguinInput" ) );
                });
            });

            describe( "#manageField", function(){
                beforeEach(function(){
                    sinon.spy( div, "addEventListener" );
                });

                afterEach(function(){
                    div.addEventListener.restore();
                });

                it( "should add an event listener on keyup to the node", function(){
                    form.manageField( div );

                    div.addEventListener.should.have.been.calledWith( "keyup" );
                });

                it( "should throw an error when passed something that is not an instance of EventTarget", function(){
                    expect( function(){ form.manageField( "string" ); } ).to.throw( Error );
                });
            });

            describe( "#validateField", function(){
                var text = document.getElementById( "penguinInput" ),
                    pass = document.getElementById( "passwordInput" );

                beforeEach(function(){
                    text.value = "";
                    pass.value = "";
                });

                describe( "when passed a non-password field", function(){
                    beforeEach(function(){
                        sinon.spy( form.options.handlers, "pass" );
                        sinon.spy( form.options.handlers, "fail" );
                    });

                    afterEach(function(){
                        form.options.handlers.pass.restore();
                        form.options.handlers.fail.restore();
                    });

                    it( "should call the pass handler when the field passes validation", function(){
                        text.value = "penguin";

                        form.validateField( text, 1 );

                        form.options.handlers.pass.should.have.been.calledOnce;
                    });

                    it( "should call the fail handler when the field fails validation", function(){
                        text.value = "piguin";

                        form.validateField( text, 1 );

                        form.options.handlers.fail.should.have.been.calledOnce;
                    });
                });

                describe( "when passed a password field", function(){
                    it( "should make a call to #validatePassword", function(){
                        sinon.spy( form, "validatePassword" );

                        form.validateField( pass );

                        form.validatePassword.should.have.been.calledOnce;
                    });
                });
            });

            describe( "#validatePassword", function(){
                var pass = document.getElementById( "passwordInput" ),
                    strg = document.getElementById( "passwordStrengthInput" );

                beforeEach(function(){
                    pass.value = "";
                    strg.value = "";
                    form.validator.password.filters = [];

                    sinon.spy( form, "testPasswordStrength" );
                    sinon.spy( form.validator.password, "meetsMinimumFilters" );
                    sinon.spy( form.options.handlers.password, "pass" );
                    sinon.spy( form.options.handlers.password, "fail" );
                });

                afterEach(function(){
                    form.testPasswordStrength.restore();
                    form.validator.password.meetsMinimumFilters.restore();
                    form.options.handlers.password.pass.restore();
                    form.options.handlers.password.fail.restore();
                });

                describe( "when the `strength` trigger is present", function(){
                    it( "should make a call to #testPasswordStrength", function(){
                        form.validatePassword( strg );

                        form.testPasswordStrength.should.have.been.calledOnce;
                    });
                });

                describe( "when the `strength` trigger is not present", function(){
                    it( "should not make a call to #testPasswordStrength", function(){
                        form.validatePassword( pass );

                        form.testPasswordStrength.should.not.have.been.called;
                    });
                });

                it( "should make a call to password#meetsMinimumFilters", function(){
                    form.validatePassword( pass );

                    form.validator.password.meetsMinimumFilters.should.have.been.calledOnce;
                });

                it( "should call the password pass handler if the password passes validation", function(){
                    pass.value = "Ab1";

                    form.validatePassword( pass, 1 );

                    form.options.handlers.password.pass.should.have.been.calledOnce;
                });

                it( "should call the password fail handler is the password fails validation", function(){
                    pass.value = "password";

                    form.validatePassword( pass, 1 );

                    form.options.handlers.password.fail.should.have.been.calledOnce;
                });
            });

            describe( "#testPasswordStrength", function(){
                var pass = document.getElementById( "passwordInput" ),
                    str, test;

                before(function(){
                    str = sinon.spy( form.options.handlers.password, "strength" );
                    test = sinon.spy( form.validator.password, "testStrength" );
                    form.testPasswordStrength( pass, 1 );
                });

                after(function(){
                    str.restore();
                    test.restore();
                });

                it( "should make a call to password#testStrength", function(){
                    test.should.have.been.calledOnce;
                });

                it( "should make a call to the password strength handler", function(){
                    str.should.have.been.calledOnce;
                });

                it( "should call password#testStrength before the password strength handler", function(){
                    test.calledBefore( str );
                });
            });

            describe( "#runAll", function(){
                beforeEach(function(){
                    sinon.spy( form, "load" );
                    sinon.spy( form, "validateField" );
                    form.runAll();
                });

                afterEach(function(){
                    form.load.restore();
                    form.validateField.restore();
                });

                it( "should call #load once", function(){
                    form.load.should.have.been.calledOnce;
                });

                it( "should call #validateField once for each Validly field", function(){
                    form.validateField.callCount.should.equal( 6 );
                });
            });

            describe( "#start", function(){
                beforeEach( function(){
                    sinon.spy( form, "getFieldsToValidate" );
                    sinon.stub( form, "manageField", function(){} );
                });

                afterEach( function(){
                    form.getFieldsToValidate.restore();
                    form.manageField.restore();
                });

                it( "should call #getFieldsToValidate once", function(){
                    form.start();

                    form.getFieldsToValidate.should.have.been.calledOnce;
                });

                it( "should call #manageField the correct number of times", function(){
                    form.start();

                    // number of `data-validly="aware"` fields
                    form.manageField.callCount.should.equal( 6 );
                });
            });

            describe( "#load", function(){
                beforeEach(function(){
                    sinon.spy( form, "getFieldsToValidate" );
                });

                afterEach(function(){
                    form.getFieldsToValidate.restore();
                });

                it( "should call #getFieldsToValidate once", function(){
                    form.load();

                    form.getFieldsToValidate.should.have.been.calledOnce;
                });

                it( "should load the appropriate fields into the ::nodes array", function(){
                    form.nodes = [];

                    // assert #1
                    form.nodes.should.be.a( "array" );
                    form.nodes.length.should.equal( 0 );

                    form.load();

                    // assert #2
                    form.nodes.should.be.a( "array" );
                    form.nodes.length.should.equal( 6 );
                });
            });
        });
    }
);
