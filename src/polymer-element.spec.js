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
            template = "<test-element [(value)]=\"value\"></test-element>";
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
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9seW1lci1lbGVtZW50LnNwZWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwb2x5bWVyLWVsZW1lbnQuc3BlYy50cyJdLCJuYW1lcyI6WyJjb250ZW50UGFyZW50Q2hpbGRyZW4iLCJjb250YWluc0NoaWxkIiwiVGVzdENvbXBvbmVudCIsIlRlc3RDb21wb25lbnQuY29uc3RydWN0b3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLHdCQVFPLHVCQUF1QixDQUFDLENBQUE7QUFDL0IsZ0NBQStCLG1CQUFtQixDQUFDLENBQUE7QUFDbkQsd0JBQXNELDJCQUEyQixDQUFDLENBQUE7QUFDbEYscUJBQTBCLGVBQWUsQ0FBQyxDQUFBO0FBQzFDLHVCQUFzQyxpQkFBaUIsQ0FBQyxDQUFBO0FBRXhELG1CQUFtQiw0Q0FBNEMsQ0FBQyxDQUFBO0FBRWhFLHdCQUdPLDJDQUEyQyxDQUFDLENBQUE7QUFFbkQsOEJBQW9CLENBQUMsaURBQXVDLEVBQUUsb0RBQTBDLENBQUMsQ0FBQztBQUUxRyxJQUFNLE9BQU8sR0FBYyxNQUFPLENBQUMsT0FBTyxDQUFDO0FBRTNDLGtCQUFRLENBQUMsZ0JBQWdCLEVBQUU7SUFFekIsSUFBSSxHQUF5QixDQUFDO0lBQzlCLElBQUksUUFBYSxDQUFDO0lBQ2xCLElBQUksV0FBZ0IsQ0FBQztJQUNyQixJQUFJLGFBQTRCLENBQUM7SUFDakMsSUFBSSxPQUE4QixDQUFDO0lBRW5DLFlBQUUsQ0FBQyxZQUFZLEVBQUU7UUFDZixnQkFBTSxDQUFDLGdDQUFjLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUN2QyxDQUFDLENBQUMsQ0FBQztJQUVILFlBQUUsQ0FBQyxhQUFhLEVBQUU7UUFDaEIsZ0JBQU0sQ0FBQyxPQUFPLGdDQUFjLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDakQsQ0FBQyxDQUFDLENBQUM7SUFFSCxVQUFVLENBQUMsVUFBQyxJQUFJO1FBQ2QsRUFBRSxDQUFDLENBQUMsUUFBUSxD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