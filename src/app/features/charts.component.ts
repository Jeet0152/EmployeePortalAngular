import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { EmployeeService, Employee } from '../core/employee.service';
import { MedicalService, MedicalDetail } from '../core/medical.service';

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [CommonModule],
  templateUrl:'./charts.html',
  styleUrl:'./charts.scss'
})
export class ChartsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('ageChart') ageEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('profChart') profEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('claimsChart') claimsEl!: ElementRef<HTMLCanvasElement>;

  private sub?: Subscription;

  // Age/prof data
  private ageLabels = ['<25', '25–34', '35–44', '45–54', '55+'];
  private ageCounts = [0, 0, 0, 0, 0];
  private profLabels: string[] = [];
  private profCounts: number[] = [];

  // Monthly claims (computed from Medical Details)
  private monthLabels: string[] = [];
  private monthValues: number[] = [];

  // charts
  private ageChart?: Chart;
  private profChart?: Chart;
  private claimsChart?: Chart;

  private inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  constructor(
    private employees: EmployeeService,
    private medical: MedicalService
  ) { }

  ngOnInit(): void {
    // Employees → age/prof charts
    this.sub = this.employees.employees$.subscribe(list => {
      this.computeAgeGroups(list);
      this.computeProfessions(list);
      this.updateCharts();
    });
    this.employees.load();

    // Medical → monthly average from the table rows
    this.medical.list().subscribe({
      next: (rows) => {
        this.computeMonthlyAvg(rows);
        this.updateCharts();
      },
      error: () => {
        // Fallback: no data
        this.monthLabels = ['Jan', 'Feb', 'Mar'];
        this.monthValues = [0, 0, 0];
        this.updateCharts();
      }
    });
  }

  ngAfterViewInit(): void {
    this.ageChart = new Chart(this.ageEl.nativeElement, this.ageConfig());
    this.profChart = new Chart(this.profEl.nativeElement, this.profConfig());
    this.claimsChart = new Chart(this.claimsEl.nativeElement, this.claimsConfig());
    this.updateCharts();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.ageChart?.destroy();
    this.profChart?.destroy();
    this.claimsChart?.destroy();
  }

  // ---- compute helpers ----
  private computeAgeGroups(list: Employee[]) {
    this.ageCounts = [0, 0, 0, 0, 0];
    for (const e of list) {
      const a = e.age ?? 0;
      const idx = a < 25 ? 0 : a < 35 ? 1 : a < 45 ? 2 : a < 55 ? 3 : 4;
      this.ageCounts[idx]++;
    }
  }

  private computeProfessions(list: Employee[]) {
    const map = new Map<string, number>();
    for (const e of list) {
      const p = (e.profession || 'Other').trim();
      map.set(p, (map.get(p) || 0) + 1);
    }
    this.profLabels = Array.from(map.keys());
    this.profCounts = Array.from(map.values());
  }

  private computeMonthlyAvg(rows: MedicalDetail[]) {
    // Group by month, compute AVG of claimedAmount
    const order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sums = new Map<string, { sum: number; n: number }>();
    for (const r of rows) {
      const m = r.month || 'Jan'; // default if missing
      const cur = sums.get(m) || { sum: 0, n: 0 };
      cur.sum += (r.claimedAmount || 0);
      cur.n += 1;
      sums.set(m, cur);
    }
    // Sort by calendar order and build arrays
    const labels: string[] = [];
    const values: number[] = [];
    for (const m of order) {
      if (sums.has(m)) {
        const { sum, n } = sums.get(m)!;
        labels.push(m);
        values.push(n ? Math.round(sum / n) : 0);
      }
    }
    this.monthLabels = labels;
    this.monthValues = values;
  }

  // ---- chart configs ----
  private ageConfig(): ChartConfiguration {
    return {
      type: 'bar',
      data: {
        labels: this.ageLabels,
        datasets: [{ label: 'Employees', data: this.ageCounts }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    };
  }

  private profConfig(): ChartConfiguration {
    return {
      type: 'pie',
      data: {
        labels: this.profLabels,
        datasets: [{ label: 'Count', data: this.profCounts }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    };
  }

  private claimsConfig(): ChartConfiguration {
    return {
      type: 'line',
      data: {
        labels: this.monthLabels,
        datasets: [{ label: 'Avg Claim (₹)', data: this.monthValues, tension: 0.3 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
              callback: (v) => this.inr.format(Number(v))
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${this.inr.format(Number(ctx.parsed.y))}`
            }
          }
        }
      }
    };
  }

  // ---- refresh data on charts ----
  private updateCharts() {
    if (this.ageChart) {
      this.ageChart.data.labels = this.ageLabels;
      this.ageChart.data.datasets[0].data = this.ageCounts;
      this.ageChart.update();
    }
    if (this.profChart) {
      this.profChart.data.labels = this.profLabels;
      this.profChart.data.datasets[0].data = this.profCounts;
      this.profChart.update();
    }
    if (this.claimsChart) {
      this.claimsChart.data.labels = this.monthLabels;
      this.claimsChart.data.datasets[0].data = this.monthValues;
      this.claimsChart.update();
    }
  }
}
