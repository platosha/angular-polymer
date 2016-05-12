System.register(['@angular/core/testing', './polymer-element'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var testing_1, polymer_element_1;
    var Polymer;
    return {
        setters:[
            function (testing_1_1) {
                testing_1 = testing_1_1;
            },
            function (polymer_element_1_1) {
                polymer_element_1 = polymer_element_1_1;
            }],
        execute: function() {
            Polymer = window.Polymer;
            testing_1.describe('PolymerElement', function () {
                testing_1.it('is defined', function () {
                    testing_1.expect(polymer_element_1.PolymerElement).toBeDefined();
                });
                testing_1.it('is function', function () {
                    testing_1.expect(typeof polymer_element_1.PolymerElement).toBe('function');
                });
            });
        }
    }
});
//# sourceMappingURL=polymer-element.spec.js.map