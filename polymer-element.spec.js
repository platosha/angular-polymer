System.register(['@angular/core/testing', './polymer-element', '@angular/compiler/testing', '@angular/core', '@angular/common', '@angular/platform-browser/src/dom/debug/by', '@angular/platform-browser-dynamic/testing'], function(exports_1) {
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (this && this.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var testing_1, polymer_element_1, testing_2, core_1, common_1, by_1, testing_3;
    var Polymer, TestComponent;
    return {
        setters:[
            function (testing_1_1) {
                testing_1 = testing_1_1;
            },
            function (polymer_element_1_1) {
                polymer_element_1 = polymer_element_1_1;
            },
            function (testing_2_1) {
                testing_2 = testing_2_1;
            },
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (common_1_1) {
                common_1 = common_1_1;
            },
            function (by_1_1) {
                by_1 = by_1_1;
            },
            function (testing_3_1) {
                testing_3 = testing_3_1;
            }],
        execute: function() {
            testing_1.setBaseTestProviders(testing_3.TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS, testing_3.TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS);
            Polymer = window.Polymer;
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
                        template = "\n        <form [ngFormModel]=\"form\">\n          <test-element ngControl=\"value\" required></test-element>\n        </form>'\n        ";
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
            });
            TestComponent = (function () {
                function TestComponent() {
                    this.value = 'foo';
                    this.barvisible = false;
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
        }
    }
});
//# sourceMappingURL=polymer-element.spec.js.map