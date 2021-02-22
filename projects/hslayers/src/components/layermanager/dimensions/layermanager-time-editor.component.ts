import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerDescriptor} from '../layer-descriptor.interface';
import {HsLayerManagerWmstService} from '../layermanager-wmst.service';
import {HsLayoutService} from '../../layout/layout.service';

@Component({
  selector: 'hs-layermanager-time-editor',
  templateUrl: 'layermanager-time-editor.component.html',
})
export class HsLayerManagerTimeEditorComponent implements OnInit {
  @Input() layer: HsLayerDescriptor;
  /**
   * ISO format time
   */
  currentTime: string;
  currentTimeIdx: number;
  availableTimes: Array<string>;
  @ViewChild('hstimeselector') selectElement;
  selectVisible: boolean;
  timesInSync: boolean;

  constructor(
    public hsEventBusService: HsEventBusService,
    public hsLayerManagerWmstService: HsLayerManagerWmstService,
    public hsLayoutService: HsLayoutService
  ) {
    this.hsEventBusService.layerTimeChanges.subscribe(({layer, _}) => {
      if (this.availableTimes === undefined && this.layer.uid === layer.uid) {
        this.availableTimes = layer.time.timePoints;
        this.setCurrentTimeIfAvailable(this.layer.time.default);
        if (!this.currentTimeDefined()) {
          this.currentTime = this.availableTimes[0];
          this.currentTimeIdx = this.availableTimes.indexOf(this.currentTime);
        }
      }
    });
    this.hsEventBusService.layerTimeSynchronizations.subscribe(
      ({sync, time}) => {
        this.timesInSync = sync;
        if (sync) {
          this.hideTimeSelect();
          this.setCurrentTimeIfAvailable(time);
          if (this.currentTime) {
            this.setLayerTime();
          }
        }
      }
    );
  }

  ngOnInit(): void {
    this.selectVisible = false;
    this.timesInSync = false;
  }

  currentTimeDefined(): boolean {
    return this.currentTime !== undefined && this.currentTime !== null;
  }

  hasPreviousTime(): boolean {
    return this.availableTimes && this.currentTimeIdx > 0;
  }

  hasFollowingTime(): boolean {
    return (
      this.availableTimes &&
      this.currentTimeIdx < this.availableTimes.length - 2
    );
  }

  previousTime(): void {
    if (this.hasPreviousTime()) {
      this.currentTime = this.availableTimes[--this.currentTimeIdx];
      if (this.timesInSync) {
        this.hsEventBusService.layerTimeSynchronizations.next({
          sync: this.timesInSync,
          time: this.currentTime,
        });
      }
      this.setLayerTime();
    }
  }

  followingTime(): void {
    if (this.hasFollowingTime()) {
      this.currentTime = this.availableTimes[++this.currentTimeIdx];
      if (this.timesInSync) {
        this.hsEventBusService.layerTimeSynchronizations.next({
          sync: this.timesInSync,
          time: this.currentTime,
        });
      }
      this.setLayerTime();
    }
  }

  selectTime(evt: Event): void {
    this.currentTime = (evt.target as HTMLSelectElement).value;
    this.currentTimeIdx = this.availableTimes.indexOf(this.currentTime);
    if (this.timesInSync) {
      this.hsEventBusService.layerTimeSynchronizations.next({
        sync: this.timesInSync,
        time: this.currentTime,
      });
    }
    this.setLayerTime();
  }

  setCurrentTimeIfAvailable(time: string): void {
    if (this.availableTimes.includes(time)) {
      this.currentTime = time;
      this.currentTimeIdx = this.availableTimes.indexOf(time);
    } else {
      this.currentTime = null;
      this.currentTimeIdx = -1;
    }
  }

  setLayerTime(): void {
    setTimeout(() => {
      this.hsLayerManagerWmstService.setLayerTime(this.layer, this.currentTime);
    }, 100);
  }

  showTimeSelect(): void {
    this.selectVisible = true;
    this.selectElement.nativeElement.focus(); //FIXME: this just refuse to work...
  }

  hideTimeSelect(): void {
    this.selectVisible = false;
  }

  synchronizeTimes(): void {
    this.timesInSync = !this.timesInSync;
    this.hsEventBusService.layerTimeSynchronizations.next({
      sync: this.timesInSync,
      time: this.currentTime,
    });
  }
}
