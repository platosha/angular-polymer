[![Version](https://img.shields.io/npm/v/@vaadin/angular2-polymer.svg)](https://www.npmjs.com/package/@vaadin/angular2-polymer)

# Angular-Polymer

`angular-polymer` is a directive factory that aims at bridging the gaps between using [Polymer](https://www.polymer-project.org) based Web Components in [Angular](https://angular.io/) applications.

```typescript
import { NgModule, CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { PolymerElement } from '@platosha/angular-polymer';

@NgModule({
  imports: [ BrowserModule ],
  declarations: [
    AppComponent,
    PolymerElement('paper-input'),
    PolymerElement('vaadin-combo-box')
  ],
  bootstrap: [ AppComponent ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class AppModule { }

@Component({
  selector: 'app-component',
  template: `
    <paper-input [(value)]="myValue"></paper-input>
    <vaadin-combo-box [(value)]="myValue" [items]="myItems"></vaadin-combo-box>
  `
})
class AppComponent {
  myValue = 'A';
  myItems = ['A', 'B', 'C'];
}
```

## Getting started

See the overview for a [quick start](https://vaadin.com/docs/-/part/elements/angular2-polymer/overview.html).

See the [tutorial](https://vaadin.com/docs/-/part/elements/angular2-polymer/tutorial-index.html) for complete instructions on how to use `angular-polymer` and how to build a working application with Angular data binding and routes.

If you are using [Angular CLI](https://github.com/angular/angular-cli) in your project, see the specific [document](https://vaadin.com/docs/-/part/elements/angular2-polymer/ng-cli-webpack.html) for projects created with the `ng` command line utility.

## Demo app

The Expense Manager demo is an example of a real world application built using Angular and Polymer web components.

- [Live demo](http://demo.vaadin.com/expense-manager-ng)
- [Source code](https://github.com/vaadin/expense-manager-ng2-demo)

## Where to get Polymer web components

For high quality Polymer web components, see the [Webcomponents Element Catalog](https://www.webcomponents.org/) and [Vaadin Elements](https://vaadin.com/elements).

## Development

Familiarize yourself with the code and try to follow the same syntax conventions to make it easier for us to accept your pull requests.

### Getting the Code

1. Clone the angular-polymer project:

  ```shell
  $ git clone https://github.com/platosha/angular-polymer.git
  $ cd angular-polymer
  ```

2. Install dependencies. We assume that you have already installed `npm` in your system.

  ```shell
  $ npm install
  ```

### Running Tests

For running the tests you need [Bower](http://bower.io) installed.

Then, you can download all bower dependencies needed by the Tests.

  ```shell
  $ bower install
  ```

Finally, you can run the tests by typing:

  ```shell
  $ npm test
  ```

## License

Apache License 2.0
