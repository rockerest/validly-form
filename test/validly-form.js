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

            describe.skip( "#getFieldsToValidate", function(){
                it();
            });

            describe.skip( "#manageField", function(){
                it();
            });

            describe.skip( "#validateField", function(){
                it();
            });

            describe.skip( "#validatePassword", function(){
                it();
            });

            describe.skip( "#testPasswordStrength", function(){
                it();
            });

            describe( "#start", function(){
                beforeEach( function(){
                    sinon.spy( form, "getFieldsToValidate" );
                    sinon.spy( form, "manageField" );
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

                    form.manageField.callCount.should.equal( 5 ); // number of `data-validly="aware"` fields
                });
            });
        });
    }
);
