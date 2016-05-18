"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var testing_1 = require('@angular/core/testing');
var polymer_element_1 = require('./polymer-element');
var testing_2 = require('@angular/compiler/testing');
var core_1 = require('@angular/core');
var common_1 = require('@angular/common');
var by_1 = require('@angular/platform-browser/src/dom/debug/by');
var testing_3 = require('@angular/platform-browser-dynamic/testing');
testing_1.setBaseTestProviders(testing_3.TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS, testing_3.TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS);
var Polymer = window.Polymer;
testing_1.describe('PolymerElement', function () {
    var tcb;
    var template;
    var testElement;
    var testComponent;
    var fixture;
    testing_1.it('is defined', function () {
        testing_1.expect(polymer_element_1.PolymerElement).toBeDefined();
    });
    testing_1.it('is function', function () {
        testing_1.expect(typeof polymer_element_1.PolymerElement).toBe('function');
    });
    beforeEach(function (done) {
        if (template) {
            testing_1.inject([testing_2.TestComponentBuilder], function (tcb) {
                tcb.overrideTemplate(TestComponent, template).createAsync(TestComponent).then(function (_fixture) {
                    fixture = _fixture;
                    testElement = _fixture.debugElement.query(by_1.By.css('test-element')).nativeElement;
                    testComponent = _fixture.componentInstance;
                    done();
                });
            })();
        }
        else {
            done();
        }
    });
    testing_1.describe('Two-way data binding', function () {
        beforeAll(function () {
            template = "\n        <test-element\n          [(value)]=\"value\"\n          [(nestedObject)]=\"nestedObject\"\n          [(arrayObject)]=\"arrayObject\">\n        </test-element>\n        ";
        });
        testing_1.it('should have initial bound value', function () {
            fixture.detectChanges();
            testing_1.expect(testElement.value).toEqual('foo');
        });
        testing_1.it('should change value on bound value change', function () {
            testComponent.value = 'bar';
            fixture.detectChanges();
            testing_1.expect(testElement.value).toEqual('bar');
        });
        testing_1.it('should change bound value on value change', function () {
            testElement.value = 'bar';
            testing_1.expect(testComponent.value).toEqual('bar');
        });
        testing_1.it('should reflect change to a nested value (object)', function () {
            testComponent.nestedObject.value = 'foo';
            fixture.detectChanges();
            var nested = Polymer.dom(testElement.root).querySelector('#nested');
            testing_1.expect(nested.getAttribute('nested-object-value')).toEqual('foo');
        });
        testing_1.it('should reflect change to a nested value (array)', function () {
            testComponent.arrayObject.push('foo');
            fixture.detectChanges();
            var nested = Polymer.dom(testElement.root).querySelector('#nested');
            testing_1.expect(nested.getAttribute('array-object-value')).toEqual('foo');
        });
    });
    testing_1.describe('Form field', function () {
        var form;
        beforeAll(function () {
            template = "\n        <form [ngFormModel]=\"form\">\n          <test-element ngControl=\"value\" required></test-element>\n        </form>\n        ";
        });
        beforeEach(function () {
            form = new common_1.ControlGroup({ "value": new common_1.Control() });
            fixture.debugElement.componentInstance.form = form;
            fixture.detectChanges();
        });
        testing_1.describe('Initial state', function () {
            testing_1.it('should be initially pristine', function () {
                testing_1.expect(testElement.classList.contains('ng-pristine')).toEqual(true);
            });
            testing_1.it('should be initially untouched', function () {
                testing_1.expect(testElement.classList.contains('ng-untouched')).toEqual(true);
            });
            testing_1.it('should be invalid', function () {
                testing_1.expect(testElement.classList.contains('ng-invalid')).toEqual(true);
            });
            testing_1.it('should be an invalid form', function () {
                testing_1.expect(form.valid).toEqual(false);
            });
            testing_1.it('should not reflect invalid state to element initially', function () {
                testing_1.expect(testElement.invalid).toEqual(false);
            });
        });
        testing_1.describe('after value has changed', function () {
            beforeEach(function () {
                testElement.value = 'qux';
                fixture.detectChanges();
            });
            testing_1.it('should be dirty on value change', function () {
                testing_1.expect(testElement.classList.contains('ng-dirty')).toEqual(true);
            });
            testing_1.it('should be a valid form', function () {
                testing_1.expect(form.valid).toEqual(true);
            });
            testing_1.it('should have correct value', function () {
                testing_1.expect(form.value.value).toEqual('qux');
            });
            testing_1.it('should be valid', function () {
                testing_1.expect(testElement.classList.contains('ng-valid')).toEqual(true);
            });
            testing_1.it('should reflect invalid state to testElement when value changed', function () {
                testElement.value = '';
                fixture.detectChanges();
                testing_1.expect(testElement.invalid).toEqual(true);
            });
        });
    });
    testing_1.describe('Light dom content', function () {
        beforeAll(function () {
            template = "\n        <test-element [(value)]=\"value\" class=\"hascontent\">\n          <div class=\"foo\">Foo</div>\n          <div class=\"bar selected\" *ngIf=\"barVisible\">Bar</div>\n          <div class=\"bar2\" *ngIf=\"barVisible\">Bar2</div>\n          <div class=\"baz selected\">Baz</div>\n          Qux\n\n        </test-element>\n        ";
        });
        beforeEach(function (done) {
            setTimeout(done, 0);
        });
        function contentParentChildren(contentParentId) {
            var root = Polymer.dom(testElement.root);
            var selected = root.querySelector('#' + contentParentId);
            if (Polymer.Settings.useShadow) {
                return selected.firstElementChild.getDistributedNodes();
            }
            else {
                return selected.childNodes;
            }
        }
        function containsChild(contentParentId, childClassName) {
            var children = contentParentChildren(contentParentId);
            return Array.prototype.filter.call(children, function (node) {
                return node.classList && node.classList.contains(childClassName);
            }).length > 0;
        }
        testing_1.it('should distribute correctly', function () {
            // Local dom
            testing_1.expect(containsChild('selected', 'foo')).toEqual(false);
            testing_1.expect(containsChild('all', 'foo')).toEqual(true);
            testing_1.expect(containsChild('selected', 'bar')).toEqual(false);
            testing_1.expect(containsChild('all', 'bar')).toEqual(false);
            testing_1.expect(containsChild('selected', 'baz')).toEqual(true);
            var hasQux = Array.prototype.filter.call(contentParentChildren('all'), function (node) {
                return node.textContent.indexOf('Qux') !== -1;
            });
            testing_1.expect(hasQux.length).toEqual(1);
            // Light dom
            testing_1.expect(Polymer.dom(testElement).querySelector('.foo')).not.toEqual(null);
        });
        testing_1.it('should support ngif', function () {
            testComponent.barVisible = true;
            fixture.detectChanges();
            // expect(containsChild('selected', 'bar')).toEqual(true);
            testing_1.expect(containsChild('all', 'bar2')).toEqual(true);
        });
    });
});
var TestComponent = (function () {
    function TestComponent() {
        this.value = 'foo';
        this.nestedObject = { value: undefined };
        this.arrayObject = [];
        this.barVisible = false;
    }
    TestComponent = __decorate([
        core_1.Component({
            selector: 'test-component',
            template: "",
            directives: [polymer_element_1.PolymerElement('test-element')]
        }), 
        __metadata('design:paramtypes', [])
    ], TestComponent);
    return TestComponent;
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9seW1lci1lbGVtZW50LnNwZWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwb2x5bWVyLWVsZW1lbnQuc3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsd0JBUU8sdUJBQXVCLENBQUMsQ0FBQTtBQUMvQixnQ0FBK0IsbUJBQW1CLENBQUMsQ0FBQTtBQUNuRCx3QkFBc0QsMkJBQTJCLENBQUMsQ0FBQTtBQUNsRixxQkFBMEIsZUFBZSxDQUFDLENBQUE7QUFDMUMsdUJBQXNDLGlCQUFpQixDQUFDLENBQUE7QUFFeEQsbUJBQW1CLDRDQUE0QyxDQUFDLENBQUE7QUFFaEUsd0JBR08sMkNBQTJDLENBQUMsQ0FBQTtBQUVuRCw4QkFBb0IsQ0FBQyxpREFBdUMsRUFBRSxvREFBMEMsQ0FBQyxDQUFDO0FBRTFHLElBQU0sT0FBTyxHQUFjLE1BQU8sQ0FBQyxPQUFPLENBQUM7QUFFM0Msa0JBQVEsQ0FBQyxnQkFBZ0IsRUFBRTtJQUV6QixJQUFJLEdBQXlCLENBQUM7SUFDOUIsSUFBSSxRQUFhLENBQUM7SUFDbEIsSUFBSSxXQUFnQixDQUFDO0lBQ3JCLElBQUksYUFBNEIsQ0FBQztJQUNqQyxJQUFJLE9BQThCLENBQUM7SUFFbkMsWUFBRSxDQUFDLFlBQVksRUFBRTtRQUNmLGdCQUFNLENBQUMsZ0NBQWMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ3ZDLENBQUMsQ0FBQyxDQUFDO0lBRUgsWUFBRSxDQUFDLGFBQWEsRUFBRTtRQUNoQixnQkFBTSxDQUFDLE9BQU8sZ0NBQWMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNqRCxDQUFDLENBQUMsQ0FBQztJQUVILFVBQVUsQ0FBQyxVQUFDLElBQUk7UUFDZCxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ2IsZ0JBQU0sQ0FBQyxDQUFDLDhCQUFvQixDQUFDLEVBQUUsVUFBQyxHQUF5QjtnQkFDdkQsR0FBRyxDQUFDLGdC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