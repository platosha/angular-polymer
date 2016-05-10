import {
  Injector,
  Directive,
  ElementRef,
  EventEmitter,
  forwardRef,
  provide,
  Renderer,
  NgZone,
  KeyValueDiffers
} from '@angular/core';
import { NgControl, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/common';

export function PolymerElement(name) {
  const propertiesWithNotify = [];
  const arrayAndObjectProperties = [];

  const proto = Object.getPrototypeOf(document.createElement(name));
  const Polymer = (<any>window).Polymer;
  const isFormElement = Polymer && Polymer.IronFormElementBehavior && proto.behaviors.indexOf(Polymer.IronFormElementBehavior) > -1;
  proto.behaviors.forEach(behavior => configureProperties(behavior.properties));
  configureProperties(proto.properties);

  function configureProperties(properties) {
    if (properties) {
      Object.getOwnPropertyNames(properties)
        .filter(name => name.indexOf('_') !== 0)
        .forEach(name => configureProperty(name, properties))
    }
  }

  function configureProperty(name: string, properties) {
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

  const eventNameForProperty = property => `${property}Change`;

  const changeEventsAdapterDirective = Directive({
    selector: name,
    outputs: propertiesWithNotify.map(eventNameForProperty),
    host: propertiesWithNotify.reduce((hostBindings, property) => {
      hostBindings[`(${property}-changed)`] = `${eventNameForProperty(property) }.emit($event.detail.value);`;
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

  const formElementDirective = Directive({
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
    inputs: arrayAndObjectProperties
  }).Class({
    constructor: [ElementRef, KeyValueDiffers, function(el: ElementRef, differs: KeyValueDiffers) {
      this._element = el.nativeElement;
      this._keyValueDiffers = differs;

    }],

    ngOnInit() {
      this._differs = arrayAndObjectProperties
        .map(property => { return { name: property, differ: this._keyValueDiffers.find(this[property] || {}).create(null) }; });
    },

    ngDoCheck() {
      this._differs.map(d => {
          var diff = d.differ.diff(typeof this[d.name] === 'string' ? JSON.parse(this[d.name]) : this[d.name]);
          return { name: d.name, diff: diff };
      }).filter(changes => changes.diff)
        .forEach(changes => {
          this._element[changes.name] = Array.isArray(this[changes.name]) ? this[changes.name].slice(0) : Object.assign({}, this[changes.name]);
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
      [].slice.call(this._element.childNodes, 0).forEach((child) => {
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
          [].forEach.call(mutation.addedNodes, (added) => {
            if (this._isLightDomChild(added) && added.parentElement === this._element) {
              lightDom.appendChild(added);
            }
          });

          [].forEach.call(mutation.removedNodes, (removed) => {
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

    _isLightDomChild: function(node) {
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
