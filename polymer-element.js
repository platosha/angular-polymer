System.register(['angular2/core', 'angular2/common'], function(exports_1) {
    var core_1, common_1;
    function PolymerElement(name) {
        var propertiesWithNotify = [];
        var arrayAndObjectProperties = [];
        var proto = Object.getPrototypeOf(document.createElement(name));
        var isFormElement = window.Polymer && Polymer.IronFormElementBehavior
            && proto.behaviors.indexOf(Polymer.IronFormElementBehavior) > -1;
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
            if (info.type && info.type === Object || info.type === Array) {
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
                hostBindings[("(" + property + "-changed)")] = eventNameForProperty(property) + ".emit($event.detail.value);";
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
            extends: common_1.DefaultValueAccessor,
            constructor: [core_1.Renderer, core_1.ElementRef, function (renderer, el) {
                    var _this = this;
                    common_1.DefaultValueAccessor.call(this, renderer, el);
                    this._element = el.nativeElement;
                    this._element.addEventListener('blur', function () { return _this.onTouched(); }, true);
                }],
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
            inputs: arrayAndObjectProperties
        }).Class({
            constructor: [core_1.ElementRef, core_1.KeyValueDiffers, function (el, differs) {
                    this._element = el.nativeElement;
                    this._keyValueDiffers = differs;
                }],
            ngOnInit: function () {
                var _this = this;
                this._differs = arrayAndObjectProperties
                    .map(function (property) {
                    return { name: property, differ: _this._keyValueDiffers.find(_this[property] || {}).create(null) };
                });
            },
            ngDoCheck: function () {
                var _this = this;
                this._differs.map(function (d) {
                    var diff = typeof _this[d.name] === 'function' ? true :
                        d.differ.diff(typeof _this[d.name] === 'string' ? JSON.parse(_this[d.name]) : _this[d.name]);
                    return { name: d.name, diff: diff };
                }).filter(function (changes) { return changes.diff; })
                    .forEach(function (changes) { return _this._element.notifyPath(changes.name, _this[changes.name]); });
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