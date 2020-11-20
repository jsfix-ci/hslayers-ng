import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';
import {Component} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from './../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsStylerColorService} from './styler-color.service';
import {HsStylerService} from '../styles/styler.service';
import {HsUtilsService} from '../utils/utils.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';

type StyleJson = {
  fill?: any;
  stroke?: any;
  image?: any;
  radius?: any;
};

@Component({
  selector: 'hs-styles',
  templateUrl: './partials/styler.html',
})
export class HsStylerComponent {
  icons: any;
  imagetypes: Array<any> = [
    {
      name: 'none',
      hrname: 'None',
    },
    {
      name: 'icon',
      hrname: 'Icon',
    },
    {
      name: 'circle',
      hrname: 'Circle',
    },
  ];
  imagetype = this.imagetypes[2].name;
  radius = 5;
  linewidth = 2;
  iconlinewidth = 1;
  iconimage: any;
  fillcolor: any;
  linecolor: any;
  iconfillcolor: any;
  iconlinecolor: any;
  serialized_icon: any;
  hasLine: any;
  hasPoly: any;
  hasPoint: any;
  layerTitle: string;
  level: 'feature' | 'cluster' | 'layer' = 'layer';
  isClustered: boolean;

  constructor(
    public HsStylerService: HsStylerService,
    public HsLayoutService: HsLayoutService,
    private http: HttpClient,
    public HsEventBusService: HsEventBusService,
    public sanitizer: DomSanitizer,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsUtilsService: HsUtilsService,
    public HsStylerColorService: HsStylerColorService
  ) {
    this.HsEventBusService.mainPanelChanges.subscribe((e) => {
      if (this.HsLayoutService.mainpanel == 'styler') {
        if (!this.icons) {
          this.icons = [
            './img/svg/bag1.svg',
            './img/svg/banking4.svg',
             './img/svg/bar.svg',
             './img/svg/beach17.svg',
             './img/svg/bicycles.svg',
             './img/svg/building103.svg',
             './img/svg/bus4.svg',
             './img/svg/cabinet9.svg',
             './img/svg/camping13.svg',
             './img/svg/caravan.svg',
             './img/svg/church15.svg',
             './img/svg/church1.svg',
             './img/svg/coffee-shop1.svg',
             './img/svg/disabled.svg',
             './img/svg/favourite28.svg',
             './img/svg/football1.svg',
             './img/svg/footprint.svg',
             './img/svg/gift-shop.svg',
             './img/svg/gps40.svg',
             './img/svg/gps41.svg',
             './img/svg/gps42.svg',
             './img/svg/gps43.svg',
             './img/svg/gps5.svg',
             './img/svg/hospital.svg',
             './img/svg/hot-air-balloon2.svg',
             './img/svg/information78.svg',
             './img/svg/library21.svg',
             './img/svg/location6.svg',
             './img/svg/luggage13.svg',
             './img/svg/monument1.svg',
             './img/svg/mountain42.svg',
             './img/svg/museum35.svg',
             './img/svg/park11.svg',
             './img/svg/parking28.svg',
             './img/svg/pharmacy17.svg',
             './img/svg/port2.svg',
             './img/svg/restaurant52.svg',
             './img/svg/road-sign1.svg',
             './img/svg/sailing-boat2.svg',
             './img/svg/ski1.svg',
             './img/svg/swimming26.svg',
             './img/svg/telephone119.svg',
             './img/svg/toilets2.svg',
             './img/svg/train-station.svg',
             './img/svg/university2.svg',
             './img/svg/warning.svg',
             './img/svg/wifi8.svg',
          ].map((icon) =>
            this.sanitizer.bypassSecurityTrustResourceUrl(
              this.HsUtilsService.resolveEsModule(icon)
            )
          );
        }
        this.isClustered = this.HsLayerUtilsService.isLayerClustered(
          HsStylerService.layer
        );
      }
      this.refreshLayerDefinition();
    });
  }

  toDecimal2(n: number) {
    return Math.round(n * 100) / 100;
  }

  debounceSave() {
    this.HsUtilsService.debounce(
      () => {
        this.save();
      },
      200,
      false,
      this
    )();
  }

