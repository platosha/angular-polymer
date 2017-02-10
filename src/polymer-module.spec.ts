import './renderer/polymer-renderer.spec';

import {RootRenderer} from '@angular/core';
import {NgModuleResolver} from '@angular/compiler';
import {PolymerRootRenderer} from './renderer/polymer-renderer';

import {POLYMER_RENDER_PROVIDERS, PolymerModule} from './polymer-module';

describe('POLYMER_RENDER_PROVIDERS', () => {
    it('contains PolymerRootRenderer', () => {
        expect(POLYMER_RENDER_PROVIDERS).toContain(PolymerRootRenderer);
    });

    it('provides RootRenderer with PolymerRootRenderer', () => {
        const item: any = POLYMER_RENDER_PROVIDERS.find((d: any) => d.provide === RootRenderer);
        expect(item.useExisting).toBe(PolymerRootRenderer);
    });
});

describe('PolymerModule', () => {
    let resolver: NgModuleResolver;

    beforeEach(() => {
        resolver = new NgModuleResolver();
    });

    it('is NgModule', () => {
        expect(resolver.isNgModule(PolymerModule)).toBe(true);
    });

    it('has POLYMER_RENDER_PROVIDERS', () => {
        const metadata = resolver.resolve(PolymerModule);
        expect(metadata.providers).toContain(POLYMER_RENDER_PROVIDERS);
    });
});
