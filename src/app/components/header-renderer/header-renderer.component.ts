import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderConfig } from '../../models/ui-config.interface';

@Component({
  selector: 'app-header-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header-renderer.component.html',
  styleUrl: './header-renderer.component.css'
})
export class HeaderRendererComponent {
  @Input() config!: HeaderConfig;
  @Output() event = new EventEmitter<any>();

  /**
   * Handle action button clicks
   */
  onActionClick(action: any): void {
    this.event.emit({
      type: 'action',
      action: action.action,
      data: action
    });
  }

  /**
   * Get header theme classes
   */
  getHeaderClasses(): string {
    const classes = ['header-container'];
    
    if (this.config.theme) {
      classes.push(`header-theme-${this.config.theme}`);
    }

    return classes.join(' ');
  }
}
