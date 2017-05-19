import {APP_ID, Injectable, Inject, Renderer, RootRenderer, RenderComponentType, AnimationPlayer, ViewEncapsulation} from '@angular/core';
import {EventManager, AnimationDriver, DOCUMENT} from '@angular/platform-browser';
import {SharedCustomStylesHost} from './shared-custom-styles-host';

const Polymer: any = (<any>window).Polymer;

const COMPONENT_REGEX = /%COMP%/g;
const COMPONENT_VARIABLE = '%COMP%';
const HOST_ATTR = `_nghost-${COMPONENT_VARIABLE}`;
const CONTENT_ATTR = `_ngcontent-${COMPONENT_VARIABLE}`;

function flattenStyles(
        styleShimId: string,
        styles: Array<any|any[]>,
        target: string[]): string[] {
    for (let i = 0; i < styles.length; i++) {
        let style = styles[i];
        if (Array.isArray(style)) {
            flattenStyles(styleShimId, style, target);
        } else {
            style = style.replace(COMPONENT_REGEX, styleShimId);
            target.push(style);
        }
    }
    return target;
}

function decoratePreventDefault(handler: Function) {
    return (event: any) => {
        const allowDefault = handler(event);
        if (allowDefault === false) {
            event.preventDefault();
            event.returnValue = false;
        }
    };
}

/**
 * The polymer renderer takes care of supporting angular > 2.2 shady DOM
 *
 * The problem:
 * Starting from v2.2, Angular uses direct DOM rendering in browser. BrowserDomAdapter is not invoked by Renderer.
 * Therefore, changing the default BrowserDomAdapter to PolymerDomAdapter trick is not helpful anymore.
 * The issue breaks setting Light DOM for Polymer elements in Shady DOM mode of Polymer v1.0.
 *
 * The solution:
 * Instead of PolymerDomAdapter, we created the PolymerRenderer by implementing the Renderer interface.
 * The PolymerRenderer calls Polymer.dom APIs instead of DOM methods. In order to make Angular use the PolymerRenderer,
 * we need to define and export custom platforms, i.e., platformPolymer and platformPolymerDynamic.
 * In practice, developers will have to switch the imports in their main.ts files to use our custom Polymer platforms
 * instead of the default platformBrowser and platformBrowserDynamic.
 *
 * DefaultPolymerRenderer used for ViewEncapsulation.None, other style incapsulation modes are implemented in subclasses.
 */
export class DefaultPolymerRenderer implements Renderer {
    constructor(
            private _eventManager: EventManager,
            private _animationDriver: AnimationDriver
    ) { }

    selectRootElement(selectorOrElement: string|Element): Element {
        let el: Element;
        if (typeof selectorOrElement === 'string') {
            el = Polymer.dom(document).querySelector(selectorOrElement);
            if (!el) {
                throw new Error(`Root element for selector "${selectorOrElement}" was not found`);
            }
        } else {
            el = selectorOrElement;
        }
        Polymer.dom(el).textContent = '';
        return el;
    }

    createElement(parent: Element|DocumentFragment, name: string): Element {
        const el: Element = document.createElement(name);
        if (parent) {
            Polymer.dom(parent).appendChild(el);
        }
        return el;
    }

    createViewRoot(hostElement: Element): Element|DocumentFragment {
        return hostElement;
    }

    createTemplateAnchor(parent: Element|DocumentFragment): Element {
        const anchor = document.createElement('template-anchor');
        anchor.setAttribute('hidden', 'hidden');
        if (parent) {
            Polymer.dom(parent).appendChild(anchor);
        }
        return anchor;
    }

    createText(parent: Element|DocumentFragment, value: string): Text {
        const node = document.createTextNode(value);
        if (parent) {
            Polymer.dom(parent).appendChild(node);
        }
        return node;
    }

    projectNodes(parent: Element|DocumentFragment, nodes: Node[]) {
        if (!parent) return;
        const parentDomApi: any = Polymer.dom(parent);
        for (let i = 0; i < nodes.length; i++) {
            parentDomApi.appendChild(nodes[i]);
        }
    }

    attachViewAfter(node: Node, viewRootNodes: Node[]) {
        const parent: Element = Polymer.dom(node).parentNode;
        if (!parent || viewRootNodes.length === 0) return;
        const parentDomApi = Polymer.dom(parent);
        const nextSibling: Node = Polymer.dom(node).nextSibling;
        if (nextSibling) {
            for (let i = 0; i < viewRootNodes.length; i++) {
                parentDomApi.insertBefore(viewRootNodes[i], nextSibling);
            }
        } else {
            for (let i = 0; i < viewRootNodes.length; i++) {
                parentDomApi.appendChild(viewRootNodes[i]);
            }
        }
    }

    detachView(viewRootNodes: Node[]) {
        for (let i = 0; i < viewRootNodes.length; i++) {
            const node: Node = viewRootNodes[i];
            const parent: Element = Polymer.dom(node).parentNode;
            if (parent) {
                Polymer.dom(parent).removeChild(node);
            }
        }
    }

    destroyView(hostElement: Element|DocumentFragment, viewAllNodes: Node[]) {
    }

    listen(renderElement: any, name: string, callback: Function): Function {
        return this._eventManager.addEventListener(
            renderElement,
            name,
            decoratePreventDefault(callback)
        );
    }

    listenGlobal(target: string, name: string, callback: Function): Function {
        return this._eventManager.addGlobalEventListener(
            target,
            name,
            decoratePreventDefault(callback)
        );
    }

    setElementProperty(renderElement: Element|DocumentFragment, propertyName: string, propertyValue: any): void {
        (renderElement as any)[propertyName] = propertyValue;
    }

