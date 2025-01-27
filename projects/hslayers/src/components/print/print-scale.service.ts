import {Injectable} from '@angular/core';

import {Control, ScaleLine} from 'ol/control';

import {HsMapService} from '../map/map.service';
import {HsPrintLegendService} from './print-legend.service';
import {
  SCALE_BAR_CLASSES,
  SCALE_LINE_CLASSES,
} from './constants/scale-svg-classes';
import {ScaleObj} from './types/scale-object.type';

@Injectable({
  providedIn: 'root',
})
export class HsPrintScaleService {
  apps: {
    [id: string]: {
      defaultScaleLine: Control;
    };
  } = {default: {defaultScaleLine: null}};
  scaleBarCSS = SCALE_BAR_CLASSES;
  scaleLineCSS = SCALE_LINE_CLASSES;
  constructor(
    private hsMapService: HsMapService,
    private hsPrintLegendService: HsPrintLegendService
  ) {}

  /**
   * Initialize the print scale service data and subscribers
   * @param app - App identifier
   */
  init(app: string): void {
    this.hsMapService.loaded(app).then((_) => {
      this.get(app).defaultScaleLine = this.getMapScale(app);
    });
  }

  /**
   * Get the params saved by the print scale service for the current app
   * @param app - App identifier
   */
  get(app: string): {defaultScaleLine: Control} {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = {defaultScaleLine: null};
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * Set original map scale if it exists
   * @param app - App identifier
   */
  setToDefaultScale(app: string): void {
    const appRef = this.get(app);
    if (appRef.defaultScaleLine && this.hsMapService.getMap(app)) {
      this.setMapScale(appRef.defaultScaleLine, app);
    }
  }

  /**
   * Triggered when the scale type or its values have been changed by the user
   * @param scaleObj - Scale object
   * @param app - App identifier
   */
  scaleChanged(scaleObj: ScaleObj, app: string): void {
    this.setMapScale(this.createNewScaleControl(scaleObj), app);
  }

  /**
   * Draw canvas with scale DOM element
   * @param scaleObj - Scale object
   * @param app - App identifier
   */
  async drawScaleCanvas(
    scaleObj: ScaleObj,
    app: string
  ): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');

    let cssClasses: string;
    const type = scaleObj?.scaleType;
    const scaleElem = this.hsMapService.getScaleLineElement(type, app);
    if (!scaleElem) {
      return;
    }
    switch (type) {
      case 'scalebar':
        cssClasses = this.scaleBarCSS;
        canvas.height = scaleElem.clientHeight + 35; //Need to add some px because scale used absolute items outside the parent div
        break;
      case 'scaleline':
      default:
        cssClasses = this.scaleLineCSS;
        canvas.height = scaleElem.clientHeight + 5;
    }
    const svgSource = this.createScaleSvgSource(type, scaleElem, cssClasses);
    await this.drawScaleImage(canvas, svgSource, app);
    return canvas;
  }

  /**
   * Create svg source from scale DOM element
   * @param type - Scale type
   * @param scaleElem - Scale element from Openlayers map DOM
   * @param cssClasses - CSS classes taken from openlayers css
   */
  private createScaleSvgSource(
    type: 'scaleline' | 'scalebar',
    scaleElem: Element,
    cssClasses: string
  ): string {
    let width: number;
    let height: number;
    switch (type) {
      case 'scalebar':
        width = scaleElem.clientWidth + 35; //Need to add some px because scale used absolute items outside the parent div
        height = scaleElem.clientHeight + 35;
        break;
      case 'scaleline':
      default:
        width = scaleElem.clientWidth + 2;
        height = scaleElem.clientHeight;
    }
    const svgSource = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}px' height='${height}px'>
            ${cssClasses}
            <foreignObject width='100%' height='100%'>
                <div style="color: #eee" xmlns='http://www.w3.org/1999/xhtml'>
                  ${scaleElem.outerHTML.replace(/&nbsp;/g, '.')}
                </div>
            </foreignObject>
        </svg>`;
    const svg = 'data:image/svg+xml,' + encodeURIComponent(svgSource);
    return svg;
  }

  /**
   * Draw scale image from svg source into a canvas
   * @param canvas - HTMLCanvasElement
   * @param svgSource - Svg source string
   * @param app - App identifier
   */
  private drawScaleImage(
    canvas: HTMLCanvasElement,
    svgSource: string,
    app: string
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const ctx = canvas.getContext('2d');
      const img = await this.hsPrintLegendService.svgToImage(svgSource, app);
      if (img) {
        ctx.drawImage(img, 0, 0);
      }
      resolve();
    });
  }

  /**
   * Get current map scale Control
   * @param app - App identifier
   */
  private getMapScale(app: string): Control {
    for (const control of this.hsMapService
      .getMap(app)
      .getControls()
      .getArray()) {
      if (control instanceof ScaleLine) {
        return control;
      }
    }
  }
  /**
   * Create new scale control for the map
   * @param scaleObj - Scale object
   */
  private createNewScaleControl(scaleObj: ScaleObj): Control {
    let newScaleCtrl: Control;
    if (scaleObj?.scaleType === 'scalebar') {
      newScaleCtrl = new ScaleLine({
        units: scaleObj?.scaleUnits,
        bar: true,
        steps: scaleObj?.scaleBarSteps,
        text: scaleObj?.scaleBarText,
        minWidth: 140,
      });
    } else {
      newScaleCtrl = new ScaleLine({
        units: scaleObj?.scaleUnits,
      });
    }
    return newScaleCtrl;
  }

  /**
   * Set map scale to a new scale object
   * @param newControl - Control
   * @param app - App identifier
   */
  private setMapScale(newControl: Control, app: string): void {
    const currentScaleControl = this.getMapScale(app);
    if (currentScaleControl) {
      this.hsMapService.getMap(app).removeControl(currentScaleControl);
    }
    this.hsMapService.getMap(app).addControl(newControl);
  }
}
