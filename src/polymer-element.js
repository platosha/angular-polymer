"use strict";
var core_1 = require('@angular/core');
var common_1 = require('@angular/common');
function PolymerElement(name) {
    var propertiesWithNotify = [];
    var arrayAndObjectProperties = [];
    var proto = Object.getPrototypeOf(document.createElement(name));
    var Polymer = window.Polymer;
    var isFormElement = Polymer && Polymer.IronFormElementBehavior && proto.behaviors.indexOf(Polymer.IronFormElementBehavior) > -1;
    proto.behaviors.forEach(function (behavior) { return configureProperties(behavior.properties); });
    configureProperties(proto.properties);
    function configureProperties(properties) {
        if (properties) {
            Object.getOwnPropertyNames(properties)
                .filter(function (name) { return name.indexOf('_') !== 0; })
                .forEach(function (name) { return configureProperty(name, properties); });
        }
    }
    function configureProperty(name, properties) {
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
    var eventNameForProperty = function (property) { return (property + "Change"); };
    var changeEventsAdapterDirective = core_1.Directive({
        selector: name,
        outputs: propertiesWithNotify.map(eventNameForProperty),
        host: propertiesWithNotify.reduce(function (hostBindings, property) {
            hostBindings[("(" + Polymer.CaseMap.camelToDashCase(property) + "-changed)")] = "_emitChangeEvent('" + property + "', $event);";
            return hostBindings;
        }, {})
    }).Class({
        constructor: function () {
            var _this = this;
            propertiesWithNotify
                .forEach(function (property) { return _this[eventNameForProperty(property)] = new core_1.EventEmitter(false); });
        },
        _emitChangeEvent: function (property, event) {
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
    var validationDirective = core_1.Directive({
        selector: name
    }).Class({
        constructor: [core_1.ElementRef, core_1.Injector, function (el, injector) {
                this._element = el.nativeElement;
                this._control = injector.get(common_1.NgControl, null);
            }],
        ngDoCheck: function () {
            if (this._control) {
                this._element.invalid = !this._control.pristine && !this._control.valid;
            }
        }
    });
    var formElementDirective = core_1.Directive({
        selector: name,
        providers: [core_1.provide(common_1.NG_VALUE_ACCESSOR, {
                useExisting: core_1.forwardRef(function () { return formElementDirective; }),
                multi: true
            })],
        host: {
            '(valueChange)': 'onValueChanged($event)'
        }
    }).Class({
        constructor: [core_1.Renderer, core_1.ElementRef, function (renderer, el) {
                var _this = this;
                this._renderer = renderer;
                this._element = el.nativeElement;
                this._element.addEventListener('blur', function () { return _this.onTouched(); }, true);
            }],
        onChange: function (_) { },
        onTouched: function () { },
        writeValue: function (value) {
            this._renderer.setElementProperty(this._element, 'value', value);
        },
        registerOnChange: function (fn) { this.onChange = fn; },
        registerOnTouched: function (fn) { this.onTouched = fn; },
        onValueChanged: function (value) {
            if (this._initialValueSet) {
                this.onChange(value);
            }
            else {
                this._initialValueSet = true;
            }
        }
    });
    var notifyForDiffersDirective = core_1.Directive({
        selector: name,
        inputs: arrayAndObjectProperties,
        host: arrayAndObjectProperties.reduce(function (hostBindings, property) {
            hostBindings[("(" + Polymer.CaseMap.camelToDashCase(property) + "-changed)")] = "_setValueFromElement('" + property + "', $event);";
            return hostBindings;
        }, {})
    }).Class({
        constructor: [core_1.ElementRef, core_1.IterableDiffers, core_1.KeyValueDiffers, function (el, iterableDiffers, keyValueDiffers) {
                this._element = el.nativeElement;
                this._iterableDiffers = iterableDiffers;
                this._keyValueDiffers = keyValueDiffers;
                this._differs = {};
                this._arrayDiffs = {};
            }],
        ngOnInit: function () {
            var _this = this;
            var elm = this._element;
            // In case the element has a default value and the directive doesn't have any value set for a property,
            // we need to make sure the element value is set to the directive.
            arrayAndObjectProperties.filter(function (property) { return elm[property] && !_this[property]; })
                .forEach(function (property) {
                _this[property] = elm[property];
            });
        },
        _setValueFromElement: function (property, event) {
            // Properties in this directive need to be kept synced manually with the element properties.
            // Don't use event.detail.value here because it might contain changes for a sub-property.
            var target = event.target;
            if (this[property] !== target[property]) {
                this[property] = target[property];
                this._differs[property] = this._createDiffer(this[property]);
            }
        },
        _createDiffer: function (value) {
            var differ = Array.isArray(value) ? this._iterableDiffers.find(value).create(null) : this._keyValueDiffers.find(value || {}).create(null);
            // initial diff with the current value to make sure the differ is synced
            // and doesn't report any outdated changes on the next ngDoCheck call.
            differ.diff(value);
            return differ;
        },
        _handleArrayDiffs: function (property, diff) {
            var _this = this;
            if (diff) {
                diff.forEachRemovedItem(function (item) { return _this._notifyArray(property, item.previousIndex); });
                diff.forEachAddedItem(function (item) { return _this._notifyArray(property, item.currentIndex); });
                diff.forEachMovedItem(function (item) { return _this._notifyArray(property, item.currentIndex); });
            }
        },
        _handleObjectDiffs: function (property, diff) {
            var _this = this;
            if (diff) {
                var notify = function (item) { return _this._notifyPath(property + '.' + item.key, item.currentValue); };
                diff.forEachRemovedItem(notify);
                diff.forEachAddedItem(notify);
                diff.forEachChangedItem(notify);
            }
        },
        _notifyArray: function (property, index) {
            this._notifyPath(property + '.' + index, this[property][index]);
        },
        _notifyPath: function (path, value) {
            this._element.notifyPath(path, value);
        },
        ngDoCheck: function () {
            var _this = this;
            arrayAndObjectProperties.forEach(function (property) {
                var elm = _this._element;
                var _differs = _this._differs;
                if (elm[property] !== _this[property]) {
                    elm[property] = _this[property];
                    _differs[property] = _this._createDiffer(_this[property]);
                }
                else if (_differs[property]) {
                    // TODO: these differs won't pickup any changes in need properties like items[0].foo
                    var diff = _differs[property].diff(_this[property]);
                    if (diff instanceof core_1.DefaultIterableDiffer) {
                        _this._handleArrayDiffs(property, diff);
                    }
                    else {
                        _this._handleObjectDiffs(property, diff);
                    }
                }
            });
        }
    });
    var lightDomObserverDirective = core_1.Directive({
        selector: name
    }).Class({
        constructor: [core_1.ElementRef, core_1.NgZone, function (el, zone) {
                this._element = el.nativeElement;
                this.zone = zone;
                if (!Polymer.Settings.useShadow) {
                    el.nativeElement.async(this._observeMutations.bind(this));
                }
            }],
        _observeMutations: function () {
            var _this = this;
            var lightDom = Polymer.dom(this._element);
            var observerConfig = { childList: true, subtree: true };
            // Move all the misplaced nodes to light dom
            [].slice.call(this._element.childNodes, 0).forEach(function (child) {
                if (_this._isLightDomChild(child)) {
                    lightDom.appendChild(child);
                }
            });
            // TODO: split this into a separate directive
            // Reload Chart if needed.
            if (this._element.isInitialized && this._element.isInitialized()) {
                // Reload outside of Angular to prevent DataSeries.ngDoCheck being called on every mouse event.
                this.zone.runOutsideAngular(function () {
                    _this._element.reloadConfiguration();
                });
            }
            // Add a mutation observer for further additions / removals
            var observer = new MutationObserver(function (mutations) {
                observer.disconnect();
                mutations.forEach(function (mutation) {
                    [].forEach.call(mutation.addedNodes, function (added) {
                        if (_this._isLightDomChild(added) && added.parentElement === _this._element) {
                            lightDom.appendChild(added);
                        }
                    });
                    [].forEach.call(mutation.removedNodes, function (removed) {
                        if (lightDom.children.indexOf(removed) > -1) {
                            lightDom.removeChild(removed);
                        }
                    });
                });
                setTimeout(function () {
                    observer.observe(_this._element, observerConfig);
                }, 0);
            });
            observer.observe(this._element, observerConfig);
        },
        _isLightDomChild: function (node) {
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
exports.PolymerElement = PolymerElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9seW1lci1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicG9seW1lci1lbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQkFZTyxlQUFlLENBQUMsQ0FBQTtBQUN2Qix1QkFBbUUsaUJBQWlCLENBQUMsQ0FBQTtBQUVyRix3QkFBK0IsSUFBWTtJQUN6QyxJQUFNLG9CQUFvQixHQUFlLEVBQUUsQ0FBQztJQUM1QyxJQUFNLHdCQUF3QixHQUFlLEVBQUUsQ0FBQztJQUVoRCxJQUFNLEtBQUssR0FBTyxNQUFNLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN0RSxJQUFNLE9BQU8sR0FBYSxNQUFPLENBQUMsT0FBTyxDQUFDO0lBQzFDLElBQU0sYUFBYSxHQUFXLE9BQU8sSUFBSSxPQUFPLENBQUMsdUJBQXVCLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDMUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBQyxRQUFZLElBQUssT0FBQSxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQXhDLENBQXdDLENBQUMsQ0FBQztJQUNwRixtQkFBbUIsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFdEMsNkJBQTZCLFVBQWU7UUFDMUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNmLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLENBQUM7aUJBQ25DLE1BQU0sQ0FBQyxVQUFBLElBQUksSUFBSSxPQUFBLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUF2QixDQUF1QixDQUFDO2lCQUN2QyxPQUFPLENBQUMsVUFBQSxJQUFJLElBQUksT0FBQSxpQkFBaUIsQ0FBQyxJQUFJLEVB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