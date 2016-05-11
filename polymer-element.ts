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

export function PolymerElement(name: any) {
  const propertiesWithNotify: Array<any> = [];
  const arrayAndObjectProperties: Array<any> = [];

  const proto:any = Object.getPrototypeOf(document.createElement(name));
  const Polymer:any = (<any>window).Polymer;
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
      hostBindings[`(${Polymer.CaseMap.camelToDashCase(property)}-changed)`] = `${eventNameForProperty(property)}.emit($event.detail.value);`;
      return hostBindings;
    }, {})
  }).Class({
    constructor: function() {
      propertiesWithNotify
        .forEach(property => this[eventNameForProperty(property)] = new EventEmitter<any>(false));
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
      '(value-changed)': 'onValueChanged($event.detail.value)'
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
        // need a debounce here to prevent weird race conditions
        this._element.debounce('value-changed', () => {
          this.onChange(value);
        }, 1);
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
      var elm = (<any>this)._element;
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
        if (this[property] !== event.target[property]) {
          this[property] = event.target[property];
          (<any>this)._differs[property] = this._createDiffer(this[property]);
        }
    },

    _createDiffer(value: string) {
      var differ = Array.isArray(value) ? (<any>(<any>this)._iterableDiffers).find(value).create(null) : (<any>(<any>this)._keyValueDiffers).find(value || {}).create(null);

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

  const lightDomObserverDirective = Directive({
    selector: name
  }).Class({
    constructor: [ElementRef, NgZone, function(el: ElementRef, zone: NgZone) {
      this._element = el.nativeElement;
      this.zone = zone;

      if (!Polymer.Settings.useShadow) {
        el.nativeElement.async(this._observeMutations.bind(this));
      }
    }],

    _observeMutations: function() {
      const lightDom = Polymer.dom(this._element);
      const observerConfig = { childList: true, subtree: true };

      // Move all the misplaced nodes to light dom
      [].slice.call(this._element.childNodes, 0).forEach((child: Element) => {
        if (this._isLightDomChild(child)) {
          lightDom.appendChild(child);
        }
      });

      // TODO: split this into a separate directive
      // Reload Chart if needed.
      if (this._element.isInitialized && this._element.isInitialized()) {
        // Reload outside of Angular to prevent DataSeries.ngDoCheck being called on every mouse event.
        this.zone.runOutsideAngular(() => {
          this._element.reloadConfiguration();
        });
      }

      // Add a mutation observer for further additions / removals
      const observer = new MutationObserver((mutations) => {
        observer.disconnect();

        mutations.forEach((mutation) => {
          [].forEach.call(mutation.addedNodes, (added: Element) => {
            if (this._isLightDomChild(added) && added.parentElement === this._element) {
              lightDom.appendChild(added);
            }
          });

          [].forEach.call(mutation.removedNodes, (removed: Element) => {
            if (lightDom.children.indexOf(removed) > -1) {
              lightDom.removeChild(removed);
            }
          });
        });

        setTimeout(() => {
          observer.observe(this._element, observerConfig);
        }, 0);
      });

      observer.observe(this._element, observerConfig);
    },

    _isLightDomChild: function(node: Element) {
      return !node.tagName || !node.classList.contains(name);
    }
  });

  var directives = [changeEventsAdapterDirective, notifyForDiffersDirective, lightDomObserverDirective];

  if (isFormElement) {
    directives.push(formElementDirective);
    directives.push(validationDirective);
  }

  return directives;
}
