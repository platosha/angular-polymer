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
      var root = Polymer.dom(testElement.root);
      var selected = root.querySelector('#' + contentParentId);
      if (Polymer.Settings.useShadow) {
        return selected.firstElementChild.getDistributedNodes();
      } else {
        return selected.childNodes;
      }
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

    it('should support ngif', () => {
      testComponent.barVisible = true;
      fixture.detectChanges();
      expect(containsChild('selected', 'bar')).toEqual(true);
      expect(containsChild('all', 'bar2')).toEqual(true);
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
