import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material.module';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';

export interface ToolbarAction {
  id: string;
  label: string;
  icon: string;
  tooltip: string;
  disabled?: boolean;
  separator?: boolean;
}

@Component({
  selector: 'app-designer-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, MatSliderModule],
  template: `
    <div class="designer-toolbar">
      <!-- File Operations -->
      <div class="toolbar-group">
        <button mat-icon-button (click)="onAction('new')" matTooltip="New Layout" matTooltipPosition="below">
          <mat-icon>add</mat-icon>
        </button>
        <button mat-icon-button (click)="onAction('save')" [disabled]="!hasChanges" matTooltip="Save Layout" matTooltipPosition="below">
          <mat-icon>save</mat-icon>
        </button>
        <button mat-icon-button (click)="onAction('load')" matTooltip="Load Layout" matTooltipPosition="below">
          <mat-icon>folder_open</mat-icon>
        </button>
        <button mat-icon-button (click)="onAction('export')" matTooltip="Export Configuration" matTooltipPosition="below">
          <mat-icon>download</mat-icon>
        </button>
        <mat-divider [vertical]="true"></mat-divider>
      </div>

      <!-- Edit Operations -->
      <div class="toolbar-group">
        <button mat-icon-button (click)="onAction('undo')" [disabled]="!canUndo" matTooltip="Undo" matTooltipPosition="below">
          <mat-icon>undo</mat-icon>
        </button>
        <button mat-icon-button (click)="onAction('redo')" [disabled]="!canRedo" matTooltip="Redo" matTooltipPosition="below">
          <mat-icon>redo</mat-icon>
        </button>
        <mat-divider [vertical]="true"></mat-divider>
      </div>

      <!-- View Operations -->
      <div class="toolbar-group">
        <button mat-icon-button (click)="onAction('preview')" matTooltip="Preview Layout" matTooltipPosition="below">
          <mat-icon>preview</mat-icon>
        </button>
        <button mat-icon-button [matMenuTriggerFor]="gridMenu" matTooltip="Grid Options" matTooltipPosition="below">
          <mat-icon>grid_on</mat-icon>
        </button>
        <mat-menu #gridMenu="matMenu">
          <button mat-menu-item (click)="onAction('toggle-grid')">
            <mat-icon>grid_on</mat-icon>
            <span>Toggle Grid</span>
          </button>
          <button mat-menu-item (click)="onAction('toggle-snap')">
            <mat-icon>auto_fix_high</mat-icon>
            <span>Toggle Snap to Grid</span>
          </button>
          <button mat-menu-item (click)="onAction('toggle-guides')">
            <mat-icon>straighten</mat-icon>
            <span>Toggle Guidelines</span>
          </button>
        </mat-menu>
        <mat-divider [vertical]="true"></mat-divider>
      </div>

      <!-- Tools -->
      <div class="toolbar-group">
        <button mat-icon-button [class.active]="selectedTool === 'select'" (click)="onToolSelect('select')" matTooltip="Select Tool" matTooltipPosition="below">
          <mat-icon>mouse</mat-icon>
        </button>
        <button mat-icon-button [class.active]="selectedTool === 'hand'" (click)="onToolSelect('hand')" matTooltip="Hand Tool" matTooltipPosition="below">
          <mat-icon>pan_tool</mat-icon>
        </button>
        <mat-divider [vertical]="true"></mat-divider>
      </div>

      <!-- Layout Templates -->
      <div class="toolbar-group">
        <button mat-button [matMenuTriggerFor]="templatesMenu" class="template-button">
          <mat-icon>dashboard</mat-icon>
          Templates
        </button>
        <mat-menu #templatesMenu="matMenu" class="templates-menu">
          <button mat-menu-item (click)="onAction('template-blank')">
            <mat-icon>crop_free</mat-icon>
            <span>Blank Layout</span>
          </button>
          <button mat-menu-item (click)="onAction('template-hero')">
            <mat-icon>title</mat-icon>
            <span>Hero Section</span>
          </button>
          <button mat-menu-item (click)="onAction('template-dashboard')">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </button>
          <button mat-menu-item (click)="onAction('template-form')">
            <mat-icon>assignment</mat-icon>
            <span>Form Layout</span>
          </button>
          <button mat-menu-item (click)="onAction('template-landing')">
            <mat-icon>web</mat-icon>
            <span>Landing Page</span>
          </button>
          <button mat-menu-item (click)="onAction('template-blog')">
            <mat-icon>article</mat-icon>
            <span>Blog Layout</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="onAction('load-test-config')">
            <mat-icon>science</mat-icon>
            <span>Load Test Config</span>
          </button>
        </mat-menu>
      </div>

      <!-- Spacer -->
      <div class="toolbar-spacer"></div>

      <!-- Status and Settings -->
      <div class="toolbar-group">
        <div class="status-indicator" *ngIf="hasChanges">
          <mat-icon class="unsaved-icon">circle</mat-icon>
          <span class="status-text">Unsaved changes</span>
        </div>
        <button mat-icon-button [matMenuTriggerFor]="settingsMenu" matTooltip="Settings" matTooltipPosition="below">
          <mat-icon>settings</mat-icon>
        </button>
        <mat-menu #settingsMenu="matMenu">
          <button mat-menu-item (click)="onAction('settings-auto-save')">
            <mat-icon>check_box_outline_blank</mat-icon>
            <span>Auto Save</span>
          </button>
          <button mat-menu-item (click)="onAction('settings-dark-mode')">
            <mat-icon>check_box_outline_blank</mat-icon>
            <span>Dark Mode</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="onAction('settings-preferences')">
            <mat-icon>tune</mat-icon>
            <span>Preferences</span>
          </button>
          <button mat-menu-item (click)="onAction('settings-shortcuts')">
            <mat-icon>keyboard</mat-icon>
            <span>Keyboard Shortcuts</span>
          </button>
        </mat-menu>
        <button mat-icon-button [matMenuTriggerFor]="helpMenu" matTooltip="Help" matTooltipPosition="below">
          <mat-icon>help</mat-icon>
        </button>
        <mat-menu #helpMenu="matMenu">
          <button mat-menu-item (click)="onAction('help-guide')">
            <mat-icon>book</mat-icon>
            <span>User Guide</span>
          </button>
          <button mat-menu-item (click)="onAction('help-shortcuts')">
            <mat-icon>keyboard</mat-icon>
            <span>Keyboard Shortcuts</span>
          </button>
          <button mat-menu-item (click)="onAction('help-examples')">
            <mat-icon>explore</mat-icon>
            <span>Examples</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="onAction('help-about')">
            <mat-icon>info</mat-icon>
            <span>About</span>
          </button>
        </mat-menu>
      </div>

      <!-- View Mode and Zoom Controls -->
      <div class="toolbar-group">
        <mat-button-toggle-group [value]="viewMode" (change)="onViewModeChange($event)">
          <mat-button-toggle value="desktop">
            <mat-icon>desktop_mac</mat-icon>
            Desktop
          </mat-button-toggle>
          <mat-button-toggle value="tablet">
            <mat-icon>tablet_mac</mat-icon>
            Tablet
          </mat-button-toggle>
          <mat-button-toggle value="mobile">
            <mat-icon>phone_iphone</mat-icon>
            Mobile
          </mat-button-toggle>
        </mat-button-toggle-group>
        <input type="range" min="25" max="200" step="25" [value]="zoomLevel" (input)="onZoomLevelChange($event)">
        <span class="zoom-label">{{ zoomLevel }}%</span>
      </div>
    </div>

    <!-- Keyboard Shortcuts Overlay -->
    <div class="shortcuts-overlay" *ngIf="showShortcuts" (click)="showShortcuts = false">
      <div class="shortcuts-panel" (click)="$event.stopPropagation()">
        <div class="shortcuts-header">
          <h2>Keyboard Shortcuts</h2>
          <button mat-icon-button (click)="showShortcuts = false">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="shortcuts-content">
          <div class="shortcut-group">
            <h3>File Operations</h3>
            <div class="shortcut-item">
              <span class="shortcut-keys">
                <kbd>Ctrl</kbd> + <kbd>N</kbd>
              </span>
              <span class="shortcut-description">New Layout</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-keys">
                <kbd>Ctrl</kbd> + <kbd>S</kbd>
              </span>
              <span class="shortcut-description">Save Layout</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-keys">
                <kbd>Ctrl</kbd> + <kbd>O</kbd>
              </span>
              <span class="shortcut-description">Open Layout</span>
            </div>
          </div>

          <div class="shortcut-group">
            <h3>Edit Operations</h3>
            <div class="shortcut-item">
              <span class="shortcut-keys">
                <kbd>Ctrl</kbd> + <kbd>Z</kbd>
              </span>
              <span class="shortcut-description">Undo</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-keys">
                <kbd>Ctrl</kbd> + <kbd>Y</kbd>
              </span>
              <span class="shortcut-description">Redo</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-keys">
                <kbd>Ctrl</kbd> + <kbd>D</kbd>
              </span>
              <span class="shortcut-description">Duplicate</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-keys">
                <kbd>Delete</kbd>
              </span>
              <span class="shortcut-description">Delete Selected</span>
            </div>
          </div>

          <div class="shortcut-group">
            <h3>View Operations</h3>
            <div class="shortcut-item">
              <span class="shortcut-keys">
                <kbd>Ctrl</kbd> + <kbd>+</kbd>
              </span>
              <span class="shortcut-description">Zoom In</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-keys">
                <kbd>Ctrl</kbd> + <kbd>-</kbd>
              </span>
              <span class="shortcut-description">Zoom Out</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-keys">
                <kbd>Ctrl</kbd> + <kbd>0</kbd>
              </span>
              <span class="shortcut-description">Reset Zoom</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./designer-toolbar.component.css']
})
export class DesignerToolbarComponent {
  @Input() hasChanges = false;
  @Input() canUndo = false;
  @Input() canRedo = false;
  @Input() viewMode: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  @Input() zoomLevel: number = 100;

  @Output() action = new EventEmitter<string>();
  @Output() toolSelected = new EventEmitter<string>();
  @Output() viewModeChange = new EventEmitter<'desktop' | 'tablet' | 'mobile'>();
  @Output() zoomLevelChange = new EventEmitter<number>();

  selectedTool = 'select';
  showShortcuts = false;

  onAction(actionId: string) {
    if (actionId === 'settings-shortcuts' || actionId === 'help-shortcuts') {
      this.showShortcuts = true;
      return;
    }
    this.action.emit(actionId);
  }

  onToolSelect(tool: string) {
    this.selectedTool = tool;
    this.toolSelected.emit(tool);
  }

  // Handler for view mode toggle
  onViewModeChange(event: any) {
    this.viewModeChange.emit(event.value);
  }

  // Handler for zoom slider
  onZoomLevelChange(event: any) {
    const value = parseInt(event.target.value, 10);
    this.zoomLevelChange.emit(value);
  }
}
