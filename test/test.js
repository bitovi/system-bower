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
	System.import("test/system_main/bower.json!bower").then(function(){
		return System.import("system_main").then(function(m){
			equal(m(), "second", "the system.main was used");
		});
	}).then(start);
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

	QUnit.module('system-bower plugin: bowerIgnore option', {
		setup: function() {
			var self = this;
			this.server = sinon.fakeServer.create();
			this.server.autoRespond = true;
			this.server.xhr.useFilters = true;
			this.server.xhr.addFilter(function(method, url) {
				return !(/.*bower_components\/nobowerjson\/bower.json/).test(url);
			});
			
			this.server.respondWith(function(req){
				self.madeRequestForBowerJSON = true;
				var body = '{"name": "nobowerjson","version": "0.0.0","main": "whatever.js"}';
				req.respond(200, {"Content-Type": "application/json"}, body);
			});
		},
		teardown: function() {
			this.server.restore();
		}
	});

	asyncTest("Modules do not make requests for bower.json when module is in bowerIgnore property", function() {
		var self = this;
		return System.import("test/build_config/bower-with-bowerignore.json!bower").then(function() {
			ok(!self.madeRequestForBowerJSON, "Did NOT make request for bower.json");
		}).then(start);
	});

	QUnit.module('system-bower plugin: bowerIgnore option');

	asyncTest("System loads the bowerIgnore property array", function() {
		System.import("test/build_config/bower-with-bowerignore.json!bower").then(function() {
			var bowerIgnore = System.bowerIgnore;
			ok(bowerIgnore.indexOf('nobowerjson') !== -1, "bowerIgnore added");
		}).then(start);
	});

	asyncTest("Modules do not load information when module is in bowerIgnore property", function() {
		System.import("test/build_config/bower-with-bowerignore.json!bower").then(function() {
			var definition = "bower_components/nobowerjson/bower.json!bower";
			ok(!(definition in System.defined), "ignored bower component does not have it's bower.json!bower module defined");
		}).then(start);
	});

	asyncTest("Modules can still be loaded if they are in the bowerIgnore array", function() {
		System.import("test/build_config/bower-with-bowerignore.json!bower").then(function() {
			return System.import('nobowerjson').then(function(nobowerjson){
				ok(nobowerjson.loaded, "the module still loaded");
			});
		}).then(start, start);
	});

}

QUnit.start();
