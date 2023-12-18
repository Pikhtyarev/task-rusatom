import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import * as echarts from 'echarts';

import { NgApexchartsModule } from "ng-apexcharts";
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexStroke,
  ApexLegend
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
};

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgApexchartsModule,
  ],
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.scss'
})
export class ChartsComponent implements OnInit {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  public coalForm: FormGroup;
  public gasForm: FormGroup;

  private CO2coalValue: number;
  private CO2gasValue: number;

  private coalChartData: any[] = [];
  private gasChartData: any[] = [];
  private combinedChartData: any[] = [];

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.coalForm = this.formBuilder.group({
      coalConsumption: [, [Validators.required, Validators.min(0), Validators.max(1000)]],
      date: [, Validators.required]
    });
  
    this.gasForm = this.formBuilder.group({
      gasConsumption: [, [Validators.required, Validators.min(0), Validators.max(1000)]],
      date: [, Validators.required]
    });

    // ECharts
    type EChartsOption = echarts.EChartsOption;
    let chartDom = document.getElementById('main')!;
    let myChart = echarts.init(chartDom);
    let option: EChartsOption;
    option = {
      xAxis: {},
      yAxis: {},
      series: [
        {}
      ]
    };
    option && myChart.setOption(option);

    // APEXCHARTS
    this.chartOptions = {
      series: [],
      chart: {
        height: 400,
        type: "area",
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
      },
      xaxis: {
        type: "datetime",
        categories: [],
      },
      legend: {
        show: false
      }
    };
  }

  calculateCoalEmissions() {
    const coalConsumption = this.coalForm.value.coalConsumption;
    const date = new Date(this.coalForm.value.date).getTime();

    const existingCoalData = this.coalChartData.find(item => item.date === date);
    if (existingCoalData) {
      alert('Значение для выбранной даты уже существует');
      return;
    }
    if (this.coalForm.value.coalConsumption === null && this.coalForm.value.date === null) {
      return;
    }
  
    this.CO2coalValue = coalConsumption * 0.768 * 2.76;
  
    this.combinedChartData.push({
      date,
      combinedConsumption: this.CO2coalValue,
    });
    
    this.coalChartData.push({
      date,
      coalConsumption: this.CO2coalValue,
    });
  
    this.coalChartData.sort((a, b) => a.date - b.date);
  
    this.updateChart();
  }

  calculateGasEmissions() {
    const gasConsumption = this.gasForm.value.gasConsumption;
    const date = new Date(this.gasForm.value.date).getTime();

    const existingGasData = this.gasChartData.find(item => item.date === date);
    if (existingGasData) {
      alert('Значение для выбранной даты уже существует');
      return;
    }
    if (this.gasForm.value.gasConsumption === null && this.gasForm.value.date === null) {
      return;
    }
  
    this.CO2gasValue = gasConsumption * 1.129 * 1.59;
  
    this.combinedChartData.push({
      date,
      combinedConsumption: this.CO2gasValue,
    });
    
    this.gasChartData.push({
      date,
      gasConsumption: this.CO2gasValue,
    });
  
    this.gasChartData.sort((a, b) => a.date - b.date);
  
    this.updateChart();
  }

  resetCoalForm() {
    this.coalForm.reset();
  }

  resetGasForm() {
    this.gasForm.reset();
  }

  updateChart() {
    let chartDom = document.getElementById('main')!;
    let myChart = echarts.init(chartDom);

    const combinedData: { [key: number]: { coal: number; gas: number } } = {};

    this.coalChartData.forEach(({ date, coalConsumption }) => {
      if (combinedData[date]) {
        combinedData[date].coal = coalConsumption;
      } else {
        combinedData[date] = { coal: coalConsumption, gas: 0 };
      }
    });
  
    this.gasChartData.forEach(({ date, gasConsumption }) => {
      if (combinedData[date]) {
        combinedData[date].gas = gasConsumption;
      } else {
        combinedData[date] = { coal: 0, gas: gasConsumption };
      }
    });
  
    const combinedChartData = Object.entries(combinedData).map(([date, { coal, gas }]) => ({
      date: Number(date),
      combinedConsumption: coal + gas,
    }));
  
    // ECharts
    let option: echarts.EChartsOption = {
      xAxis: {
        type: 'time',
        name: 'Дата',
        axisLabel: {
          formatter: (value: number) => {
            const date = new Date(value);
            const monthNames = ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
            return `${monthNames[date.getMonth()]} ${date.getDate()}`;
          },
        },
      },
      yAxis: {
        type: 'value',
        name: 'Выбросы (тонн)',
      },
      series: [
        {
          name: 'Выбросы СО2 от сжигания твердого топлива',
          symbolSize: 20,
          data: this.coalChartData.map(({ date, coalConsumption }) => ([date, coalConsumption])),
          type: 'scatter',
        },
        {
          name: 'Выбросы СО2 от сжигания газа',
          symbolSize: 20,
          data: this.gasChartData.map(({ date, gasConsumption }) => [date, gasConsumption]),
          type: 'scatter',
        },
        {
          name: 'Выбросы СО2 общие',
          symbolSize: 20,
          data: combinedChartData.map(({ date, combinedConsumption }) => [date, combinedConsumption]),
          type: 'scatter',
        },
      ],
      tooltip: {
        show: true,
        trigger: 'item',
        formatter: (params: any) => {
          const name = params.seriesName;
          return `${name}`;
        },
      },
    };
  
    option && myChart.setOption(option);
    
    const coalSeriesData = this.coalChartData.map(({ date, coalConsumption }) => ({
      name: 'Выбросы СО2 от сжигания твердого топлива',
      data: [[date, coalConsumption]],
    }));
  
    const gasSeriesData = this.gasChartData.map(({ date, gasConsumption }) => ({
      name: 'Выбросы СО2 от сжигания газа',
      data: [[date, gasConsumption]],
    }));
  
    const combinedSeriesData = combinedChartData.map(({ date, combinedConsumption }) => ({
      name: 'Выбросы СО2 общие',
      data: [[date, combinedConsumption]],
    }));
  
    // APEXCHARTS
    this.chartOptions = {
      series: [...coalSeriesData, ...gasSeriesData, ...combinedSeriesData],
      chart: {
        height: 400,
        type: "area",
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
      },
      xaxis: {
        type: "datetime",
        categories: [],
      },
      legend: {
        show: false,
      }
    };
  }
}
