System.register(['@angular/core/testing', '@angular/compiler/testing', '@angular/core', './polymer-element', '@angular/platform-browser-dynamic/testing'], function(exports_1) {
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (this && this.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var testing_1, testing_2, core_1, polymer_element_1, testing_3;
    var Polymer, TestComponent;
    return {
        setters:[
            function (testing_1_1) {
                testing_1 = testing_1_1;
            },
            function (testing_2_1) {
                testing_2 = testing_2_1;
            },
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (polymer_element_1_1) {
                polymer_element_1 = polymer_element_1_1;
            },
            function (testing_3_1) {
                testing_3 = testing_3_1;
            }],
        execute: function() {
            testing_1.setBaseTestProviders(testing_3.TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS, testing_3.TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS);
            Polymer = window.Polymer;
            testing_1.describe('PolymerElement', function () {
                testing_1.it('is defined', function () {
                    testing_1.expect(polymer_element_1.PolymerElement).toBeDefined();
                });
                testing_1.it('is function', function () {
                    testing_1.expect(typeof polymer_element_1.PolymerElement).toBe('function');
                });
            });
            testing_1.describe('Two-way data binding', function () {
                // TODO: fixture, testElement, componentInstance as common vars (beforeEach)
                testing_1.it('should have initial bound value', testing_1.inject([testing_2.TestComponentBuilder], function (tcb) {
                    return tcb.createAsync(TestComponent).then(function (fixture) {
                        var testElement = fixture.nativeElement.firstElementChild;
                        testing_1.expect(fixture.componentInstance.value).toEqual('foo');
                    });
                }));
                testing_1.it('should change value on bound value change', testing_1.inject([testing_2.TestComponentBuilder], function (tcb) {
                    return tcb.createAsync(TestComponent).then(function (fixture) {
                        var testElement = fixture.nativeElement.firstElementChild;
                        fixture.componentInstance.value = 'bar';
                        fixture.detectChanges();
                        testing_1.expect(testElement.value).toEqual('bar');
                    });
                }));
                testing_1.it('should change bound value on value change', testing_1.inject([testing_2.TestComponentBuilder], function (tcb) {
                    return tcb.createAsync(TestComponent).then(function (fixture) {
                        var testElement = fixture.nativeElement.firstElementChild;
                        testElement.value = false;
                        testing_1.expect(fixture.componentInstance.value).toEqual(false);
                    });
                }));
            });
            // it('should call router.navigate when a link is clicked if target is _self', async(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
            //   return tcb.createAsync(TestComponent)
            //     .then((testComponent) => {
            //       //  testComponent.detectChanges();
            //       //  testComponent.debugElement.query(By.css('a.detail-view-self'))
            //       //      .triggerEventHandler('click', null);
            //       //  expect(router.spy('navigateByInstruction')).toHaveBeenCalledWith(dummyInstruction);
            //       // async.done();
            //       expect(true).toEqual(true);
            //     })
            //   })));
            //  it('should render \'Hello\'', async(inject([TestComponentBuilder], (tcb:TestComponentBuilder) => {
            //   tcb.createAsync(TestComponent)
            //     .then((fixture: TestComponent) => {
            //       //fixture.detectChanges();
            //       //const footer = fixture.nativeElement;
            //       //expect(hello.querySelector('a').textContent.trim()).toBe('Hello');
            //       expect(true).toEqual(true);
            //     });
            // })));
            // it('should fail', async(inject([TestComponentBuilder], (_tcb: TestComponentBuilder) => {
            //   return _tcb.createAsync(TestComponent).then(fixture => {
            //     expect(1).toBe(2)
            //   });
            // }))
            // );
            TestComponent = (function () {
                function TestComponent() {
                    this.value = 'foo';
                }
                TestComponent = __decorate([
                    core_1.Component({
                        selector: 'test-component',
                        template: "\n    <test-element [(value)]=\"value\"></test-element>",
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