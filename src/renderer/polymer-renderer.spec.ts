import {async, TestBed, ComponentFixture} from '@angular/core/testing';
import {Component, Renderer, RootRenderer, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';

import {PolymerModule} from './../polymer-module';
import {PolymerRenderer} from './polymer-renderer';
import {PolymerRootRenderer} from './polymer-renderer';

const Polymer: any = (<any>window).Polymer;

@Component({
    template: `<test-element [(value)]="value" [(nestedObject)]="nestedObject" [(arrayObject)]="arrayObject"></test-element>`
})
class TestComponent {
    constructor(public renderer: Renderer) {
    }

    value = 'foo';
    nestedObject = {value: undefined};
    arrayObject = [];
    barVisible = false;
}

describe('PolymerRenderer', () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [PolymerModule],
            declarations: [TestComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        });
        TestBed.compileComponents();
    }));

    let testElement: Element;
    let testComponent: TestComponent;
    let fixture: ComponentFixture<any>;
    let renderer: PolymerRenderer;

    function createTestComponent(type: any) {
        fixture = TestBed.createComponent(type);
        testComponent = fixture.componentInstance;
        testElement = fixture.nativeElement.firstElementChild;
        renderer = <PolymerRenderer> testComponent.renderer;
    }

    beforeEach(() => {
        createTestComponent(TestComponent);
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
});

describe('PolymerRootRenderer', () => {
    it('is defined', () => {
        expect(PolymerRenderer).toBeDefined();
    });
});