    setElementAttribute(renderElement: Element|DocumentFragment, attributeName: string, attributeValue: string): void {
        if (attributeValue != null) {
            Polymer.dom(renderElement).setAttribute(attributeName, attributeValue);
        } else {
            Polymer.dom(renderElement).removeAttribute(attributeName);
        }
    }

    setBindingDebugInfo(renderElement: Element, propertyName: string, propertyValue: string): void {
        this.setElementAttribute(renderElement, propertyName, propertyValue);
    }

    setElementClass(renderElement: Element, className: string, isAdd: boolean) {
        if (isAdd) {
            Polymer.dom(renderElement).classList.add(className);
        } else {
            Polymer.dom(renderElement).classList.remove(className);
        }
    }

    setElementStyle(renderElement: HTMLElement, styleName: string, styleValue: string): void {
        if (styleValue) {
            renderElement.style.setProperty(styleName, styleValue);
        } else {
            renderElement.style.removeProperty(styleName);
        }
    }

    invokeElementMethod(renderElement: Element, methodName: string, args: any[]) {
        (renderElement as any)[methodName].apply(renderElement, args);
    }

    setText(renderNode: Text, text: string): void {
        renderNode.nodeValue = text;
    }

    animate(element: any,
            startingStyles: any,
            keyframes: any[],
            duration: number,
            delay: number,
            easing: string,
            previousPlayers: AnimationPlayer[] = []): AnimationPlayer {
        if (!element.domHost && document.body.contains(element)) {
            return this._animationDriver.animate(element, startingStyles, keyframes, duration, delay, easing, previousPlayers);
        }
    }
}

/**
 * Polymer renderer for ViewEncapsulation.Emulated styles encapsulation mode (defaultmode)
 */
export class EmulatedEncapsulationPolymerRenderer extends DefaultPolymerRenderer {
    private _contentAttr: string;
    private _hostAttr: string;

    constructor(
            eventManager: EventManager,
            animationDriver: AnimationDriver,
            sharedCustomStylesHost: SharedCustomStylesHost,
            componentType: RenderComponentType,
            styleShimId: string
    ) {
        super(eventManager, animationDriver);
        const styles = flattenStyles(styleShimId, componentType.styles, []);
        sharedCustomStylesHost.addStyles(styles);
        this._contentAttr = CONTENT_ATTR.replace(COMPONENT_REGEX, styleShimId);
        this._hostAttr  = HOST_ATTR.replace(COMPONENT_REGEX, styleShimId);
    }

    createViewRoot(hostElement: Element): Element|DocumentFragment {
        super.setElementAttribute(hostElement, this._hostAttr, '');
        return hostElement;
    }

    createElement(parent: Element|DocumentFragment, name: string): Element {
        const el: Element = super.createElement(parent, name);
        super.setElementAttribute(el, this._contentAttr, '');
        return el;
    }
}

/**
 * Polymer renderer for ViewEncapsulation.Native styles encapsulation mode
 */
export class ShadowDomPolymerRenderer extends DefaultPolymerRenderer {
    private _shadowRoot: DocumentFragment;
    private _styles: string[];

    constructor(
            eventManager: EventManager,
            animationDriver: AnimationDriver,
            private sharedCustomStylesHost: SharedCustomStylesHost,
            componentType: RenderComponentType,
            styleShimId: string
    ) {
        super(eventManager, animationDriver);
        this._styles = flattenStyles(styleShimId, componentType.styles, []);
    }

    createViewRoot(hostElement: Element): Element|DocumentFragment {
        super.createViewRoot(hostElement);
        this._shadowRoot = <DocumentFragment> (hostElement as any).createShadowRoot();
        this.sharedCustomStylesHost.addHost(this._shadowRoot);
        this._styles.forEach(style => {
            const styleEl: Element = document.createElement('style');
            styleEl.textContent = style;
            this._shadowRoot.appendChild(styleEl);
        });
        return this._shadowRoot;
    }

    destroyView(hostElement: Element|DocumentFragment, viewAllNodes: Node[]) {
        this.sharedCustomStylesHost.removeHost(this._shadowRoot);
    }
}

@Injectable()
export class PolymerRootRenderer implements RootRenderer {
    protected registeredComponents: Map<string, Renderer> = new Map<string, Renderer>();
    private defaultRenderer: Renderer;

    constructor(
            @Inject(DOCUMENT) public document: any,
            public eventManager: EventManager,
            public sharedCustomStylesHost: SharedCustomStylesHost,
            public animationDriver: AnimationDriver,
            @Inject(APP_ID) public appId: string
    ) {
        this.defaultRenderer = new DefaultPolymerRenderer(eventManager, animationDriver);
    }

    renderComponent(componentType: RenderComponentType): Renderer {
        const styleShimId = `${this.appId}-${componentType.id}`;
        switch (componentType.encapsulation) {
            case ViewEncapsulation.Emulated: {
                let renderer = this.registeredComponents.get(componentType.id);
                if (!renderer) {
                    renderer = new EmulatedEncapsulationPolymerRenderer(
                            this.eventManager,
                            this.animationDriver,
                            this.sharedCustomStylesHost,
                            componentType,
                            styleShimId
                    );
                    this.registeredComponents.set(componentType.id, renderer);
                }
                return renderer;
            }
            case ViewEncapsulation.Native: {
                return new ShadowDomPolymerRenderer(
                        this.eventManager,
                        this.animationDriver,
                        this.sharedCustomStylesHost,
                        componentType,
                        styleShimId
                );
            }
            default: {
                if (!this.registeredComponents.has(componentType.id)) {
                    const styles = flattenStyles(styleShimId, componentType.styles, []);
                    this.sharedCustomStylesHost.addStyles(styles);
                    this.registeredComponents.set(componentType.id, this.defaultRenderer);
                }
                return this.defaultRenderer;
            }
        }
    }
}
