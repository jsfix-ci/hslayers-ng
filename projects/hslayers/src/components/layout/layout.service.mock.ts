export class HsLayoutServiceMock {
  contentWrapper = document.createElement('div');
  constructor() {}

  panelVisible() {
    return true
  }
}
