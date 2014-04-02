define(
    ["validly-password"],
    function( Validly ){
        /****** Set up things we need ******/
        var form,
            triggers = {
                "validly": [
                    "min",
                    "max",
                    "contains",
                    "pattern"
                ],
                "comparators": [
                    "require"
                ],
                "form": [
                    "match",
                    "trigger"
                ]
            };

        /****** Helpers ******/
        function recursiveObjectMerge( primary, overwrite ){
            var p;
            for( p in overwrite ){
                try{
                    //try an update
                    if( overwrite[p].constructor == Object ){
                        if (typeof primary[p] == "undefined" || primary[p] === null) {
                            primary[p] = {};
                        }

                        primary[p] = recursiveObjectMerge( primary[p], overwrite[p] );
                    }
                    else{
                        primary[p] = overwrite[p];
                    }
                }
                catch( e ){
                    // destination doesn't have that property, create and set it
                    primary[p] = overwrite[p];
                }
            }

            // primary is modified (it's a reference), but pass it back
            // to keep up the idea that this function returns a result
            return primary;
        }

        function merge( one, two ){
            return recursiveObjectMerge( recursiveObjectMerge( {}, one ), two );
        }

        function log( content ){
            if( console && console.info ){
                console.info( content );
            }
        }

        /****** polyfill QuerySelectorAll ******/
        if( !document.querySelectorAll){
            document.querySelectorAll = function( selector ){
                var doc = document,
                head = doc.documentElement.firstChild,
                styleTag = doc.createElement('STYLE');
                head.appendChild(styleTag);
                doc.__qsaels = [];

                styleTag.styleSheet.cssText = selector + "{x:expression(document.__qsaels.push(this))}";
                window.scrollBy(0, 0);

                return doc.__qsaels;
            };
        }

        form = function( domNode, settings ){
            this.options = {};
            this.defaults = {
                "prefix": "data-validly",
                "autostart": true,
                "handlers":{
                    "password": {
                        "pass": function(){
                            log( "Password passed enough filters" );
                        },
                        "fail": function(){
                            log( "Password is not good enough" );
                        },
                        "strength": function( value ){
                            log( "The password has a value of " + value );
                        }
                    },
                    "pass": function(){
                        log( "Field passed the restrictions" );
                    },
                    "fail": function(){
                        log( "Field did not meet the restrictions" );
                    }
                }
            };

            this.nodes = [];
            this.parent = undefined;
            this.validator = new Validly();

            if( !settings ){
                settings = this.defaults;
            }

            this.options = merge( this.defaults, settings );

            if( domNode && domNode.nodeType === 1 && domNode.tagName === "FORM" ){
                this.parent = domNode;
            }
            else{
                throw new Error( "The Validly Form plugin only accepts a FORM tag as the parameter to its constructor." );
            }

            if( this.options.autostart ){
                this.start();
            }

            return this;
        };

        /****** Triggered Validations ******/
        form.prototype.match = function( data, value ){
            var el = document.getElementById( data );

            return this.validator.equals( value, el.value );
        };

        form.prototype.trigger = function( data ){
            var e = new Event( "keyup" ),
                els = data.split( " " );

            for( var i = 0; i < els.length; i++ ){
                document.getElementById( els[i] ).dispatchEvent( e );
            }

            return true;
        };

        form.prototype.getFieldsToValidate = function(){
            var nodes = document.querySelectorAll("[" + this.options.prefix + "]"),
                finalNodes = [],
                len = nodes.length,
                i = 0,
                node;

            for( i; i < len; i++ ){
                if( this.parent.contains( nodes[i] ) ){
                    finalNodes.push( nodes[i] );
                }
            }

            return finalNodes;
        };

        form.prototype.manageField = function( node ){
            var self = this,
                listener = function( e ){
                    self.validateField( e.target, e.keyCode );
                };

            if( node && node.addEventListener ){
                node.addEventListener( "keyup" , listener, false );
            }
            else{
                throw new Error( "manageField can only manage EventTargets" );
            }
        };

        form.prototype.validateField = function( element, keypress ){
            var self = this,
                passes = true,
                isConfirmation = element.hasAttribute( this.options.prefix + "-confirm" );

            /****** run basic Validly comparators ******/
            processTriggers(
                element,
                this.options.prefix,
                triggers.comparators,
                function( trigger, data, value ){
                    switch( trigger ){
                        case "require":
                        default:
                            break;
                        case "number":
                            trigger = "isNumber";
                            break;
                        case "integer":
                            trigger = "isInteger";
                            break;
                        case "string":
                            trigger = "isString";
                            break;
                        case "regex":
                            trigger = "isRegex";
                            break;
                    }

                    passes = self.validator[ trigger ]( value ) && passes;
                }
            );

            /****** pass through Validly triggers ******/
            processTriggers(
                element,
                this.options.prefix,
                triggers.validly,
                function( trigger, data, value ){
                    data = data == parseInt( data ) ? parseInt( data )      : data;
                    data = (trigger === "pattern")  ? new RegExp( data )    : data;

                    passes = self.validator[ trigger ]( data, value ) && passes;
                }
            );

            /****** do work for Validly.form triggers ******/
            processTriggers(
                element,
                this.options.prefix,
                triggers.form,
                function( trigger, data, value ){
                    passes = self[ trigger ]( data, value ) && passes;
                }
            );

            if( element.type === "password" && !isConfirmation ){
                this.validatePassword( element, keypress );
            }

            if( passes ){
                this.options.handlers.pass( element );
            }
            else{
                this.options.handlers.fail( element );
            }
        };

        form.prototype.validatePassword = function( element, keypress ){
            var pre             = this.options.prefix,
                filters         = element.hasAttribute( pre + "-filters" )  ? element.getAttribute( pre + "-filters" ).split(" ") : [],
                minFilters      = element.hasAttribute( pre + "-meets" )    ? parseInt( element.getAttribute( pre + "-meets" ) ) : 0,
                testForStrength = element.hasAttribute( pre + "-strength" );

            if( testForStrength ){
                this.testPasswordStrength( element, keypress );
            }

            for( var i = 0; i < filters.length; i++ ){
                this.validator.password.addFilter( filters[i] );
            }

            if( this.validator.password.meetsMinimumFilters( element.value, minFilters ) ){
                this.options.handlers.password.pass( element );
            }
            else{
                this.options.handlers.password.fail( element );
            }

            this.validator.password.resetFilters();
        };

        form.prototype.testPasswordStrength = function( element, keypress ){
            this.options.handlers.password.strength( this.validator.password.testStrength( element.value, this.options.handlers.password.test ) );
        };

        form.prototype.runAll = function(){
            var i,nodesLen;

            this.load();
            nodesLen = this.nodes.length;

            for( i = 0; i < nodesLen; i++ ){
                this.validateField( this.nodes[i], 0 );
            }
        };

        form.prototype.start = function(){
            var i,nodesLen;

            this.load();
            nodesLen = this.nodes.length;

            for( i = 0; i < nodesLen; i++ ){
                this.manageField( this.nodes[i] );
            }
        };

        form.prototype.load = function(){
            this.nodes = this.getFieldsToValidate();
        };

        function processTriggers( el, prefix, arr, cb ){
            var len = arr.length,
                i = 0,
                trigger;

            for( i; i < len; i++ ){
                trigger = arr[i];
                value = el.getAttribute( prefix + "-" + trigger );

                if( value ){
                    cb( trigger, value, el.value );
                }
            }
        };

        return Validly.plugin( "form", form );
    }
);
