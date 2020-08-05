import {Component, Input} from '@angular/core';
@Component({
  selector: 'hs-widgets-recursive-dd',
  template: require('./recursive-dd.html'),
})
export class HsMiscRecursiveDd {
  @Input() value: any;

  constructor() {}
  isIteratable(): boolean {
    return typeof this.value == 'object';
  }
}
