define(
    ["validly-password"],
    function( Validly ){
        /****** Set up things we need ******/
        var form,
            triggers = [
                "min",
                "max",
                "require",
                "contains",
                "matches"
            ];

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
            var self = this;
            if( node && node.addEventListener ){
                node.addEventListener( "keyup", function( e ){
                    self.validateField( this, e.keyCode );
                }, false );
            }
            else{
                throw new Error( "manageField can only manage EventTargets" );
            }
        };

        form.prototype.validateField = function( element, keypress ){
            var passes = true,
                i = 0,
                len = triggers.length,
                attr;

            for( i; i < len; i++ ){
                attr = element.getAttribute( this.options.prefix + "-" + triggers[i] );

                if( attr ){
                    attr = attr == parseInt( attr ) ? parseInt( attr ) : attr;

                    passes = passes && this.validator[ triggers[i] ]( attr, element.value );
                }
            }

            if( element.type === "password" ){
                this.validatePassword( element, keypress );
            }
            else{
                if( passes ){
                    this.options.handlers.pass( element );
                }
                else{
                    this.options.handlers.fail( element );
                }
            }
        };

        form.prototype.validatePassword = function( element, keypress ){
            var filters = element.getAttribute( this.options.prefix + "-filters" ).split(" "),
                minFilters = parseInt( element.getAttribute( this.options.prefix + "-meets" ) ),
                testForStrength = element.hasAttribute( this.options.prefix + "-strength" );

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
        };

        form.prototype.testPasswordStrength = function( element, keypress ){
            this.options.handlers.password.strength( this.validator.password.testStrength( element.value, this.options.handlers.password.test ) );
        };

        form.prototype.start = function(){
            var i,nodesLen;

            this.nodes = this.getFieldsToValidate();
            nodesLen = this.nodes.length;

            for( i = 0; i < nodesLen; i++ ){
                this.manageField( this.nodes[i] );
            }
        };

        return Validly.plugin( "form", form );
    }
);
