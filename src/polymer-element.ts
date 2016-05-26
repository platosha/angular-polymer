import {
  Injector,
  Directive,
  ElementRef,
  EventEmitter,
  forwardRef,
  provide,
  Renderer,
  NgZone,
  KeyValueDiffers,
  IterableDiffers,
  DefaultIterableDiffer
} from '@angular/core';
import { NgControl, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/common';

import { __platform_browser_private__ } from '@angular/platform-browser';

const Polymer:any = (<any>window).Polymer;

class PolymerDomAdapter extends __platform_browser_private__.BrowserDomAdapter {
  createStyleElement(css, doc = document) {
    var style = doc.createElement.call(doc, 'style', 'custom-style');
    this.appendChild(style, this.createTextNode(css));
    return style;
  }
}

class PolymerShadyDomAdapter extends PolymerDomAdapter {
  parentElement(el) { return Polymer.dom(el).parentNode; }

  appendChild(el, node) { Polymer.dom(el).appendChild(node); Polymer.dom.flush(); }
  insertBefore(el, node) { Polymer.dom(this.parentElement(el)).insertBefore(node, el); Polymer.dom.flush(); }
  insertAllBefore(el, nodes) { var elParentDom = Polymer.dom(this.parentElement(el)); nodes.forEach(n => elParentDom.insertBefore(n, el)); Polymer.dom.flush(); }
  insertAfter(el, node) { this.insertBefore(this.nextSibling(el), node); }
  removeChild(el, node) { Polymer.dom(el).removeChild(node); Polymer.dom.flush(); }
  childNodes(el) { return Polymer.dom(el).childNodes; }
  remove(node) { if (this.parentElement(node)) { this.removeChild(this.parentElement(node), node); } return node; }
  clearNodes(el) { while(Polymer.dom(el).firstChild) { Polymer.dom(el).removeChild(Polymer.dom(el).firstChild); } Polymer.dom.flush(); }

  firstChild(el) { return Polymer.dom(el).firstChild; }
  lastChild(el) { return Polymer.dom(el).lastChild; }
  previousSibling(el) { return Polymer.dom(el).previousSibling; }
  nextSibling(el) { return Polymer.dom(el).nextSibling; }

  getInnerHTML(el) { return Polymer.dom(el).innerHTML; }
  setInnerHTML(el, value) { Polymer.dom(el).innerHTML = value; }

  querySelector(el, selector) { return Polymer.dom(el).querySelector(selector); }
  querySelectorAll(el, selector) { return Polymer.dom(el).querySelectorAll(selector); }

  getDistributedNodes(el) { return Polymer.dom(el).getDistributedNodes(); }

  classList(el) { return Polymer.dom(el).classList; }
  addClass(el, className) { this.classList(el).add(className); }
  removeClass(el, className) { this.classList(el).remove(className); }
  hasClass(el, className) { return this.classList(el).contains(className); }

  setAttribute(el, name, value) { Polymer.dom(el).setAttribute(name, value); }
  removeAttribute(el, name) { Polymer.dom(el).removeAttribute(name); }
}

if (Polymer.Settings.useShadow) {
  __platform_browser_private__.setDOM(new PolymerDomAdapter());
} else {
  __platform_browser_private__.setDOM(new PolymerShadyDomAdapter());
}

export function PolymerElement(name: string): any[] {
  const propertiesWithNotify: Array<any> = [];
  const arrayAndObjectProperties: Array<any> = [];

  const proto:any = Object.getPrototypeOf(document.createElement(name));
  const isFormElement:boolean = Polymer && Polymer.IronFormElementBehavior && proto.behaviors.indexOf(Polymer.IronFormElementBehavior) > -1;
  proto.behaviors.forEach((behavior:any) => configureProperties(behavior.properties));
  configureProperties(proto.properties);

  function configureProperties(properties: any) {
    if (properties) {
      Object.getOwnPropertyNames(properties)
        .filter(name => name.indexOf('_') !== 0)
        .forEach(name => configureProperty(name, properties))
    }
  }

  function configureProperty(name: string, properties: any) {
    var info = properties[name];
    if (typeof info === 'function') {
      info = {
        type: info
      };
    }

    if (info.type && !info.readOnly && (info.type === Object || info.type === Array)) {
      arrayAndObjectProperties.push(name);
    }

    if (info && info.notify) {
      propertiesWithNotify.push(name);
    }
  }

  const eventNameForProperty = (property: string) => `${property}Change`;

  const changeEventsAdapterDirective = Directive({
    selector: name,
    outputs: propertiesWithNotify.map(eventNameForProperty),
    host: propertiesWithNotify.reduce((hostBindings, property) => {
      hostBindings[`(${Polymer.CaseMap.camelToDashCase(property)}-changed)`] = `_emitChangeEvent('${property}', $event);`;
      return hostBindings;
    }, {})
  }).Class({
    constructor: function() {
      propertiesWithNotify
        .forEach(property => this[eventNameForProperty(property)] = new EventEmitter<any>(false));
    },

    _emitChangeEvent(property: string, event: any) {
      // Event is a notification for a sub-property when `path` exists and the
      // event.detail.value holds a value for a sub-property.

      // For sub-property changes we don't need to explicitly emit events,
      // since all interested parties are bound to the same object and Angular
      // takes care of updating sub-property bindings on changes.
      if (!event.detail.path) {
        this[eventNameForProperty(property)].emit(event.detail.value);
      }
    }
  });

  const validationDirective = Directive({
    selector: name
  }).Class({
    constructor: [ElementRef, Injector, function(el: ElementRef, injector: Injector) {
      this._element = el.nativeElement;
      this._control = injector.get(NgControl, null);
    }],

    ngDoCheck: function() {
      if(this._control) {
        this._element.invalid = !this._control.pristine && !this._control.valid;
      }
    }
  });

  const formElementDirective:any = Directive({
    selector: name,
    providers: [provide(
      NG_VALUE_ACCESSOR, {
        useExisting: forwardRef(() => formElementDirective),
        multi: true
      })],
    host: {
      '(valueChange)': 'onValueChanged($event)'
    }
  }).Class({
    constructor: [Renderer, ElementRef, function(renderer: Renderer, el: ElementRef) {
      this._renderer = renderer;
      this._element = el.nativeElement;
      this._element.addEventListener('blur', () => this.onTouched(), true);
    }],

    onChange: (_: any) => { },
    onTouched: () => { },

    writeValue: function(value: any): void {
      this._renderer.setElementProperty(this._element, 'value', value);
    },

    registerOnChange: function(fn: (_: any) => void): void { this.onChange = fn; },
    registerOnTouched: function(fn: () => void): void { this.onTouched = fn; },

    onValueChanged: function(value: String) {
      if (this._initialValueSet) {
        this.onChange(value);
      } else {
        this._initialValueSet = true;
      }
    }
  });

  const notifyForDiffersDirective = Directive({
    selector: name,
    inputs: arrayAndObjectProperties,
    host: arrayAndObjectProperties.reduce((hostBindings, property) => {
      hostBindings[`(${Polymer.CaseMap.camelToDashCase(property)}-changed)`] = `_setValueFromElement('${property}', $event);`;
      return hostBindings;
    }, {})

  }).Class({

    constructor: [ElementRef, IterableDiffers, KeyValueDiffers, function(el: ElementRef, iterableDiffers: IterableDiffers, keyValueDiffers: KeyValueDiffers) {
      this._element = el.nativeElement;
      this._iterableDiffers = iterableDiffers;
      this._keyValueDiffers = keyValueDiffers;
      this._differs = {};
      this._arrayDiffs = {};
    }],

    ngOnInit() {
      var elm = this._element;
      // In case the element has a default value and the directive doesn't have any value set for a property,
      // we need to make sure the element value is set to the directive.
      arrayAndObjectProperties.filter(property => elm[property] && !this[property])
                              .forEach(property => {
                                this[property] = elm[property];
                              });
    },

    _setValueFromElement(property: string, event: Event) {
        // Properties in this directive need to be kept synced manually with the element properties.
        // Don't use event.detail.value here because it might contain changes for a sub-property.
        var target:any = event.target;
        if (this[property] !== target[property]) {
          this[property] = target[property];
          this._differs[property] = this._createDiffer(this[property]);
        }
    },

    _createDiffer(value: string) {
      var differ = Array.isArray(value) ? this._iterableDiffers.find(value).create(null) : this._keyValueDiffers.find(value || {}).create(null);

      // initial diff with the current value to make sure the differ is synced
      // and doesn't report any outdated changes on the next ngDoCheck call.
      differ.diff(value);

      return differ;
    },

    _handleArrayDiffs(property: string, diff: any) {
      if (diff) {
        diff.forEachRemovedItem((item: any) => this._notifyArray(property, item.previousIndex));
        diff.forEachAddedItem((item: any) => this._notifyArray(property, item.currentIndex));
        diff.forEachMovedItem((item: any) => this._notifyArray(property, item.currentIndex));
      }
    },

    _handleObjectDiffs(property: string, diff: any) {
      if (diff) {
        var notify = (item: any) => this._notifyPath(property + '.' + item.key, item.currentValue);
        diff.forEachRemovedItem(notify);
        diff.forEachAddedItem(notify);
        diff.forEachChangedItem(notify);
      }
    },

    _notifyArray(property: string, index: number) {
      this._notifyPath(property + '.' + index, this[property][index]);
    },

    _notifyPath(path: string, value: any) {
       (<any>this)._element.notifyPath(path, value);
    },

    ngDoCheck() {
      arrayAndObjectProperties.forEach(property => {
        var elm = (<any>this)._element;
        var _differs = (<any>this)._differs;
        if (elm[property] !== this[property]) {
          elm[property] = this[property];
          _differs[property] = this._createDiffer(this[property]);
        } else if (_differs[property]) {

          // TODO: these differs won't pickup any changes in need properties like items[0].foo
          var diff = _differs[property].diff(this[property]);
          if (diff instanceof DefaultIterableDiffer) {
            this._handleArrayDiffs(property, diff);
          } else {
            this._handleObjectDiffs(property, diff);
          }
        }
      });
    }
  });

  const chartsConfigurationDirective = Directive({
    selector: name
  }).Class({
    constructor: [ElementRef, NgZone, function(el: ElementRef, zone: NgZone) {
      if (!Polymer.Settings.useShadow) {
        el.nativeElement.async(() => {
          // Reload Chart if needed.
          if (el.nativeElement.isInitialized && el.nativeElement.isInitialized()) {
            // Reload outside of Angular to prevent DataSeries.ngDoCheck being called on every mouse event.
            zone.runOutsideAngular(() => {
              el.nativeElement.reloadConfiguration();
            });
          }
        });
      }
    }],
  });

  var directives = [changeEventsAdapterDirective, notifyForDiffersDirective, chartsConfigurationDirective];

  if (isFormElement) {
    directives.push(formElementDirective);
    directives.push(validationDirective);
  }

  return directives;
}
