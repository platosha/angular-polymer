import {Injectable, Inject, Renderer, RootRenderer, RenderComponentType, AnimationPlayer} from '@angular/core';
import {EventManager, AnimationDriver, DOCUMENT} from '@angular/platform-browser';

const Polymer: any = (<any>window).Polymer;

export class PolymerRenderer implements Renderer {
  constructor(
    private _rootRenderer: PolymerRootRenderer,
    private componentType: RenderComponentType,
    private _animationDriver: AnimationDriver
  ) {}

  selectRootElement(selectorOrElement: string|Element): Element {
    let el: Element;
    if (typeof selectorOrElement === 'string') {
      el = Polymer.dom(this._rootRenderer.document).querySelector(selectorOrElement);
      if (!el) {
        throw new Error(`Root element for selector "${selectorOrElement}" was not found`);
      }
    } else {
      el = selectorOrElement;
    }
    Polymer.dom(el).textContent = '';
    return el;
  }

  createElement(parent: Element|DocumentFragment, name: string) {
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

  createText(parent: Element|DocumentFragment, value: string): Node {
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
    return this._rootRenderer.eventManager.addEventListener(
        renderElement,
        name,
        decoratePreventDefault(callback)
    );
  }

  listenGlobal(target: string, name: string, callback: Function): Function {
    return this._rootRenderer.eventManager.addGlobalEventListener(
        target,
        name,
        decoratePreventDefault(callback)
    );
  }

  setElementProperty(renderElement: Element|DocumentFragment, propertyName: string, propertyValue: any): void {
    (renderElement as any)[propertyName] = propertyValue;
  }

  setElementAttribute(renderElement: Element|DocumentFragment, attributeName: string, attributeValue: string): void {
    if (attributeValue) {
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
      (renderElement.style as any).setProperty(styleName, styleValue);
    } else {
      (renderElement.style as any).removeProperty(styleName);
    }
  }

  invokeElementMethod(renderElement: Element, methodName: string, args: any[]) {
    (renderElement as any)[methodName].apply(renderElement, args);
  }

  setText(renderNode: Text, text: string): void {
    renderNode.nodeValue = text;
  }

  animate(
      element: any,
      startingStyles: any,
      keyframes: any[],
      duration: number,
      delay: number,
      easing: string,
      previousPlayers: AnimationPlayer[] = []
  ): AnimationPlayer {
    if (!element.domHost && this._rootRenderer.document.body.contains(element)) {
      return this._animationDriver.animate(element, startingStyles, keyframes, duration, delay, easing, previousPlayers);
    }
  }
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

@Injectable()
export class PolymerRootRenderer implements RootRenderer {
  protected registeredComponents: Map<string, PolymerRenderer> = new Map<string, PolymerRenderer>();

  constructor(
    @Inject(DOCUMENT) public document: any,
    public eventManager: EventManager,
    public animationDriver: AnimationDriver
  ) {}

  renderComponent(componentType: RenderComponentType): Renderer {
    let renderer = this.registeredComponents.get(componentType.id);
    if (!renderer) {
      renderer = new PolymerRenderer(
          this,
          componentType,
          this.animationDriver
      );
      this.registeredComponents.set(componentType.id, renderer);
    }
    return renderer;
  }
}
