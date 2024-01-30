import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
} from '@angular/core';
import * as echarts from 'echarts';
import { TemperatureDepartment } from 'src/app/shared/interfaces/temperatureDepartment';

@Component({
  selector: 'app-chart-line',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-line.component.html',
  styleUrls: ['./chart-line.component.scss'],
})
export class ChartLineComponent {
  @Input({ required: true }) data: TemperatureDepartment[] | null = null;
  @ViewChild('chartContainer') chartContainer?: ElementRef;
  private myChart?: echarts.ECharts;

  ngAfterViewInit(): void {
    this.myChart = echarts.init(this.chartContainer?.nativeElement);
  }

  ngOnChanges() {
    if (this.data && this.myChart) {
      const dateListe = this.data?.map((x) => x.date_obs).reverse();
      const valueList = this.data?.map((x) => x.tmoy).reverse();

      const option: echarts.EChartsOption = {
        tooltip: {
          trigger: 'axis',
        },
        grid: {
          left: '30',
          right: '10',
          bottom: '20',
          top: '10',
        },
        xAxis: {
          type: 'category',
          data: dateListe,
        },
        yAxis: {
          type: 'value',
          minInterval: 3,
        },
        series: [
          {
            lineStyle: { width: 1 },
            data: valueList,
            type: 'line',
            smooth: true,
            symbol: 'none',
            itemStyle: {
              color: '#f76b15',
            },
          },
        ],
      };

      this.myChart?.setOption(option);
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event): void {
    this.myChart?.resize();
  }
}
