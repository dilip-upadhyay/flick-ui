import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationConfig, NavigationItem } from '../../models/ui-config.interface';

@Component({
  selector: 'app-navigation-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navigation-renderer.component.html',
  styleUrl: './navigation-renderer.component.css'
})
export class NavigationRendererComponent {
  @Input() config!: NavigationConfig;
  @Output() event = new EventEmitter<any>();

  collapsedItems: Set<string> = new Set();
  isMobileMenuOpen = false;

  /**
   * Handle navigation item click
   */
  onItemClick(item: NavigationItem): void {
    if (item.disabled) return;

    if (item.children && item.children.length > 0) {
      this.toggleCollapse(item.id);
    } else {
      this.event.emit({
        type: 'navigate',
        action: item.action || 'navigate',
        data: {
          item: item,
          route: item.route
        }
      });
    }
  }

  /**
   * Toggle collapse state for navigation item
   */
  toggleCollapse(itemId: string): void {
    if (this.collapsedItems.has(itemId)) {
      this.collapsedItems.delete(itemId);
    } else {
      this.collapsedItems.add(itemId);
    }
  }

  /**
   * Check if item is collapsed
   */
  isCollapsed(itemId: string): boolean {
    return this.collapsedItems.has(itemId);
  }

  /**
   * Check if item is active
   */
  isActive(item: NavigationItem): boolean {
    return this.config.activeItem === item.id;
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  /**
   * Get navigation container classes
   */
  getNavigationClasses(): string {
    const classes = ['navigation-container'];
    
    if (this.config.type) {
      classes.push(`navigation-${this.config.type}`);
    }

    if (this.config.collapsible) {
      classes.push('navigation-collapsible');
    }

    return classes.join(' ');
  }

  /**
   * Get navigation item classes
   */
  getItemClasses(item: NavigationItem): string {
    const classes = ['nav-item'];

    if (this.isActive(item)) {
      classes.push('active');
    }

    if (item.disabled) {
      classes.push('disabled');
    }

    if (item.children && item.children.length > 0) {
      classes.push('has-children');
      if (this.isCollapsed(item.id)) {
        classes.push('collapsed');
      }
    }

    return classes.join(' ');
  }
}