  async save(): Promise<void> {
    if (!this.HsStylerService.layer) {
      return;
    }
    if (this.imagetype == 'icon') {
      // When no icon is selected yet, then pick one randomly
      if (this.iconimage === undefined || this.iconimage === null) {
        const randomIconIdx = Math.floor(Math.random() * this.icons.length);
        this.iconSelected(this.icons[randomIconIdx]);
      }
    }
    const style_json: StyleJson = {};
    //FILL
    if (this.fillcolor !== undefined) {
      style_json.fill = new Fill({
        color: this.fillcolor['background-color'],
      });
    } else {
      style_json.fill = new Fill({
        color: 'rgb(0,0,255)',
      });
    }
    //STROKE WIDTH
    if (
      this.linecolor !== undefined &&
      this.linecolor !== null &&
      this.linewidth > 0
    ) {
      style_json.stroke = new Stroke({
        color: this.linecolor['background-color'],
        width: this.linewidth !== undefined ? this.linewidth : 1,
      });
    } else {
      style_json.stroke = new Stroke({
        color: 'rgb(44,0,200)',
        width: this.linewidth !== undefined ? this.linewidth : 1,
      });
    }
    //
    if (this.imagetype != 'none') {
      style_json.image = null;
      if (
        this.imagetype == 'circle' &&
        (this.iconfillcolor !== undefined || this.iconlinecolor !== undefined)
      ) {
        const circle_json: StyleJson = {
          radius: this.radius !== undefined ? this.toDecimal2(this.radius) : 5,
        };
        if (this.iconfillcolor !== undefined && this.iconfillcolor !== null) {
          circle_json.fill = new Fill({
            color: this.iconfillcolor['background-color'],
          });
        }
        if (
          this.iconlinecolor !== undefined &&
          this.iconlinecolor !== null &&
          this.iconlinewidth > 0
        ) {
          circle_json.stroke = new Stroke({
            color: this.iconlinecolor['background-color'],
            width: this.iconlinewidth,
          });
        }
        style_json.image = new Circle(circle_json);
      }
      if (this.imagetype == 'icon' && this.serialized_icon !== undefined) {
        const img = await this.loadImage(this.serialized_icon);
        const icon_json = {
          img: img,
          imgSize: [img.width, img.height],
          anchor: [0.5, 1],
          crossOrigin: 'anonymous',
        };
        style_json.image = new Icon(icon_json);
      }
    }
    if (
      style_json.fill !== undefined ||
      style_json.stroke !== undefined ||
      style_json.image !== undefined
    ) {
      this.setStyleByJson(style_json);
    }
  }

