QUnit.module("system-bower plugin");

asyncTest("Basics works", function(){
	System.import("lodash").then(function(_){
		equal(typeof _, "function", "Function returned");
	}).then(start);
});

asyncTest("Loads globals", function(){
	System.import("jquery").then(function(){
		ok($.fn.jquery, "jQuery loaded");
	}).then(start);
});

asyncTest("Loads buildConfig", function(){
	System.import("test/build_config/bower.json!bower").then(function(){
		var config = System.buildConfig;
		ok(config, "buildConfig added");
		equal(config.map.foo, "bar", "Correct map included");
	}).then(start);
});

asyncTest("Replaces bower_components path in paths", function(){
	System.bowerPath = "vendor";
	System.import("test/alt_path/bower.json!bower").then(function(){
		equal(System.paths.bar, "vendor/bar/bar.js", "Correct path set");
	}).then(start);
});

asyncTest("system.main overrides main", function(){
	System.bowerPath = "test";
	System._bowerMainLoaded = false;
	System.import("test/system_main/bower.json!bower").then(function(){
		return System.import("system_main").then(function(m){
			equal(m(), "second", "the system.main was used");
		});
	}).then(start);
});

QUnit.module('system-bower plugin: bowerIgnore option', {
	setup: function() {
		this.oldBowerPath = System.bowerPath;
		System.bowerPath = "test/bower_ignore/bower_components";
	},
	teardown: function() {
		if(this.oldFetch) {
			System.fetch = this.oldFetch;
		}

		System.bowerPath = this.oldBowerPath;
	}
});

asyncTest("Ignores deps you tell it to ignore", function(){
	var fetch = this.oldFetch = System.fetch;
	System.fetch = function(load){
		if(/ignoreme/.test(load.name)) {
			throw new Error("Trying to load ignoreme");
		}
		return fetch.call(this, load);
	};

	System.import("test/bower_ignore/bower.json!bower").then(function(){
		ok(true, "it worked");
	}).then(start, function(err){
		equal(err, null, "got an error");
	});
});

asyncTest("Handles an undefined load.main", function() {
	var loader = System.clone();
	loader._bowerMainLoaded = true;

	System.import("bower").then(function(bower) {
		var load = {
			source: "{\"name\":\"foo\"}"
		};

		try {
			Promise.resolve(bower.translate.call(loader, load))
			.then(function(config) {
				ok(true, 'successfully reached with an undefined main');
				ok(/\"foo\/\*\": \"bower_components\/foo\/\/\*\.js\"/.test(config), 'config paths are set properly');
			});
		}
		catch(e) {
			ok(false, 'undefined main is unhandled');
		}
		finally {
			QUnit.start();
		}
	});
});

// Only run these tests for StealJS (because it requires steal syntax)
if(System.isSteal) {
	asyncTest("Modules with their own config works", function(){
		System.bowerPath = "bower_components";
		System.import("can").then(function(can){
			var $ = can.$;
			var tmpl = can.mustache("Hello {{name}}");
			$("#qunit-test-area").html(tmpl({
				name: "World"
			}));

			equal($("#qunit-test-area").html(), "Hello World", "Loaded can and rendered a template");
		}).then(start);
	});
}

QUnit.start();
