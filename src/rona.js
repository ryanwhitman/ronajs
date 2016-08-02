var Rona = function() {

	var
		config = {
			system_path: '',
		},
		routes = {},
		route_requested = '',
		execution_enabled = true;

	this.previous_uri = '';

	this.config = function() {

	};

	this.run = function() {

		var instance = this;

		document.addEventListener('click', function(e) {

			if (typeof e.target.dataset.rona === 'string' && typeof e.target.href === 'string') {
				e.preventDefault();
				instance.change_route(e.target.href);
			}
		});

		this.execute_route();
	};

	this.execute_route = function(exe_route) {

		route_requested = location.pathname.replace(config.system_path, '');

		if ((typeof exe_route === 'boolean' && !exe_route) || (typeof exe_route !== 'boolean' && !execution_enabled))
			return;

		if (route_requested == '/')
			route_requested = '';

		// Turn the requested route into an array & get the count
		var
			route_requested_arr = route_requested.split('/');
			route_requested_count = route_requested_arr.length;
			
		// Establish an empty $route_found variable
		var route_found = '';
			
		// First attempt to find a direct match. If that fails, try matching a route with a variable in it.
		var direct_match = typeof routes.regular === 'undefined' || typeof routes.regular[route_requested] === 'undefined' ? null : routes.regular[route_requested];
		if (direct_match !== null)
			route_found = direct_match;
		else {

			var variable_matches = routes.variable;

			for (var path in variable_matches) {

				if (!variable_matches.hasOwnProperty(path))
					continue;

				var handlers = variable_matches[path];

				// Reset route_var array
				var route_vars = [];

				// Explode the route being examined into an array
				var route_examining_arr = path.split('/');

				// Ensure the arrays are the same size
				if (route_requested_count == route_examining_arr.length) {

					// Iterate thru each of the array elements. The requested route and the route being examined either need to match exactly or the route being examined needs to have a variable.
					var
						matches_needed = route_requested_count,
						matches_found = 0;

					for (var i = 0; i < matches_needed; i++) {

						if (route_requested_arr[i] == route_examining_arr[i]) {
						
							// An exact match was found, so we'll continue to the next array item.
							matches_found++;
								
						} else if (route_examining_arr[i].match(/^{.+}$/)) {
						
							// The route being examined has a route variable, so it's a match. Set route_var array for use later on.
							route_vars[route_examining_arr[i].replace('{', '').replace('}', '')] = route_requested_arr[i];
							matches_found++;
								
						} else {
						
							// A match was not found, so the route being examined isn't a match.
							break;
						}
					}

					if (matches_found == matches_needed) {
						route_found = handlers;
						break;
					}
				}
			}
		}

		// If a route was found, run it
		if (typeof route_found === 'object') {

			if (typeof route_vars !== 'object')
				route_vars = {};

			for (var idx in route_found) {

				var handler = route_found[idx];

				if (typeof handler === 'function')
					handler(route_vars);
				else
					window[handler](route_vars);
			}
		}

	}

	this.route = function(path, handlers) {
	
		// Format path
		path = path.toString().toLowerCase();
		if (path == '/')
			path = '';

		// Format handlers
		if (typeof handlers === 'undefined')
			return false;
		else if (Object.prototype.toString.call(handlers) !== '[object Array]')
			handlers = [handlers];
			
		// Determine route type
		var type;
		if (path.match(/[*]/i))
			type = 'wildcard';
		else if (path.match(/\/{.+(}$|}\/)/))
			type = 'variable';
		else
			type = 'regular';

		// Turn the path into an array & get the count
		var
			path_arr = path.split('/'),
			path_count = path_arr.length;
			
		// Merge these handlers with those previously created for this route
		var combined_handlers;
		if (typeof routes[type] === 'object' && typeof routes[type][path] === 'object')
			combined_handlers = routes[type][path].concat(handlers);
		else
			combined_handlers = handlers;

		// Destroy the former handlers variable
		handlers = null;
	
		// Find and attach wildcard handlers
		if (type != 'wildcard' && typeof routes.wildcard !== 'undefined') {

			// Grab the wildcard routes
			var wc_routes = routes.wildcard;

			var wc_handlers_all = [];

			for (var wc_path in wc_routes) {

				if (!wc_routes.hasOwnProperty(wc_path))
					continue;

				var wc_handlers = wc_routes[wc_path];
				
				var path_examining_arr = wc_path.split('/');
				
				var is_match = false;
				for (i = 0; i < path_count; i++) {
					
					if (path_examining_arr[i] == path_arr[i] || path_examining_arr[i] == '*') {
					
						// Get the count, which is the current iteration (array index) plus 1
						var count = i + 1;
						
						if (count == path_examining_arr.length && (count == path_count || path_examining_arr[i] == '*')) {
							
							is_match = true;
							break;
						}
					
					} else
						break;
				}
				
				if (is_match)
					Array.prototype.push.apply(wc_handlers_all, wc_handlers);
			}
		
			// Add the wildcard array
			var combined_handlers = wc_handlers_all.concat(combined_handlers);
		}

		// Set the route
		if (typeof routes[type] === 'undefined')
			routes[type] = {};
		routes[type][path] = combined_handlers;
	};

	this.get_routes = function() {
		return routes;
	};

	this.change_route = function(uri, exe_route) {

		this.previous_uri = route_requested;

		window.history.pushState('', '', uri);
		this.execute_route(exe_route);
	};

	this.refresh = function() {
		this.change_route(route_requested);
	}

	this.stop_executing = function() {

		execution_enabled = false;
	}

	this.start_executing = function() {

		execution_enabled = true;
	}
};