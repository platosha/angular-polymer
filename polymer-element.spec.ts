import {
  describe,
  expect,
  it,
  injectAsync
} from '@angular/core/testing';
import { TestComponentBuilder } from '@angular/compiler/testing';

const Polymer: any = (<any>window).Polymer;

import { PolymerElement } from './polymer-element';

describe('PolymerElement', () => {

  it('is defined', () => {
    expect(PolymerElement).toBeDefined();
  });

  it('is function', () => {
    expect(typeof PolymerElement).toBe('function');
  });

});
