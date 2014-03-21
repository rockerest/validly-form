define(
    ["validly-password"],
    function( Validly ){
        /****** Set up things we need ******/
        var form,
            valid = new Validly(),
            triggers = [
                "data-validly-min",
                "data-validly-max",
                "data-validly-require",
                "data-validly-contains",
                "data-validly-matches"
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
        };

        function merge( one, two ){
            return recursiveObjectMerge( recursiveObjectMerge( {}, one ), two );
        };

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
            var options = {},
                defaults = {
                    "config": {
                        "prefix": "data-validly"
                    },
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
                },
                nodes,par,nodesLen,i;

            if( !settings ){
                settings = defaults;
            }

            options = merge( defaults, settings );

            if( domNode.nodeType === 1 && domNode.tagName === "FORM" ){
                par = domNode;
            }
            else{
                throw new Error( "The Validly Form plugin only accepts a FORM tag as the parameter to its constructor." );
            }

            this.getFieldsToValidate = function(){
                var nodes = document.querySelectorAll("[" + options.config.prefix + "]"),
                    finalNodes = [],
                    len = nodes.length,
                    i = 0,
                    node;

                for( i; i < len; i++ ){
                    if( par.contains( nodes[i] ) ){
                        finalNodes.push( nodes[i] );
                    }
                }

                return finalNodes;
            };

            this.manageField = function( node ){
                var self = this;
                node.addEventListener( "keyup", function( e ){
                    self.validateField( this, e.keyCode );
                }, false );
            };

            this.validateField = function( element, keypress ){
                var passes = true,
                    i = 0,
                    len = triggers.length,
                    attr,method;

                for( i; i < len; i++ ){
                    attr = element.getAttribute( triggers[i] );

                    if( attr ){
                        method = triggers[i].replace( options.config.prefix + "-", "" );
                        attr = attr == parseInt( attr ) ? parseInt( attr ) : attr;

                        passes = passes && valid[ method ]( attr, element.value );
                    }
                }

                if( element.type === "password" ){
                    this.validatePassword( element, keypress );
                }
                else{
                    if( passes ){
                        options.handlers.pass( element );
                    }
                    else{
                        options.handlers.fail( element );
                    }
                }
            };

            this.validatePassword = function( element, keypress ){
                var filters = element.getAttribute( options.config.prefix + "-filters" ).split(" "),
                    minFilters = parseInt( element.getAttribute( options.config.prefix + "-meets" ) ),
                    testForStrength = element.hasAttribute( options.config.prefix + "-strength" );

                if( testForStrength ){
                    this.testPasswordStrength( element, keypress );
                }

                for( var i = 0; i < filters.length; i++ ){
                    valid.password.addFilter( filters[i] );
                }

                if( valid.password.meetsMinimumFilters( element.value, minFilters ) ){
                    options.handlers.password.pass( element );
                }
                else{
                    options.handlers.password.fail( element );
                }
            };

            this.testPasswordStrength = function( element, keypress ){
                options.handlers.password.strength( valid.password.testStrength( element.value, options.handlers.password.test ) );
            };

            nodes = this.getFieldsToValidate();
            nodesLen = nodes.length;

            for( i = 0; i < nodesLen; i++ ){
                this.manageField( nodes[i] );
            }
        };

        return Validly.plugin( "form", form );
    }
)
