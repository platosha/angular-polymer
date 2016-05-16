import {
describe,
expect,
it,
injectAsync,
inject,
async,
setBaseTestProviders
} from '@angular/core/testing';
import { TestComponentBuilder } from '@angular/compiler/testing';
import {provide, Component} from '@angular/core';
import { PolymerElement } from './polymer-element';

import {
TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS,
TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS,
} from '@angular/platform-browser-dynamic/testing';

setBaseTestProviders(TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS, TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS);

const Polymer: any = (<any>window).Polymer;


describe('PolymerElement', () => {

  it('is defined', () => {
    expect(PolymerElement).toBeDefined();
  });

  it('is function', () => {
    expect(typeof PolymerElement).toBe('function');
  });
});

describe('Two-way data binding', () => {

  // TODO: fixture, testElement, componentInstance as common vars (beforeEach)
  it('should have initial bound value', inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
    return tcb.createAsync(TestComponent).then((fixture) => {
      const testElement = fixture.nativeElement.firstElementChild;
      expect(fixture.componentInstance.value).toEqual('foo');
    });
  }));

  it('should change value on bound value change', inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
    return tcb.createAsync(TestComponent).then((fixture) => {
      const testElement = fixture.nativeElement.firstElementChild;
      fixture.componentInstance.value = 'bar';
      fixture.detectChanges();
      expect(testElement.value).toEqual('bar');
    });
  }));

  it('should change bound value on value change', inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
    return tcb.createAsync(TestComponent).then((fixture) => {
      const testElement = fixture.nativeElement.firstElementChild;
      testElement.value = false;
      expect(fixture.componentInstance.value).toEqual(false);
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




@Component({
  selector: 'test-component',
  template: `
    <test-element [(value)]="value"></test-element>`,
  directives: [PolymerElement('test-element')]
})
class TestComponent {

  public value = 'foo';

  constructor() {

  }
}
