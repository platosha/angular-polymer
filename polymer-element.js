System.register(['angular2/core', 'angular2/common'], function(exports_1) {
    var core_1, common_1;
    function PolymerElement(name) {
        var propertiesWithNotify = [];
        var proto = Object.getPrototypeOf(document.createElement(name));
        var isFormElement = window.Polymer && Polymer.IronFormElementBehavior && proto.behaviors.indexOf(Polymer.IronFormElementBehavior) > -1;
        proto.behaviors.forEach(function (behavior) { return configureProperties(behavior.properties); });
        configureProperties(proto.properties);
        function configureProperties(properties) {
            if (properties) {
                Object.getOwnPropertyNames(properties)
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
            if (info && info.notify) {
                propertiesWithNotify.push(name);
            }
        }
        var eventNameForProperty = function (property) { return (property + "Change"); };
        var directive = core_1.Directive({
            selector: name,
            providers: [core_1.provide(common_1.NG_VALUE_ACCESSOR, {
                    useExisting: core_1.forwardRef(function () { return directive; }),
                    multi: true
                })],
            outputs: propertiesWithNotify.map(eventNameForProperty),
            host: propertiesWithNotify.reduce(function (hostBindings, property) {
                var binding = "(" + property + "-changed)";
                if (!hostBindings[binding]) {
                    hostBindings[binding] = eventNameForProperty(property) + ".emit($event.detail.value);";
                    if (property === 'value' && isFormElement) {
                        hostBindings[binding] += 'onValueChanged($event.detail.value)';
                    }
                }
                return hostBindings;
            }, {})
        }).Class({
            extends: isFormElement ? common_1.DefaultValueAccessor : function () { },
            constructor: [core_1.Renderer, core_1.ElementRef, core_1.NgZone, function (renderer, el, zone) {
                    var _this = this;
                    this._element = el.nativeElement;
                    this.zone = zone;
                    if (isFormElement) {
                        common_1.DefaultValueAccessor.call(this, renderer, el);
                        this._element.addEventListener('blur', function () { return _this.onTouched(); }, true);
                    }
                    propertiesWithNotify
                        .forEach(function (property) { return _this[eventNameForProperty(property)] = new core_1.EventEmitter(false); });
                    if (!Polymer.Settings.useShadow) {
                        el.nativeElement.async(this._observeMutations.bind(this));
                    }
                }],
            onValueChanged: function (value) {
                var _this = this;
                if (this._initialValueSet) {
                    this.onChange(value);
                    setTimeout(function () {
                        _this._element.invalid = !_this._element.classList.contains('ng-pristine') && !_this._element.classList.contains('ng-valid');
                    }, 0);
                }
                else {
                    this._initialValueSet = true;
                }
            },
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
        return directive;
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