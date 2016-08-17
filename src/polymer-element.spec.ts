import {
  async,
  TestBed,
  ComponentFixture
} from '@angular/core/testing';
import { PolymerElement } from './polymer-element';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FORM_DIRECTIVES, ControlGroup, Control } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, disableDeprecatedForms, provideForms } from '@angular/forms';
import { __platform_browser_private__ } from '@angular/platform-browser';

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
        TestComponentDeprecatedForm,
        TestComponentLightDom,
        TestComponentDomApi,
        PolymerElement('test-element'),
        PolymerElement('paper-checkbox')
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });
    TestBed.compileComponents();
  }));

  var testElement: any;
  var testComponent: TestComponent;
  var fixture: ComponentFixture<any>;

  function createTestComponent(type: any) {
    fixture = TestBed.createComponent(type);
    testElement = fixture.debugElement.query((el) => el.name == 'test-element').nativeElement;
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

    beforeEach(() => { createTestComponent(TestComponent); });

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
      var nested = Polymer.dom(testElement.root).querySelector('#nested');
      expect(nested.getAttribute('nested-object-value')).toEqual('foo');
    });

    it('should reflect change to a nested value (array)', () => {
      testComponent.arrayObject.push('foo');
      fixture.detectChanges();
      var nested = Polymer.dom(testElement.root).querySelector('#nested');
      expect(nested.getAttribute('array-object-value')).toEqual('foo');
    });

  });

  describe('Form field', () => {

    var form: any;

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

    describe('Deprecated forms API', () => {

      beforeEach(() => {
        createTestComponent(TestComponentDeprecatedForm);
        form = new ControlGroup({value: new Control()});
        fixture.debugElement.componentInstance.form = form;
        fixture.detectChanges();
      });

      formTests();
    });

    describe('New forms API', () => {

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

    var form: FormGroup;

    describe('initially false', () => {
      beforeEach(() => {
        createTestComponent(TestComponentCheckboxForm);
        form = new FormGroup({value: new FormControl(false)});
        fixture.debugElement.componentInstance.form = form;
        fixture.detectChanges();
      });

      it('should set default value', () => {
        var checkedElement = fixture.debugElement.query((el) => el.name == 'paper-checkbox').nativeElement;
        expect(checkedElement.checked).toEqual(false);
      });

      it('should set form value', () => {
        var checkedElement = fixture.debugElement.query((el) => el.name == 'paper-checkbox').nativeElement;
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
      });

      it('should set default value', () => {
        var checkedElement = fixture.debugElement.query((el) => el.name == 'paper-checkbox').nativeElement;
        expect(checkedElement.checked).toEqual(true);
      });

      it('should set form value', () => {
        var checkedElement = fixture.debugElement.query((el) => el.name == 'paper-checkbox').nativeElement;
        checkedElement.checked = false;
        expect(form.value.value).toEqual(false);
      });
    });
  });

  describe('Light dom content', () => {

    beforeEach((done) => {
      createTestComponent(TestComponentLightDom);
      setTimeout(done, 0);
    });

    function contentParentChildren(contentParentId) {
      var selected = testElement.$[contentParentId];
      return Polymer.dom(selected).getDistributedNodes();
    }

    function containsChild(contentParentId, childClassName) {
      var children = contentParentChildren(contentParentId);
      return Array.prototype.filter.call(children, (node) => {
        return node.classList && node.classList.contains(childClassName);
      }).length > 0;
    }

    it('should distribute correctly', () => {
      // Local dom
      expect(containsChild('selected', 'foo')).toEqual(false);
      expect(containsChild('all', 'foo')).toEqual(true);

      expect(containsChild('selected', 'bar')).toEqual(false);
      expect(containsChild('all', 'bar')).toEqual(false);

      expect(containsChild('selected', 'baz')).toEqual(true);

      var hasQux = Array.prototype.filter.call(contentParentChildren('all'), (node) => {
        return node.textContent.indexOf('Qux') !== -1;
      });
      expect(hasQux.length).toEqual(1);

      // Light dom
      expect(Polymer.dom(testElement).querySelector('.foo')).not.toEqual(null);
    });

    it('should support ngif', (done) => {
      testComponent.barVisible = true;
      fixture.detectChanges();
      // Distribution with polyfills is done with MutationObservers, so it is asynchronous
      setTimeout(function() {
        expect(containsChild('selected', 'bar')).toEqual(true);
        expect(containsChild('all', 'bar2')).toEqual(true);
        done();
      }, 0);
    });

  });

  describe('DOM API', () => {

    beforeEach(() => { createTestComponent(TestComponentDomApi); });

    it('should trigger one mutation after multiple operations', (done) => {
      var observerSpy = jasmine.createSpy('observerSpy');
      var domApi = Polymer.dom(testElement).observeNodes(observerSpy);
      testComponent.arrayObject = [1, 2, 3];
      fixture.detectChanges();
      testComponent.arrayObject.push(4);
      fixture.detectChanges();
      testComponent.arrayObject.pop();
      fixture.detectChanges();
      testComponent.arrayObject = [0, 1, 2];
      fixture.detectChanges();
      testComponent.barVisible = true;
      fixture.detectChanges();
      testComponent.barVisible = false;
      fixture.detectChanges();
      setTimeout(function() {
        expect(observerSpy).toHaveBeenCalledTimes(1);
        done();
      }, 0);
    });

    it('should have the correct adapter', () => {
      const functionName = (fun) => {
        var ret = fun.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
      };

      var dom = __platform_browser_private__.getDOM();
      const adapterName = functionName(dom.constructor);

      if (Polymer.Settings.useShadow) {
        expect(adapterName).toEqual("PolymerDomAdapter");
      } else {
        expect(adapterName).toEqual("PolymerShadyDomAdapter");
      }
    });

  });
});


@Component({
  template: `<test-element [(value)]="value" [(nestedObject)]="nestedObject" [(arrayObject)]="arrayObject"></test-element>`
})
class TestComponent {
  value = 'foo';
  nestedObject = { value: undefined };
  arrayObject = [];
  barVisible = false;
}

@Component({
  directives: [FORM_DIRECTIVES],
  template: `
    <form [ngFormModel]="form">
      <test-element ngControl="value" required></test-element>
    </form>`
})
class TestComponentDeprecatedForm {
  value = 'foo';
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
class TestComponentCheckboxForm { }

@Component({
  template: `
    <test-element [(value)]="value" class="hascontent">
      <div class="foo">Foo</div>
      <div class="bar selected" *ngIf="barVisible">Bar</div>
      <div class="bar2" *ngIf="barVisible">Bar2</div>
      <div class="baz selected">Baz</div>
      Qux
    </test-element>`
})
class TestComponentLightDom { }

@Component({
  template: `
    <test-element [(value)]="value" class="hascontent">
      <div class="foo" *ngFor="let item of arrayObject">Foo {{item}}</div>
      <div class="bar selected" *ngIf="barVisible">Bar</div>
      <div class="bar2" *ngIf="barVisible">Bar2</div>
      <div class="baz selected">Baz</div>
    </test-element>`
})
class TestComponentDomApi { }
