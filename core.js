/**
* Core Framework
* http://code.google.com/p/core-framework/
* 
* @version 1.0.0
* @copyright Creozon
* @author Angel Kostadinov
*/
(function() 
{
	/**
	* Core (Singleton Pattern)
	*
	* @version 1.0
	* @copyright Creozon
	*/
	this.Core = {}; 
	
	/* Base class */
	Core.Class = function(){};
	
  	 /**
     * Copies all the properties of config to the specified object.
     */
	Core.apply = function(object, config, defaults) 
	{
        if (defaults) {
            Core.apply(object, defaults);
        }

        if (object && config && typeof config === 'object') 
        {
            for (var i in config) 
            {
                object[i] = config[i];
            }
        }
        
        return object;
    };
    
    /**
    * Delegate
    *
    * Delegates method execution to specified scope(target)
    * @version 1.0
    * @copyright Creozon
    */
    Core.delegate = function(target, method, args)
	{
		return (typeof method === "function") ? function() 
		{ 
			/* Override prototype */
			arguments.push = Array.prototype.push;
			
			/* Push additional arguments */
			for (var arg in args)
			{
				arguments.push(args[arg]);
			}
			return method.apply(target, arguments); 
		} : function()
		{
			return false;
		};
	};
	
	Core.pattern = (function()
	{
		return { /* Static patterns */
			isString: function(value)
			{
				return typeof value === 'string';
			},
			isArray: function(value) 
		 	{
		       	return value.constructor == Array;
		    },
		    isFilemap: function(value)
		    {
		    	if (this.isObject(value) && !this.isString(value))
		    	{	
		    		for (var key in value)
		    		{
		    			
		    			/* Return false immediatly if key is not string */
		    			if (!this.isString(key)) return false;

		    			/* Return false immediatly if value is not array */
		    			if (!this.isArray(value[key])) return false;
		    		}
		    	}
		    	else 
		    	{
		    		return false;
		    	}
		    	
		    	return true;
		    },
		    isObject: function(value)
		    {
		    	return Object.prototype.toString.call(value) === '[object Object]';
		    },
		    isClass: function(value)
		    {
		    	return (typeof(value) == "function" && typeof(value.prototype) == "object") ? true : false; 
		    }
		}
	})();
    
    Core.mixin = (function()
    {
    	var options = /* Private options */
    	{
    		defer:	  [],
    		override: true
    	};
    	
    	/**
    	* Mixin Class 
    	* @version 1.0
    	* @copyright Core Framework 
    	*/
    	var Mixin = (function() /* Mixin Class */
    	{
    		return { 
    			proto: null,
    			mixins: null,
    			augment: function(args)
    			{
					this.proto   	 = args.shift(),
					this.mixins    	 = args.shift(),
					options.defer    = args.shift() || [],
					options.override = args.shift() || false;
					
					/* TODO: Determine whether to override or compose */
					this.override();
					
					return this.proto;
    			},
    			compose: function(){},
    			override: function()
    			{
    				for (var mixin in this.mixins)
    				{
						/* Allow both classes and objects to be used as mixin(s) */
						proto = this.mixins[mixin].prototype || this.mixins[mixin];
					
    					Core.apply(this.proto.prototype, proto);
    				
    					/* Store mixin prototype */	
    					this.proto.prototype.mixinPrototypes[mixin] = proto;
    				}
    			}
    		}
    	})();

    	return function()
    	{
    		var args = Array.prototype.slice.call(arguments);
    		
    		/* Unshift scope */
    		args.unshift(this);

    		return Mixin.augment(args);
    	}
    })();
    
	Core.Class.prototype = /* Auto-Inherited method(s) */
    {
    	mixinPrototypes:[],
    	delegate: Core.delegate,
		getMixin: function(name) 
		{
			return this.getMixins()[name];
		},
		getMixins: function() 
		{
			return this.mixinPrototypes || {};
		}
    };
 
    Core.apply(Core.Class,
    {
		extend: function(object)
		{
			this.constructing = true;
			
			var proto = new this(), superclass = this.prototype;

			delete this.constructing;

			/* Extend object prototypes */
			Core.apply(proto, object);
			
			// The dummy class constructor
			var Class = proto.constructor = function() 
			{
				// All construction is actually done in the init method
				if (!Core.constructing && this.init)
				{
					this.init.apply(this, arguments);
				}
			};

			/* Associate superclass */
			proto.superclass = superclass;
			
			Core.apply(Class, 
			{
				prototype:   proto,
				constructor: Class,
				ancestor:    this,
				extend: 	 this.extend,
				mixin: 		 this.mixin
			});
			
			if (object.mixins)
			{
				this.mixin(object.mixins);
			}
			
			return Class;
		},
		mixin: Core.mixin
    });
    
    Core.apply(Core, 
    {
    	Array: (function()
    	{
    		var extendedPrototype = 
    		{
    			clear: function()
				{
					this.length = 0;
					
					return this;
				},
				map: function(mapper, context)
				{
					var result = new Array(this.length);
					
					for (var i = 0, n = this.length; i<n; i++)
					
					if (i in this) result[i] = mapper.call(context, this[i], i, this);
						
					return result;
				},
				invoke: function(method) 
				{
					var args = Array.prototype.slice.call(arguments, 1);
					
					return this.map(function(element) 
					{
						return element[method].apply(element, args);
					});
				},
				filter: function(fn) 
				{
				    var a = [];
				    
				    for ( var i=0, j=this.length; i < j; ++i ) 
				    {
				        if ( !fn.call(this, this[i], i, this) ) 
				        {
				            continue;
				        }
				        
				        a.push(this[i]);
				    }
				    return a;
				},
				clean: function()
				{
					return this.filter(function(value, index)
					{
						return null === value ? false : value.length;
					});
				}
    		};
    		
    		return {
    			get: function(array)
    			{
    				Core.apply(array, extendedPrototype);
    				
    				return array;
    			}
    		}
    	})()
    });
    
    Core.apply(Core, 
    {
    	namespace: (function()
		{
			return Core.apply(Core,
			{
				register: function(namespace, scope, object)
				{
					var namespaces = namespace.split('.');
					
					for (var i = 0; i < namespaces.length; i++)
					{
						var namespace = namespaces[i];

						if (!this.exists(namespace, scope))
						{
							scope[namespace] = object;
						}

						scope = scope[namespace];
					}
					
					return scope;
				},
				exists: function(namespace, scope)
				{
					return (!scope || typeof scope[namespace] === "undefined") ? false : true;
				},
				autoload: function(namespace, callback)
				{
					var scripts = {};

					var queue = function(namespace)
					{
						var script = Core.Array.get(namespace.split('.')).invoke('toLowerCase').join('/');
						
						scripts[script] = [];
					};
					
					if (Core.pattern.isFilemap(namespace))
					{
						scripts = namespace;
					}
					else 
					{			
						if (Core.pattern.isString(namespace))
						{
							queue(namespace);
						}
						else 
						{
							for (var i in namespace)
							{
								queue(namespace[i]);
							}
						}
					}

					Core.loader.addScripts(scripts).autoload(callback);
				}
			})
		})(),
		extend: function(object)
		{
			return Core.Class.extend(object);
		},
		override: function(origclass, overrides)
		{
			Core.apply(origclass.prototype, overrides);
		},
		define: function(namespace, object)
		{
			return this.namespace.register(namespace, window, object);
		},
		require: function(namespace, callback)
		{
			this.namespace.autoload(namespace, callback);
		},
		loader: (function()
		{
			// Table of script names and their dependencies.
			var scripts = {}, queue = [], counter = 0, config = 
			{
				path: 	 	null,
				basePath:	null,
				cache: 		true
			};

			/** @lends core.loader */
			return {
				setConfig: function(options)
				{
					$.extend(config, options);
					
					return this;
				},
				getConfig: function()
				{
					return config;
				},
				addScripts: function( collection )
				{
					scripts = $.extend(true, {}, scripts, collection);

					return this;
				},
				loadScript: function(url, callback, context) 
				{
					var script = queue[url] || (queue[url] = 
					{
						loaded    : false,
						callbacks : []
					});
				
					if(script.loaded) 
					{
						return callback.apply(context);
					}
				
					script.callbacks.push(
					{
						fn      : callback,
						context : context
					});

					if(script.callbacks.length == 1) 
					{
						$.ajax(
						{
							type     : 'GET',
							url      : Core.Array.get([config.path, config.basePath, url + '.js']).clean().join('/'),
							dataType : 'script',
							cache    : config.cache,
							success  : function() 
							{
								script.loaded = true;
								
								$.each(script.callbacks, function() 
								{
									this.fn.apply(this.context);
								});
								
								script.callbacks.length = 0;
							},
							error: function(request, status, error)
							{
								return false;
							}
						});
					}
				},
				clear: function()
				{
					this.queue.clear();
					
					return this;
				},
				queue: function()
				{
					var pushQueue = function(script)
					{
						if (-1 == $.inArray(script,queue) && script.length) /* Queue only script not loaded yet */
						{
							queue.push(script);
						}
					};
					
					$.each(scripts, function(script, scripts)
					{
						/* Queue dependencies first */
						$.each(scripts, function(index, script)
						{
							pushQueue(script);
						});
	
						/* Queue script */
						pushQueue(script);
					});
					
					return this;
				},
				autoload: function( callback )
				{
					var path = this.path();

					/* Build queue */
					this.queue();

					/* Sequential loading via closure */
					(function() 
					{
						if(counter == queue.length) 
						{
							return callback.apply(window);
						}

						Core.loader.loadScript(queue[counter++], arguments.callee);
					})();
				},
				path: (function(file)
				{
					if (!config.path)
					{
						var exists = $('script').filter(function()
						{
							return this.src.indexOf(file) != -1;
						}).eq(0);
						
						/* Core has been found */
						if (exists.size())
						{
							config.path = exists.attr('src').slice(0, -1 - file.length)
						}
					}
					
					return function()
					{
						return config.path;
					}
					
				})('core.js')
			}
		})()
    });
    
    Core.jQuery = (function()
    {
    	return {
		    /**
		    * Widget
		    *
		    * Uses $.widget factory to define widget
		    */
	    	widget: function(widget, proto)
		    {
		    	$.widget(widget, new Core.extend(proto).prototype);
		    }
    	}
    })()
    
    Core.validator = (function() /* TODO: Complete Validators */
	{
		var Valid = this.extend(
		{
			rules:[],
			element:null,
			init: function(element, rules)
			{
				/* Set element */
				this.element = element;
				
				/* Initialize rules */
				if (rules)
				{
					for (var i in rules)
					{
						this.addRule(rules[i])
					}
				}
			},
			addRule: function(rule) /* Add rule */
			{
				this.rules.push(rule);
			},
			valid: function()
			{
				var i = this.rules.length;
				
				while(i--) /* Atomic loop */
				{
					if (!this.rules[i].valid) return false;
				}
				
				return true;
			}
		});
		
		return { /* Static patterns */
			rules:[],
			empty: function(value) /* Check whether value is empty string */{},
			email: function(value) /* Check whether the value is valid email */{},
			alnum: function(value) /* Check whether value contains alphabetic or numeric characters only */ {},
			digit: function(value) /* Check whether value contains numeric characters only */ {},
			alpha: function(value) /* Check whether value contains alphabetic only */ {},
			space: function(value) /* Check whether value contains space characters only */ {},
			lower: function(value) /* Check whether value contains only lower characters */ {},
			upper: function(value) /* Check whether value contains only upper characters */ {}
		}
	})();
	/* EOF Core */
})(jQuery, window);