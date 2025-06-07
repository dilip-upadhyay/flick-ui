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
  templateUrl: './designer-toolbar.component.html',
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