  loadImage(src): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', (err) => reject(err));
      img.src = src;
    });
  }

  setStyleByJson(style_json: StyleJson): void {
    const style = new Style(style_json);
    const layer = this.HsStylerService.layer;
    // const isClustered = this.HsLayerUtilsService.isLayerClustered(layer);
    switch (this.level) {
      case 'feature':
        this.setStyleForFeatures(layer, style);
        break;
      case 'cluster':
        this.HsStylerService.clusterStyle.setFill(
          style.getImage() ? style.getImage().getFill() : style.getFill()
        );
        this.HsStylerService.clusterStyle.setStroke(
          style.getImage() ? style.getImage().getStroke() : style.getStroke()
        );
        this.HsStylerService.styleClusteredLayer(layer);
        break;
      default:
      case 'layer':
        this.setStyleForFeatures(layer, null);
        if (this.isClustered) {
          /* hsOriginalStyle is used only for cluster layers 
          when styling clusters with just one feature in it */
          this.HsStylerService.layer.set('hsOriginalStyle', style);
        } else {
          layer.setStyle(style);
        }
        this.HsStylerService.newLayerStyleSet.next(layer);
        break;
    }
    if (this.isClustered) {
      this.repaintCluster(layer);
    }
  }

  /**
   * Force repainting of clusters by reapplying cluster style which
   * was created in cluster method
   *
   * @param {VectorLayer} layer Vector layer
   */
  repaintCluster(layer: VectorLayer): void {
    layer.setStyle(layer.getStyle());
  }

  /**
   * Sets style for all features in a given layer.
   * For cluster layers the style is set for underlying sources features.
   *
   * @param {VectorLayer} layer Layer for whose features is the style set.
   * @param {StyleLike|null} style Style to set for the feature. Can be null
   */
  private setStyleForFeatures(layer: VectorLayer, style: Style | null): void {
    // const isClustered = this.HsLayerUtilsService.isLayerClustered(layer);
    const underlyingSource = this.HsStylerService.getLayerSource(layer);
    /**
     * We set a blank VectorSource temporarily
     * to disable change event broadcasting and linked
     * repainting on each call of setStyle for all features.
     */
    (this.isClustered ? layer.getSource() : layer).setSource(
      new VectorSource()
    );
    for (const f of underlyingSource.getFeatures()) {
      f.setStyle(style);
    }
    (this.isClustered ? layer.getSource() : layer).setSource(underlyingSource);
    this.HsStylerService.newFeatureStyleSet.next(layer);
  }

  /**
   * @function iconSelected
   * @memberof HsStylerComponent
   * @param {SafeResourceUrl} i Sanitized icon resource
   * @description Load selected SVG icon and use it for layer
   */
  iconSelected(i: SafeResourceUrl): void {
    const headers = new HttpHeaders();
    headers.set('Accept', 'image/svg+xml');
    this.http
      .get(i['changingThisBreaksApplicationSecurity'], {
        headers,
        responseType: 'text',
      })
      .subscribe((response) => {
        this.iconimage = this.sanitizer.bypassSecurityTrustHtml(response);
        //Timeout is needed even in angular 9, because svg is loaded on
        // next digest and used in marker generation
        setTimeout(() => {
          this.colorIcon();
          this.save();
        }, 0);
      });
  }

  /**
   * @function colorIcon
   * @memberof HsStylerComponent
   * @description Change colors of selected icon based on user input. Decode modified icon into Base-64
   */
  colorIcon(): void {
    const iconPreview = document.getElementsByClassName(
      'hs-styler-selected-icon-box'
    )[0];
    const svgPath: any = iconPreview.querySelectorAll('path');
    for (const path of svgPath) {
      if (!path) {
        return;
      }
      if (this.iconfillcolor !== undefined && this.iconfillcolor !== null) {
        path.style.fill = this.iconfillcolor['background-color'];
      }
      if (this.iconlinecolor !== undefined && this.iconlinecolor !== null) {
        path.style.stroke = this.iconlinecolor['background-color'];
      }
      if (this.iconlinewidth !== undefined && this.iconlinewidth !== null) {
        path.style.strokeWidth = this.iconlinewidth;
      }
      this.serialized_icon =
        'data:image/svg+xml;base64,' + window.btoa(iconPreview.innerHTML);
    }
  }
  /**
   * @function setImageType
   * @memberof HsStylerComponent
   * @param {string} t New image type
   * @description Change image type for point geometry and redraw style
   */
  setImageType(t: string): void {
    this.imagetype = t;
    this.save();
  }

  layermanager(): void {
    this.HsLayoutService.setMainPanel('layermanager');
  }

  /**
   * @function refreshLayerDefinition
   * @memberof HsStylerComponent
   * @description (PRIVATE) Get geometry type and title for selected layer
   */
  refreshLayerDefinition(): void {
    if (this.HsStylerService.layer === null) {
      return;
    }
    const src: any = this.HsStylerService.getLayerSource(
      this.HsStylerService.layer
    );
    if (
      this.HsStylerService.layer === undefined ||
      this.HsStylerService.layer === null
    ) {
      return;
    }
    this.calculateHasLinePointPoly(src);
    this.readCurrentStyle(this.HsStylerService.layer);
    this.hasLine = src.hasLine;
    this.hasPoly = src.hasPoly;
    this.hasPoint = src.hasPoint;
    this.layerTitle = this.HsStylerService.layer.get('title');
  }

  readCurrentStyle(layer: VectorLayer): void {
    let style = layer.getStyle();
    if (this.HsLayerUtilsService.isLayerClustered(layer)) {
      style = layer.get('hsOriginalStyle');
    }
    if (typeof style == 'function') {
      const resolvedStyle: Style | Style[] = style(new Feature());
      this.parseStyles(resolvedStyle);
    } else if (this.HsUtilsService.instOf(style, Style)) {
      this.parseStyle(style);
    }
  }

  private parseStyles(resolvedStyle: Style | Style[]) {
    if (Array.isArray(resolvedStyle)) {
      for (const subStyle of resolvedStyle) {
        this.parseStyle(subStyle);
      }
    } else if (this.HsUtilsService.instOf(resolvedStyle, Style)) {
      this.parseStyle(resolvedStyle);
    }
  }

  private parseStyle(subStyle: Style) {
    if (subStyle.getStroke()?.getColor()) {
      this.linecolor = this.HsStylerColorService.findAndParseColor(
        subStyle.getStroke().getColor()
      );
    }
    if (subStyle.getFill()?.getColor()) {
      this.fillcolor = this.HsStylerColorService.findAndParseColor(
        subStyle.getFill().getColor()
      );
    }
    if (subStyle.image) {
      if (subStyle.image.getStroke()?.getColor()) {
        this.iconlinecolor = this.HsStylerColorService.findAndParseColor(
          subStyle.getStroke().getColor()
        );
      }
      if (subStyle.image.getFill()?.getColor()) {
        this.iconfillcolor = this.HsStylerColorService.findAndParseColor(
          subStyle.getFill().getColor()
        );
      }
    }
  }

  /**
   * @function calculateHasLinePointPoly
   * @memberof HsStylerComponent
   * @private
   * @description (PRIVATE) Calculate vector type if not specified in layer metadata
   * @param src
   */
  calculateHasLinePointPoly(src): void {
    src.hasLine = false;
    src.hasPoly = false;
    src.hasPoint = false;
    src.getFeatures().forEach((f) => {
      if (f.getGeometry()) {
        switch (f.getGeometry().getType()) {
          case 'LineString' || 'MultiLineString':
            src.hasLine = true;
            break;
          case 'Polygon' || 'MultiPolygon':
            src.hasPoly = true;
            break;
          case 'Circle':
            src.hasPoly = true;
            break;
          case 'Point' || 'MultiPoint':
            src.hasPoint = true;
            break;
          // no default
        }
      }
    });
  }
}