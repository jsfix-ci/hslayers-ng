import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[layout]',
})
export class HsMapHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
