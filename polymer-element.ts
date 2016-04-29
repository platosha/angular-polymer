// import {Directive, Class, EventEmitter} from 'angular2/core';
import {
Injector,
OnInit,
Directive,
ElementRef,
Output,
HostListener,
EventEmitter,
Provider,
forwardRef,
provide,
Renderer,
NgZone
} from 'angular2/core';
import { NgControl, NG_VALUE_ACCESSOR, DefaultValueAccessor } from 'angular2/common';
import { CONST_EXPR } from 'angular2/src/facade/lang';

export function PolymerElement(name) {
  const propertiesWithNotify = [];

  const proto = Object.getPrototypeOf(document.createElement(name));
  const isFormElement = window.Polymer && Polymer.IronFormElementBehavior && proto.behaviors.indexOf(Polymer.IronFormElementBehavior) > -1;
  proto.behaviors.forEach(behavior => configureProperties(behavior.properties));
  configureProperties(proto.properties);

  function configureProperties(properties) {
    if (properties) {
      Object.getOwnPropertyNames(properties)
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

    if (info && info.notify) {
      propertiesWithNotify.push(name);
    }
  }

  const eventNameForProperty = property => `${property}Change`;

  var directive = Directive({
    selector: name,
    providers: [provide(
      NG_VALUE_ACCESSOR, {
        useExisting: forwardRef(() => directive),
        multi: true
      })],
    outputs: propertiesWithNotify.map(eventNameForProperty),
    host: propertiesWithNotify.reduce((hostBindings, property) => {
      const binding = `(${property}-changed)`;
      if (!hostBindings[binding]) {
        hostBindings[binding] = `${eventNameForProperty(property) }.emit($event.detail.value);`;
        if (property === 'value' && isFormElement) {
          hostBindings[binding] += 'onValueChanged($event.detail.value)';
        }
      }
      return hostBindings;
    }, {})
  }).Class({
    extends: isFormElement ? DefaultValueAccessor : function() { },
    constructor: [Renderer, ElementRef, NgZone, function(renderer: Renderer, el: ElementRef, zone: NgZone) {
      this._element = el.nativeElement;
      this.zone = zone;

      if (isFormElement) {
        DefaultValueAccessor.call(this, renderer, el);
        this._element.addEventListener('blur', () => this.onTouched(), true);
      }

      propertiesWithNotify
        .forEach(property => this[eventNameForProperty(property)] = new EventEmitter<any>(false));


      if (!Polymer.Settings.useShadow) {
        el.nativeElement.async(this._observeMutations.bind(this));
      }
    }],

    onValueChanged: function(value: String) {
      if (this._initialValueSet) {
        this.onChange(value);

        setTimeout(() => {
          this._element.invalid = !this._element.classList.contains('ng-pristine') && !this._element.classList.contains('ng-valid');
        }, 0);

      } else {
        this._initialValueSet = true;
      }
    },

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

  return directive;
}
