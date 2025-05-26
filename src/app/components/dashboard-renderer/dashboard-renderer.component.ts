import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DashboardConfig, WidgetConfig, ChartConfig, ActionConfig, DashboardSection } from '../../models/ui-config.interface';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-dashboard-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-renderer.component.html',
  styleUrls: ['./dashboard-renderer.component.css']
})
export class DashboardRendererComponent implements OnInit, OnDestroy {
  @Input() config!: DashboardConfig;
  
  // Expose Math to template
  Math = Math;
  
  private destroy$ = new Subject<void>();
  widgets: WidgetConfig[] = [];
  
  constructor(private configService: ConfigService) {}
  
  ngOnInit() {
    this.loadWidgets();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadWidgets() {
    if (this.config.widgets) {
      this.widgets = this.config.widgets as WidgetConfig[];
    }
    
    // In a real implementation, you would load widgets from data source
    // For now, we'll just use the configured widgets
  }

  toggleSection(sectionName: 'leftPanel' | 'rightPanel' | 'header' | 'footer' | 'body') {
    if (this.config.layoutConfig) {
      const section = this.config.layoutConfig[sectionName];
      if (section && section.collapsible) {
        section.collapsed = !section.collapsed;
      }
    }
  }
  
  getGridClass(): string {
    const cols = this.config.grid?.columns || 12;
    const gap = this.config.grid?.gap || 'medium';
    return `dashboard-grid cols-${cols} gap-${gap}`;
  }
  
  getWidgetClass(widget: WidgetConfig): string {
    const span = (widget as any).span || 1;
    const rowSpan = (widget as any).rowSpan || 1;
    return `widget span-${span} row-span-${rowSpan}`;
  }
  
  onWidgetAction(widget: WidgetConfig, action: string) {
    const actionConfig = widget.actions?.find((a: any) => a.type === action);
    if (actionConfig) {
      this.executeAction(actionConfig);
    }
  }
  
  executeAction(action: ActionConfig) {
    switch (action.type) {
      case 'navigate':
        // Handle navigation
        console.log('Navigate to:', action.route);
        break;
      case 'refresh':
        this.loadWidgets();
        break;
      case 'export':
        // Handle export
        console.log('Export data');
        break;
      default:
        console.log('Unknown action:', action.type);
        break;
    }
  }
  
  formatValue(value: any, format?: string): string {
    if (!format) return value?.toString() || '';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'number':
        return new Intl.NumberFormat().format(value);
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'datetime':
        return new Date(value).toLocaleString();
      default:
        return value?.toString() || '';
    }
  }
  
  getChartData(widget: WidgetConfig): any {
    if (widget.type !== 'chart' || !widget.chart) return null;
    
    // This would typically integrate with a charting library like Chart.js or D3
    return {
      type: widget.chart.type,
      data: widget.chart.data,
      options: widget.chart.options
    };
  }
  
  getProgressPercentage(widget: WidgetConfig): number {
    if (widget.type !== 'progress' || !widget.progress) return 0;
    
    const { current, target } = widget.progress;
    return Math.min((current / target) * 100, 100);
  }
  
  getListItems(widget: WidgetConfig): any[] {
    if (widget.type !== 'list' || !widget.list) return [];
    return widget.list.items || [];
  }
}
