import {
describe,
expect,
it,
injectAsync,
inject,
async,
setBaseTestProviders
} from '@angular/core/testing';
import { PolymerElement } from './polymer-element';
import { TestComponentBuilder, ComponentFixture} from '@angular/compiler/testing';
import { Component } from '@angular/core';
import { ControlGroup, Control } from '@angular/common';
import { dispatchEvent } from '@angular/platform-browser/testing';
import { By } from '@angular/platform-browser/src/dom/debug/by';

import {
TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS,
TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS,
} from '@angular/platform-browser-dynamic/testing';

setBaseTestProviders(TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS, TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS);

const Polymer: any = (<any>window).Polymer;

describe('PolymerElement', () => {

  var tcb: TestComponentBuilder;
  var template: any;
  var testElement: any;
  var testComponent: TestComponent;
  var fixture: ComponentFixture<any>;

  it('is defined', () => {
    expect(PolymerElement).toBeDefined();
  });

  it('is function', () => {
    expect(typeof PolymerElement).toBe('function');
  });

  beforeEach((done) => {
    if (template) {
      inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
        tcb.overrideTemplate(TestComponent, template).createAsync(TestComponent).then((_fixture) => {
          fixture = _fixture;
          testElement = _fixture.debugElement.query(By.css('test-element')).nativeElement;
          testComponent = _fixture.componentInstance;
          done();
        });
      })();
    } else {
      done();
    }
  });

  describe('Two-way data binding', () => {

    beforeAll(() => {
      template = `<test-element [(value)]="value"></test-element>`;
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

  });

  describe('Form field', () => {

    var form: ControlGroup;

    beforeAll(() => {
      template = `
        <form [ngFormModel]="form">
          <test-element ngControl="value" required></test-element>
        </form>'
        `;
    });

    beforeEach(() => {
      form = new ControlGroup({ "value": new Control() });
      fixture.debugElement.componentInstance.form = form;
      fixture.detectChanges();
    });

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
        expect(testElement.invalid).toEqual(false);
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
  });
});

@Component({
  selector: 'test-component',
  template: ``,
  directives: [PolymerElement('test-element')]
})
class TestComponent {

  value = 'foo';

  barvisible = false;

}
