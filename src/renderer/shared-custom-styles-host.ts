import {Inject, Injectable, OnDestroy} from '@angular/core';
import {DOCUMENT} from '@angular/platform-browser';

const Polymer: any = (<any>window).Polymer;

@Injectable()
export class SharedCustomStylesHost implements OnDestroy {
    private _stylesSet = new Set<string>();
    private _hostNodes = new Set<Node>();
    private _customStyleNodes = new Set<Node>();

    constructor(@Inject(DOCUMENT) private _doc: any) {
        this._hostNodes.add(_doc.head);
    }

    addStyles(styles: string[]): void {
        styles.forEach(style => {
            if (!this._stylesSet.has(style)) {
                this._stylesSet.add(style);
                this._hostNodes.forEach(hostNode => {
                    this._addStyleToHost(style, hostNode);
                });
            }
        });
    }

    private _addStyleToHost(style: string, host: Node): void {
        const customStyleEl = <Element>(<any>this._doc).createElement('style', 'custom-style');
        customStyleEl.textContent = style;
        Polymer.dom(host).appendChild(customStyleEl);
        Polymer.dom.flush();
        Polymer.updateStyles();
        this._customStyleNodes.add(customStyleEl);
    }

    addHost(hostNode: Node): void {
        this._stylesSet.forEach(style => this._addStyleToHost(style, hostNode));
        this._hostNodes.add(hostNode);
    }

    removeHost(hostNode: Node): void {
        this._hostNodes.delete(hostNode);
    }

    ngOnDestroy(): void {
        this._customStyleNodes.forEach(styleNode => Polymer.dom(Polymer.dom(styleNode).parentNode).removeChild(styleNode));
    }

    getAllStyles(): string[] {
        return Array.from(this._stylesSet);
    }
}
