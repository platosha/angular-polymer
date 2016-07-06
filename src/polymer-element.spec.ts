import {
describe,
expect,
it,
inject,
setBaseTestProviders
} from '@angular/core/testing';
import { PolymerElement } from './polymer-element';
import { TestComponentBuilder, ComponentFixture} from '@angular/compiler/testing';
import { Component } from '@angular/core';
import { ControlGroup, Control } from '@angular/common';
import { By } from '@angular/platform-browser/src/dom/debug/by';
import { __platform_browser_private__ } from '@angular/platform-browser';

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

    beforeAll(() => {
      template = `
        <test-element
          [(value)]="value"
          [(nestedObject)]="nestedObject"
          [(arrayObject)]="arrayObject">
        </test-element>
        `;
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

    var form: ControlGroup;

    beforeAll(() => {
      template = `
        <form [ngFormModel]="form">
          <test-element ngControl="value" required></test-element>
        </form>
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

  describe('Light dom content', () => {

    beforeAll(() => {
      template = `
        <test-element [(value)]="value" class="hascontent">
          <div class="foo">Foo</div>
          <div class="bar selected" *ngIf="barVisible">Bar</div>
          <div class="bar2" *ngIf="barVisible">Bar2</div>
          <div class="baz selected">Baz</div>
          Qux

        </test-element>
        `;
    });

    beforeEach((done) => {
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

    beforeAll(() => {
      template = `
        <test-element [(value)]="value" class="hascontent">
          <div class="foo" *ngFor="let item of arrayObject">Foo {{item}}</div>
          <div class="bar selected" *ngIf="barVisible">Bar</div>
          <div class="bar2" *ngIf="barVisible">Bar2</div>
          <div class="baz selected">Baz</div>
        </test-element>
        `;
    });

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
  selector: 'test-component',
  template: ``,
  directives: [PolymerElement('test-element')]
})
class TestComponent {

  value = 'foo';

  nestedObject = { value: undefined };

  arrayObject = [];

  barVisible = false;

}
