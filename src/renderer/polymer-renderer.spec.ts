import {async, TestBed, ComponentFixture} from '@angular/core/testing';
import {Component, Renderer, RootRenderer, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';

import {PolymerModule} from '../polymer-module';
import {PolymerRenderer} from './polymer-renderer';
import {PolymerRootRenderer} from './polymer-renderer';

const Polymer: any = (<any>window).Polymer;

@Component({
    template: `<test-element [(value)]="value" [(nestedObject)]="nestedObject" [(arrayObject)]="arrayObject"></test-element>`
})
class RendererTestComponent {
    constructor(
        public renderer: Renderer,
        public rootRenderer: RootRenderer
    ) { }

    value = 'foo';
    nestedObject = {value: undefined};
    arrayObject = [];
    barVisible = false;
}

describe('PolymerRenderer', () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [PolymerModule],
            declarations: [RendererTestComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        });
        TestBed.compileComponents();
    }));

    let testElement: Element;
    let testDomApi: any;
    let renderer: PolymerRenderer;
    let rootRenderer: PolymerRootRenderer;

    beforeEach(() => {
        const fixture = TestBed.createComponent(RendererTestComponent);
        const testComponent = fixture.componentInstance;
        testElement = fixture.nativeElement.firstElementChild;
        renderer = <PolymerRenderer> testComponent.renderer;
        testDomApi = Polymer.dom(testElement);
        rootRenderer = <PolymerRootRenderer> testComponent.rootRenderer;
    });

    it('is in use', () => {
        expect(renderer instanceof PolymerRenderer).toBe(true);
    });

    describe('selectRootElement method', () => {
        let expectedRoot: Element;

        beforeEach(() => {
            expectedRoot = document.createElement('div');
            expectedRoot.classList.add('test-root'); // should be selected as root
            document.body.appendChild(expectedRoot);
        });

        afterEach(() => {
            document.body.removeChild(expectedRoot);
        });

        it('respects shadow DOM boundaries', () => {
            (<any> testElement).$.nested.classList.add('test-root'); // should not be selected as root

            const testRoot = renderer.selectRootElement('.test-root');

            expect(testRoot).toBe(expectedRoot);
        });

        it('clears previous content using Polymer.dom API', () => {
            const spy = jasmine.createSpy('textContentSetterSpy');
            const domApi: any = Polymer.dom(expectedRoot);
            Object.defineProperty(domApi, 'textContent', {set: spy});

            renderer.selectRootElement('.test-root');

            expect(spy).toHaveBeenCalledWith('');
        });
    });

    describe('tree manipulation', () => {
        beforeEach(() => {
            spyOn(testDomApi, 'appendChild').and.callThrough();
            spyOn(testDomApi, 'insertBefore').and.callThrough();
            spyOn(testDomApi, 'removeChild').and.callThrough();
        });

        it('implements createElement method', () => {
            const el = renderer.createElement(testElement, 'foo-element');

            expect(el instanceof Element).toBe(true);
            expect(el.localName).toBe('foo-element');
            expect(testDomApi.appendChild).toHaveBeenCalledWith(el);
        });

        it('implements createViewRoot method', () => {
            const viewRoot = renderer.createViewRoot(testElement);
            expect(viewRoot).toBe(testElement);
        });

        it('implements createTemplateAnchor method', () => {
            const anchor = renderer.createTemplateAnchor(testElement);

            expect(anchor instanceof Node).toBe(true);
            expect(testDomApi.appendChild).toHaveBeenCalledWith(anchor);
        });

        it('implements createText method', () => {
            const node = renderer.createText(testElement, 'foo');

            expect(node instanceof Node).toBe(true);
            expect(node.textContent).toBe('foo');
            expect(testDomApi.appendChild).toHaveBeenCalledWith(node);
        });

        it('implements projectNodes method', () => {
            const nodeFoo = document.createTextNode('foo');
            const nodeBar = document.createTextNode('bar');

            renderer.projectNodes(testElement, [nodeFoo, nodeBar]);

            expect(Polymer.dom(nodeFoo).parentNode).toBe(testElement);
            expect(Polymer.dom(nodeBar).parentNode).toBe(testElement);
            expect(testDomApi.appendChild).toHaveBeenCalledWith(nodeFoo);
            expect(testDomApi.appendChild).toHaveBeenCalledWith(nodeBar);
        });

        it('implements attachViewAfter method, target node is last child case', () => {
            const nodeFoo = document.createTextNode('foo');
            Polymer.dom(testElement).appendChild(nodeFoo);

            const viewRootBaz = document.createTextNode('baz');
            const viewRootQux = document.createTextNode('qux');

            renderer.attachViewAfter(nodeFoo, [viewRootBaz, viewRootQux]);

            expect(Polymer.dom(viewRootBaz).parentNode).toBe(testElement);
            expect(Polymer.dom(viewRootQux).parentNode).toBe(testElement);
            expect(testDomApi.appendChild).toHaveBeenCalledWith(viewRootBaz);
            expect(testDomApi.appendChild).toHaveBeenCalledWith(viewRootQux);
        });

        it('implements attachViewAfter method, target node is non-last child case', () => {
            const nodeFoo = document.createTextNode('foo');
            const nodeBar = document.createTextNode('bar');
            Polymer.dom(testElement).appendChild(nodeFoo);
            Polymer.dom(testElement).appendChild(nodeBar);

            const viewRootBaz = document.createTextNode('baz');
            const viewRootQux = document.createTextNode('qux');

            renderer.attachViewAfter(nodeFoo, [viewRootBaz, viewRootQux]);

            expect(Polymer.dom(viewRootBaz).parentNode).toBe(testElement);
            expect(Polymer.dom(viewRootQux).parentNode).toBe(testElement);
            expect(testDomApi.insertBefore).toHaveBeenCalledWith(viewRootBaz, nodeBar);
            expect(testDomApi.insertBefore).toHaveBeenCalledWith(viewRootQux, nodeBar);
        });

        it('implements detachView method', () => {
            const nodeFoo = document.createTextNode('foo');
            Polymer.dom(testElement).appendChild(nodeFoo);
            const viewRootBaz = document.createTextNode('baz');
            const viewRootQux = document.createTextNode('qux');
            renderer.attachViewAfter(nodeFoo, [viewRootBaz, viewRootQux]);

            renderer.detachView([viewRootBaz, viewRootQux]);

            expect(Polymer.dom(viewRootBaz).parentNode).toBe(null);
            expect(Polymer.dom(viewRootQux).parentNode).toBe(null);
            expect(testDomApi.removeChild).toHaveBeenCalledWith(viewRootBaz);
            expect(testDomApi.removeChild).toHaveBeenCalledWith(viewRootQux);
        });
    });

    describe('listen', () => {
        const callbacks = {
            returnTrue: () => true,
            returnFalse: () => false
        };

        let fakeClickEvent: CustomEvent;

        beforeEach(() => {
            spyOn(callbacks, 'returnTrue').and.callThrough();
            spyOn(callbacks, 'returnFalse').and.callThrough();

            fakeClickEvent = new CustomEvent('click', {
                bubbles: true,
                cancelable: true
            });
            spyOn(fakeClickEvent, 'preventDefault').and.callThrough();
        });

        it('implements listen method, with default action', () => {
            renderer.listen(testElement, 'click', callbacks.returnTrue);

            testElement.dispatchEvent(fakeClickEvent);
            expect(callbacks.returnTrue).toHaveBeenCalledWith(fakeClickEvent);
            expect(fakeClickEvent.returnValue).not.toBe(false);
            expect(fakeClickEvent.preventDefault).not.toHaveBeenCalled();
        });

        it('implements listen method, without default action', () => {
            renderer.listen(testElement, 'click', callbacks.returnFalse);

            testElement.dispatchEvent(fakeClickEvent);
            expect(callbacks.returnFalse).toHaveBeenCalledWith(fakeClickEvent);
            expect(fakeClickEvent.returnValue).toBe(false);
            expect(fakeClickEvent.preventDefault).toHaveBeenCalled();
        });

        it('implements listenGlobal method, with default action', () => {
            renderer.listenGlobal('window', 'click', callbacks.returnTrue);

            testElement.dispatchEvent(fakeClickEvent);
            expect(callbacks.returnTrue).toHaveBeenCalledWith(fakeClickEvent);
            expect(fakeClickEvent.returnValue).not.toBe(false);
            expect(fakeClickEvent.preventDefault).not.toHaveBeenCalled();
        });

        it('implements listenGlobal method, without default action', () => {
            renderer.listenGlobal('window', 'click', callbacks.returnFalse);

            testElement.dispatchEvent(fakeClickEvent);
            expect(callbacks.returnFalse).toHaveBeenCalledWith(fakeClickEvent);
            expect(fakeClickEvent.returnValue).toBe(false);
            expect(fakeClickEvent.preventDefault).toHaveBeenCalled();
        });
    });

    it('implements setElementProperty method', () => {
        renderer.setElementProperty(testElement, 'foo', 'bar');
        expect(testElement['foo']).toBe('bar');
    });

    it('implements setElementAttribute method', () => {
        spyOn(testDomApi, 'setAttribute');
        spyOn(testDomApi, 'removeAttribute');

        renderer.setElementAttribute(testElement, 'foo', 'bar');
        renderer.setElementAttribute(testElement, 'baz', '');
        renderer.setElementAttribute(testElement, 'qux', null);

        expect(testDomApi.setAttribute).toHaveBeenCalledWith('foo', 'bar');
        expect(testDomApi.removeAttribute).toHaveBeenCalledWith('baz');
        expect(testDomApi.removeAttribute).toHaveBeenCalledWith('qux');
    });

    it('implements setBindingDebugInfo method', () => {
        spyOn(testDomApi, 'setAttribute');
        spyOn(testDomApi, 'removeAttribute');

        renderer.setBindingDebugInfo(testElement, 'foo', 'bar');
        renderer.setBindingDebugInfo(testElement, 'baz', '');
        renderer.setBindingDebugInfo(testElement, 'qux', null);

        expect(testDomApi.setAttribute).toHaveBeenCalledWith('foo', 'bar');
        expect(testDomApi.removeAttribute).toHaveBeenCalledWith('baz');
        expect(testDomApi.removeAttribute).toHaveBeenCalledWith('qux');
    });

    it('implements setElementClass method', () => {
        spyOn(testDomApi.classList, 'add');
        spyOn(testDomApi.classList, 'remove');

        renderer.setElementClass(testElement, 'foo', true);
        renderer.setElementClass(testElement, 'bar', false);

        expect(testDomApi.classList.add).toHaveBeenCalledWith('foo');
        expect(testDomApi.classList.remove).toHaveBeenCalledWith('bar');
    });

    it('implements setElementStyle method', () => {
        const testHtmlElement = testElement as HTMLElement;
        spyOn(testHtmlElement.style, 'setProperty');
        spyOn(testHtmlElement.style, 'removeProperty');

        renderer.setElementStyle(testHtmlElement, '--foo', 'none');
        renderer.setElementStyle(testHtmlElement, '--bar', '');

        expect(testHtmlElement.style.setProperty).toHaveBeenCalledWith('--foo', 'none');
        expect(testHtmlElement.style.removeProperty).toHaveBeenCalledWith('--bar');
    });

    it('implements invokeElementMethod method', () => {
        spyOn(testElement, 'click');
        const callArgs = [];

        renderer.invokeElementMethod(testElement, 'click', callArgs);

        expect(testElement['click'].calls.all()).toEqual([{
            object: testElement,
            args: callArgs,
            returnValue: undefined
        }]);
    });

    it('implements setText method', () => {
        const textNode = renderer.createText(testElement, '');
        renderer.setText(textNode, 'foo');
        expect(textNode.nodeValue).toBe('foo');
    });

    it('implements animate method', () => {
        spyOn(rootRenderer.animationDriver, 'animate');

        const animateArgs = [
            testElement,
            {}, // startingStyles: any
            [], // keyframes: any[]
            0,  // duration: number
            0,  // delay: number
            '', // easing: string
            []  // previousPlayers: AnimationPlayer[]
        ];

        renderer.animate.apply(renderer, animateArgs);

        expect(
            (<any>rootRenderer.animationDriver.animate).calls.mostRecent().args
        ).toEqual(animateArgs);
    });

    describe('PolymerRootRenderer', () => {
        it('is injectable', () => {
            expect(rootRenderer instanceof PolymerRootRenderer).toBe(true);
        });
    });

    describe('setElementProperty', () => {
        it('updates the value of angular component and polymer component', () => {
            (<any> testElement).value = 'Should change';
            expect((<any> testElement).value).toBe('Should change');
        });
    });
});
