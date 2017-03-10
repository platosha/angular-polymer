System.config({
    baseURL: '/base',
    paths: {
        'npm:': 'node_modules/'
    },
    map: {
        '@angular/common': 'npm:@angular/common/bundles/common.umd.js',
        '@angular/common/testing': 'npm:@angular/common/bundles/common-testing.umd.js',
        '@angular/core': 'npm:@angular/core/bundles/core.umd.js',
        '@angular/core/testing': 'npm:@angular/core/bundles/core-testing.umd.js',
        '@angular/compiler': 'npm:@angular/compiler/bundles/compiler.umd.js',
        '@angular/compiler/testing': 'npm:@angular/compiler/bundles/compiler-testing.umd.js',
        '@angular/forms': 'npm:@angular/forms/bundles/forms.umd.js',
        '@angular/platform-browser': 'npm:@angular/platform-browser/bundles/platform-browser.umd.js',
        '@angular/platform-browser/testing': 'npm:@angular/platform-browser/bundles/platform-browser-testing.umd.js',
        '@angular/platform-browser-dynamic': 'npm:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
        '@angular/platform-browser-dynamic/testing': 'npm:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic-testing.umd.js',
        'rxjs': 'npm:rxjs',
    },
    packages: {
        '': {defaultExtension: 'js'},
        rxjs: {defaultExtension: 'js'}
    }
});

(function() {
    var originalKarmaLoaded = window.__karma__.loaded.bind(window.__karma__);
    window.__karma__.loaded = function() {};

    document.addEventListener('WebComponentsReady', function () {
        System.import('index.spec')
            .then(function () {
                return Promise.all([
                    System.import('@angular/core/testing'),
                    System.import('@angular/platform-browser-dynamic/testing')
                ]).then(function (providers) {
                    var testing = providers[0];
                    var testingBrowser = providers[1];

                    testing.TestBed.initTestEnvironment(
                        testingBrowser.BrowserDynamicTestingModule,
                        testingBrowser.platformBrowserDynamicTesting());
                });
            })
            .then(originalKarmaLoaded)
            .catch(console.error.bind(console));
    });
})();
