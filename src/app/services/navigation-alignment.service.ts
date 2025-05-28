import { Injectable } from '@angular/core';
import { UIConfig, UIComponent } from '../models/ui-config.interface';

export interface NavigationAlignment {
  hasPositionedNavigation: boolean;
  hasTopNavigation: boolean;
  hasLeftNavigation: boolean;
  hasRightNavigation: boolean;
  hasBottomNavigation: boolean;
  classes: string[];
  styles: {
    marginTop?: string;
    marginLeft?: string;
    marginRight?: string;
    marginBottom?: string;
    maxWidth?: string;
    paddingTop?: string;
    paddingLeft?: string;
    paddingRight?: string;
    paddingBottom?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NavigationAlignmentService {

  /**
   * Analyzes a UI configuration and returns navigation alignment information
   */
  analyzeNavigationAlignment(config: UIConfig | null): NavigationAlignment {
    const alignment: NavigationAlignment = {
      hasPositionedNavigation: false,
      hasTopNavigation: false,
      hasLeftNavigation: false,
      hasRightNavigation: false,
      hasBottomNavigation: false,
      classes: [],
      styles: {}
    };

    if (!config?.components) {
      return alignment;
    }

    // Find all navigation components with positioning
    const navigationComponents = config.components.filter(c => c.type === 'navigation');
    
    for (const nav of navigationComponents) {
      const position = nav.props?.position;
      if (position && ['top', 'left', 'right', 'bottom'].includes(position)) {
        alignment.hasPositionedNavigation = true;
        
        switch (position) {
          case 'top':
            alignment.hasTopNavigation = true;
            alignment.classes.push('has-top-navigation');
            break;
          case 'left':
            alignment.hasLeftNavigation = true;
            alignment.classes.push('has-left-navigation');
            break;
          case 'right':
            alignment.hasRightNavigation = true;
            alignment.classes.push('has-right-navigation');
            break;
          case 'bottom':
            alignment.hasBottomNavigation = true;
            alignment.classes.push('has-bottom-navigation');
            break;
        }
      }
    }

    if (alignment.hasPositionedNavigation) {
      alignment.classes.push('has-positioned-navigation');
    }

    // Calculate alignment styles
    this.calculateAlignmentStyles(alignment);

    return alignment;
  }

  /**
   * Gets CSS classes for navigation alignment
   */
  getNavigationClasses(config: UIConfig | null): string {
    const alignment = this.analyzeNavigationAlignment(config);
    return alignment.classes.join(' ');
  }

  /**
   * Gets CSS styles for content alignment
   */
  getContentAlignmentStyles(config: UIConfig | null): any {
    const alignment = this.analyzeNavigationAlignment(config);
    return alignment.styles;
  }

  /**
   * Gets CSS styles for canvas alignment (with padding instead of margin)
   */
  getCanvasAlignmentStyles(config: UIConfig | null): any {
    const alignment = this.analyzeNavigationAlignment(config);
    const canvasStyles: any = {};

    // Convert margin to padding for canvas
    if (alignment.styles.marginLeft) {
      canvasStyles.paddingLeft = alignment.styles.marginLeft;
    }
    if (alignment.styles.marginRight) {
      canvasStyles.paddingRight = alignment.styles.marginRight;
    }
    if (alignment.styles.marginTop) {
      canvasStyles.paddingTop = alignment.styles.marginTop;
    }
    if (alignment.styles.marginBottom) {
      canvasStyles.paddingBottom = alignment.styles.marginBottom;
    }

    return canvasStyles;
  }

  /**
   * Calculates specific alignment styles based on navigation positions
   */
  private calculateAlignmentStyles(alignment: NavigationAlignment): void {
    const navWidth = 250; // Navigation width
    const navHeight = 80; // Navigation height
    const buffer = 16; // Buffer space

    // Left navigation alignment
    if (alignment.hasLeftNavigation) {
      const totalMargin = navWidth + buffer;
      alignment.styles.marginLeft = `${totalMargin}px`;
      alignment.styles.maxWidth = `calc(100% - ${totalMargin}px)`;
    }

    // Right navigation alignment
    if (alignment.hasRightNavigation) {
      const totalMargin = navWidth + buffer;
      alignment.styles.marginRight = `${totalMargin}px`;
      alignment.styles.maxWidth = `calc(100% - ${totalMargin}px)`;
    }

    // Top navigation alignment
    if (alignment.hasTopNavigation) {
      const totalMargin = navHeight + buffer;
      alignment.styles.marginTop = `${totalMargin}px`;
    }

    // Bottom navigation alignment
    if (alignment.hasBottomNavigation) {
      const totalMargin = navHeight + buffer;
      alignment.styles.marginBottom = `${totalMargin}px`;
    }

    // Handle combined left+right navigation
    if (alignment.hasLeftNavigation && alignment.hasRightNavigation) {
      const totalMargin = (navWidth + buffer) * 2;
      alignment.styles.marginLeft = `${navWidth + buffer}px`;
      alignment.styles.marginRight = `${navWidth + buffer}px`;
      alignment.styles.maxWidth = `calc(100% - ${totalMargin}px)`;
    }
  }

  /**
   * Checks if a navigation component should be positioned
   */
  isNavigationPositioned(component: UIComponent): boolean {
    return component.type === 'navigation' && 
           component.props?.position && 
           ['top', 'left', 'right', 'bottom'].includes(component.props.position);
  }

  /**
   * Gets the positioning class for a navigation component
   */
  getNavigationPositionClass(component: UIComponent): string {
    if (!this.isNavigationPositioned(component)) {
      return '';
    }
    return `navigation-position-${component.props.position}`;
  }

  /**
   * Fixes navigation positioning to ensure it stays within screen bounds
   */
  getNavigationStyles(component: UIComponent): any {
    if (!this.isNavigationPositioned(component)) {
      return {};
    }

    const position = component.props.position;
    const styles: any = {
      position: 'fixed',
      zIndex: 1030
    };

    switch (position) {
      case 'top':
        styles.top = '64px'; // Account for app header
        styles.left = '0';
        styles.right = '0';
        styles.width = '100%';
        styles.height = '80px';
        break;
      case 'left':
        styles.top = '64px'; // Account for app header
        styles.left = '0'; // Ensure it starts at the left edge
        styles.bottom = '0';
        styles.width = '250px';
        styles.minWidth = '250px'; // Prevent shrinking
        styles.maxWidth = '250px'; // Prevent growing
        break;
      case 'right':
        styles.top = '64px'; // Account for app header
        styles.right = '0'; // Ensure it starts at the right edge
        styles.bottom = '0';
        styles.width = '250px';
        styles.minWidth = '250px';
        styles.maxWidth = '250px';
        break;
      case 'bottom':
        styles.bottom = '0';
        styles.left = '0';
        styles.right = '0';
        styles.width = '100%';
        styles.height = '80px';
        break;
    }

    return styles;
  }
}
