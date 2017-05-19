import {NgModule, Provider, RootRenderer} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {SharedCustomStylesHost} from './renderer/shared-custom-styles-host';
import {PolymerRootRenderer} from './renderer/polymer-renderer';

export const POLYMER_RENDER_PROVIDERS: Provider[] = [
    SharedCustomStylesHost,
    PolymerRootRenderer,
    {provide: RootRenderer, useExisting: PolymerRootRenderer}
];

@NgModule({
    exports: [BrowserModule],
    providers: [POLYMER_RENDER_PROVIDERS]
})
export class PolymerModule {
}
