System.register(['@angular/core', '@angular/common'], function(exports_1) {
    var core_1, common_1;
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
                hostBindings[("(" + Polymer.CaseMap.camelToDashCase(property) + "-changed)")] = eventNameForProperty(property) + ".emit($event.detail.value);";
                return hostBindings;
            }, {})
        }).Class({
            constructor: function () {
                var _this = this;
                propertiesWithNotify
                    .forEach(function (property) { return _this[eventNameForProperty(property)] = new core_1.EventEmitter(false); });
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
                '(value-changed)': 'onValueChanged($event.detail.value)'
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
                var _this = this;
                if (this._initialValueSet) {
                    // need a debounce here to prevent weird race conditions
                    this._element.debounce('value-changed', function () {
                        _this.onChange(value);
                    }, 1);
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
    exports_1("PolymerElement", PolymerElement);
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (common_1_1) {
                common_1 = common_1_1;
            }],
        execute: function() {
        }
    }
});
//# sourceMappingURL=polymer-element.js.map