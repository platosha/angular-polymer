import {NgModule, Provider, RootRenderer} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {PolymerRootRenderer} from './renderer/polymer-renderer';

export const POLYMER_RENDER_PROVIDERS: Provider[] = [
    PolymerRootRenderer,
    {provide: RootRenderer, useExisting: PolymerRootRenderer}
];

@NgModule({
    exports: [BrowserModule],
    providers: [POLYMER_RENDER_PROVIDERS]
})
export class PolymerModule {
}
