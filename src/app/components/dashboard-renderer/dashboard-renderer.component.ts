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
  
  hasGridPositioning(): boolean {
    // Check if any widget has CSS grid positioning
    const allWidgets = [
      ...this.widgets,
      ...(this.config.layoutConfig?.header?.widgets || []),
      ...(this.config.layoutConfig?.body?.widgets || []),
      ...(this.config.layoutConfig?.leftPanel?.widgets || []),
      ...(this.config.layoutConfig?.rightPanel?.widgets || []),
      ...(this.config.layoutConfig?.footer?.widgets || [])
    ];
    
    const hasGrid = allWidgets.some(widget => 
      (widget as any).gridColumn || (widget as any).gridRow) || false;
    console.log('Dashboard hasGridPositioning:', hasGrid, 'all widgets:', allWidgets.length, 'widgets with grid positioning:', 
      allWidgets.filter(widget => (widget as any).gridColumn || (widget as any).gridRow)?.map(w => ({ 
        id: w.id, 
        gridColumn: (w as any).gridColumn, 
        gridRow: (w as any).gridRow 
      })));
    return hasGrid;
  }

  getWidgetGridStyle(widget: WidgetConfig): any {
    const widgetAny = widget as any;
    const style: any = {};
    
    if (widgetAny.gridColumn) {
      style['grid-column'] = widgetAny.gridColumn;
    }
    if (widgetAny.gridRow) {
      style['grid-row'] = widgetAny.gridRow;
    }
    if (widgetAny.gridArea) {
      style['grid-area'] = widgetAny.gridArea;
    }
    
    if (Object.keys(style).length > 0) {
      console.log(`Grid style for widget ${widget.id}:`, style);
      return style;
    }
    return {};
  }

  getWidgetContainerClass(widget: WidgetConfig): string {
    const classes = ['widget-container'];
    
    // Add widget type and ID as classes for CSS targeting
    classes.push(`widget-type-${widget.type}`);
    classes.push(`widget-id-${widget.id}`);
    
    // Check if widget has grid positioning
    const widgetAny = widget as any;
    if (widgetAny.gridColumn || widgetAny.gridRow || widgetAny.gridArea) {
      classes.push('grid-positioned');
      console.log(`Widget ${widget.id} has grid positioning, classes:`, classes);
      return classes.join(' ');
    }
    
    // Fall back to span-based positioning for compatibility
    const span = widgetAny.span || 1;
    const rowSpan = widgetAny.rowSpan || 1;
    classes.push(`span-${span}`, `row-span-${rowSpan}`);
    
    return classes.join(' ');
  }
  
  getWidgetClass(widget: WidgetConfig): string {
    // Legacy method - use getWidgetContainerClass instead
    return this.getWidgetContainerClass(widget);
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
