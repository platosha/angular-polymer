import {
    async,
    TestBed,
    ComponentFixture
} from '@angular/core/testing';
import {PolymerElement} from './polymer-element';
import {Component, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ReactiveFormsModule, FormGroup, FormControl} from '@angular/forms';

const Polymer: any = (<any>window).Polymer;

describe('PolymerElement', () => {

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule
            ],
            declarations: [
                TestComponent,
                TestComponentForm,
                TestComponentCheckboxForm,
                PolymerElement('test-element'),
                PolymerElement('paper-checkbox')
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        });
        TestBed.compileComponents();
    }));

    let testElement: any;
    let testComponent: TestComponent;
    let fixture: ComponentFixture<any>;

    function createTestComponent(type: any) {
        fixture = TestBed.createComponent(type);
        testElement = fixture.debugElement.query((el) => el.name === 'test-element').nativeElement;
        testComponent = fixture.componentInstance;
    }

    it('is defined', () => {
        expect(PolymerElement).toBeDefined();
    });

    it('is function', () => {
        expect(typeof PolymerElement).toBe('function');
    });

    describe('Developer experience', () => {

        it('should throw an error for non-registered elements', () => {
            try {
                PolymerElement('non-registered');
            } catch (error) {
                expect(error.message).toContain('element "non-registered" has not been registered');
            }
        });

    });

    describe('Two-way data binding', () => {

        beforeEach(() => {
            createTestComponent(TestComponent);
        });

        it('should have initial bound value', () => {
            fixture.detectChanges();
            expect(testElement.value).toEqual('foo');
        });

        it('should change value on bound value change', () => {
            testComponent.value = 'bar';
            fixture.detectChanges();
            expect(testElement.value).toEqual('bar');
        });

        it('should change bound value on value change', () => {
            testElement.value = 'bar';
            expect(testComponent.value).toEqual('bar');
        });

        it('should reflect change to a nested value (object)', () => {
            testComponent.nestedObject.value = 'foo';
            fixture.detectChanges();
            let nested = Polymer.dom(testElement.root).querySelector('#nested');
            expect(nested.getAttribute('nested-object-value')).toEqual('foo');
        });

        it('should reflect change to a nested value (array)', () => {
            testComponent.arrayObject.push('foo');
            fixture.detectChanges();
            let nested = Polymer.dom(testElement.root).querySelector('#nested');
            expect(nested.getAttribute('array-object-value')).toEqual('foo');
        });

    });

    describe('Form field', () => {

        let form: any;

        function formTests(): void {

            describe('Initial state', () => {

                it('should be initially pristine', () => {
                    expect(testElement.classList.contains('ng-pristine')).toEqual(true);
                });

                it('should be initially untouched', () => {
                    expect(testElement.classList.contains('ng-untouched')).toEqual(true);
                });

                it('should be invalid', () => {
                    expect(testElement.classList.contains('ng-invalid')).toEqual(true);
                });

                it('should be an invalid form', () => {
                    expect(form.valid).toEqual(false);
                });

                it('should not reflect invalid state to element initially', () => {
                    expect(testElement.invalid).toBeFalsy();
                });

            });

            describe('after value has changed', () => {

                beforeEach(() => {
                    testElement.value = 'qux';
                    fixture.detectChanges();
                });

                it('should be dirty on value change', () => {
                    expect(testElement.classList.contains('ng-dirty')).toEqual(true);
                });

                it('should be a valid form', () => {
                    expect(form.valid).toEqual(true);
                });

                it('should have correct value', () => {
                    expect(form.value.value).toEqual('qux');
                });

                it('should be valid', () => {
                    expect(testElement.classList.contains('ng-valid')).toEqual(true);
                });

                it('should reflect invalid state to testElement when value changed', () => {
                    testElement.value = '';
                    fixture.detectChanges();
                    expect(testElement.invalid).toEqual(true);
                });

            });

        }

        describe('Forms API', () => {

            beforeEach(() => {
                createTestComponent(TestComponentForm);
                form = new FormGroup({value: new FormControl()});
                fixture.debugElement.componentInstance.form = form;
                fixture.detectChanges();
            });

            formTests();
        });

    });


    describe('Checked Element inside Form', () => {

        let form: FormGroup;
        let checkedElement: any;

        describe('initially false', () => {
            beforeEach(() => {
                createTestComponent(TestComponentCheckboxForm);
                form = new FormGroup({value: new FormControl(false)});
                fixture.debugElement.componentInstance.form = form;
                fixture.detectChanges();
                checkedElement = fixture.debugElement.query((el) => el.name === 'paper-checkbox').nativeElement;
            });

            it('should set default value', () => {
                expect(checkedElement.checked).toEqual(false);
            });

            it('should set form value', () => {
                checkedElement.checked = true;
                expect(form.value.value).toEqual(true);
            });
        });

        describe('initially true', () => {
            beforeEach(() => {
                createTestComponent(TestComponentCheckboxForm);
                form = new FormGroup({value: new FormControl(true)});
                fixture.debugElement.componentInstance.form = form;
                fixture.detectChanges();
                checkedElement = fixture.debugElement.query((el) => el.name === 'paper-checkbox').nativeElement;
            });

            it('should set default value', () => {
                expect(checkedElement.checked).toEqual(true);
            });

            it('should set form value', () => {
                checkedElement.checked = false;
                expect(form.value.value).toEqual(false);
            });
        });
    });
});


@Component({
    template: `<test-element [(value)]="value" [(nestedObject)]="nestedObject" [(arrayObject)]="arrayObject"></test-element>`
})
class TestComponent {
    value = 'foo';
    nestedObject = {value: undefined};
    arrayObject = [];
    barVisible = false;
}

@Component({
    template: `
    <form [formGroup]="form">
      <test-element formControlName="value" required></test-element>
    </form>`
})
class TestComponentForm {
    value = 'foo';
}

@Component({
    // test-element added to make the global test setup not crash.
    template: `
    <form [formGroup]="form">
      <paper-checkbox formControlName="value"></paper-checkbox>
    </form>
    <test-element></test-element>`
})
class TestComponentCheckboxForm {
}
