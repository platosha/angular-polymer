// needs to be loaded after ng-cli karma-test-shim.js has
// overriden __karma__.loaded.
// See https://github.com/angular/angular-cli/pull/1154
var loaded = window.__karma__.loaded;
window.__karma__.loaded = function() {
  document.addEventListener('WebComponentsReady', loaded);
};
