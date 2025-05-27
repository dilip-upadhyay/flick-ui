import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { UIConfig } from '../../models/ui-config.interface';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-config-preview',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  template: `
    <div class="config-preview">
      <div class="preview-header">
        <div class="header-left">
          <mat-icon>code</mat-icon>
          <span class="preview-title">Configuration JSON</span>
          <mat-chip-set>
            <mat-chip [highlighted]="isValidJson">
              <mat-icon>{{ isValidJson ? 'check_circle' : 'error' }}</mat-icon>
              {{ isValidJson ? 'Valid' : 'Invalid' }}
            </mat-chip>
          </mat-chip-set>
        </div>
        
        <div class="header-actions">
          <button mat-icon-button 
                  (click)="formatJson()"
                  matTooltip="Format JSON"
                  [disabled]="!isValidJson">
            <mat-icon>auto_fix_high</mat-icon>
          </button>
          
          <button mat-icon-button 
                  (click)="copyToClipboard()"
                  matTooltip="Copy to Clipboard"
                  [disabled]="!isValidJson">
            <mat-icon>content_copy</mat-icon>
          </button>
          
          <button mat-icon-button 
                  (click)="downloadConfig()"
                  matTooltip="Download JSON"
                  [disabled]="!isValidJson">
            <mat-icon>download</mat-icon>
          </button>
          
          <button mat-icon-button 
                  (click)="showImportDialog = true"
                  matTooltip="Import Configuration">
            <mat-icon>upload</mat-icon>
          </button>
          
          <button mat-icon-button 
                  [class.active]="editMode"
                  (click)="toggleEditMode()"
                  matTooltip="Toggle Edit Mode">
            <mat-icon>{{ editMode ? 'visibility' : 'edit' }}</mat-icon>
          </button>
        </div>
      </div>

      <div class="preview-content">
        <!-- Read-only display -->
        <div class="json-display" *ngIf="!editMode" #jsonDisplay>
          <pre><code [innerHTML]="highlightedJson"></code></pre>
        </div>

        <!-- Editable textarea -->
        <div class="json-editor" *ngIf="editMode">
          <textarea 
            #jsonEditor
            class="json-textarea"
            [(ngModel)]="editableJson"
            (input)="onJsonEdit($event)"
            (blur)="validateAndApplyJson()"
            placeholder="Paste or edit your JSON configuration here..."
            spellcheck="false">
          </textarea>
          
          <div class="editor-footer">
            <div class="editor-info">
              <span class="line-count">Lines: {{ getLineCount() }}</span>
              <span class="char-count">Characters: {{ editableJson.length }}</span>
            </div>
            
            <div class="editor-actions">
              <button mat-stroked-button 
                      (click)="resetJson()"
                      color="warn">
                Reset
              </button>
              <button mat-raised-button 
                      (click)="applyJson()"
                      color="primary"
                      [disabled]="!isValidJson">
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error display -->
      <div class="error-panel" *ngIf="jsonError">
        <mat-icon class="error-icon">error</mat-icon>
        <div class="error-content">
          <div class="error-title">JSON Syntax Error</div>
          <div class="error-message">{{ jsonError }}</div>
        </div>
        <button mat-icon-button (click)="jsonError = null">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>

    <!-- Import Dialog -->
    <div class="import-overlay" *ngIf="showImportDialog" (click)="closeImportDialog()">
      <div class="import-dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h2>Import Configuration</h2>
          <button mat-icon-button (click)="closeImportDialog()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        
        <div class="dialog-content">
          <mat-tab-group>
            <!-- Paste JSON Tab -->
            <mat-tab label="Paste JSON">
              <div class="tab-content">
                <textarea 
                  class="import-textarea"
                  [(ngModel)]="importJson"
                  placeholder="Paste your JSON configuration here..."
                  rows="12">
                </textarea>
                
                <div class="import-actions">
                  <button mat-stroked-button (click)="closeImportDialog()">
                    Cancel
                  </button>
                  <button mat-raised-button 
                          color="primary"
                          (click)="importFromText()"
                          [disabled]="!importJson.trim()">
                    Import
                  </button>
                </div>
              </div>
            </mat-tab>

            <!-- Upload File Tab -->
            <mat-tab label="Upload File">
              <div class="tab-content">
                <div class="file-upload-area" 
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave($event)"
                     (drop)="onFileDrop($event)"
                     [class.drag-over]="isDragOver"
                     (click)="fileInput.click()">
                  <mat-icon class="upload-icon">cloud_upload</mat-icon>
                  <h3>Drop JSON file here or click to browse</h3>
                  <p>Supported formats: .json</p>
                  
                  <input 
                    #fileInput 
                    type="file" 
                    accept=".json"
                    (change)="onFileSelected($event)"
                    style="display: none;">
                </div>
                
                <div class="selected-file" *ngIf="selectedFile">
                  <mat-icon>insert_drive_file</mat-icon>
                  <span>{{ selectedFile.name }}</span>
                  <button mat-icon-button (click)="selectedFile = null">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                
                <div class="import-actions">
                  <button mat-stroked-button (click)="closeImportDialog()">
                    Cancel
                  </button>
                  <button mat-raised-button 
                          color="primary"
                          (click)="importFromFile()"
                          [disabled]="!selectedFile">
                    Import File
                  </button>
                </div>
              </div>
            </mat-tab>

            <!-- Examples Tab -->
            <mat-tab label="Examples">
              <div class="tab-content">
                <div class="examples-grid">
                  <div class="example-card" 
                       *ngFor="let example of configExamples"
                       (click)="loadExample(example)">
                    <mat-icon>{{ example.icon }}</mat-icon>
                    <h4>{{ example.name }}</h4>
                    <p>{{ example.description }}</p>
                    <button mat-button color="primary">Load Example</button>
                  </div>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./config-preview.component.css']
})
export class ConfigPreviewComponent implements OnInit, OnDestroy {
  @Input() config: UIConfig | null = null;
  @Output() configImported = new EventEmitter<UIConfig>();

  @ViewChild('jsonDisplay') jsonDisplay!: ElementRef;
  @ViewChild('jsonEditor') jsonEditor!: ElementRef;

  private destroy$ = new Subject<void>();

  editMode = false;
  editableJson = '';
  highlightedJson = '';
  isValidJson = true;
  jsonError: string | null = null;

  // Import dialog
  showImportDialog = false;
  importJson = '';
  selectedFile: File | null = null;
  isDragOver = false;

  configExamples = [
    {
      name: 'Simple Layout',
      description: 'Basic container with text and button',
      icon: 'crop_free',
      config: {
        type: 'layout',
        components: [
          {
            id: 'container-1',
            type: 'container',
            properties: { title: 'Welcome' },
            children: [
              {
                id: 'text-1',
                type: 'text',
                properties: { content: 'Hello, World!' }
              },
              {
                id: 'button-1',
                type: 'button',
                properties: { text: 'Get Started', color: 'primary' }
              }
            ]
          }
        ]
      }
    },
    {
      name: 'Dashboard Layout',
      description: 'Grid layout with cards and charts',
      icon: 'dashboard',
      config: {
        type: 'layout',
        components: [
          {
            id: 'grid-1',
            type: 'grid',
            properties: { columns: 2, gap: '16px' },
            children: [
              {
                id: 'card-1',
                type: 'card',
                properties: { title: 'Statistics' }
              },
              {
                id: 'card-2',
                type: 'card',
                properties: { title: 'Performance' }
              }
            ]
          }
        ]
      }
    },
    {
      name: 'Form Layout',
      description: 'Contact form with validation',
      icon: 'assignment',
      config: {
        type: 'layout',
        components: [
          {
            id: 'form-1',
            type: 'form',
            properties: {
              title: 'Contact Us',
              fields: [
                { label: 'Name', type: 'text', required: true },
                { label: 'Email', type: 'email', required: true },
                { label: 'Message', type: 'textarea', required: true }
              ]
            }
          }
        ]
      }
    }
  ];

  ngOnInit() {
    this.updateJsonDisplay();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges() {
    this.updateJsonDisplay();
  }

  private updateJsonDisplay() {
    if (this.config) {
      try {
        this.editableJson = JSON.stringify(this.config, null, 2);
        this.highlightedJson = this.highlightJson(this.editableJson);
        this.isValidJson = true;
        this.jsonError = null;
      } catch (error) {
        this.isValidJson = false;
        this.jsonError = 'Failed to serialize configuration';
      }
    } else {
      this.editableJson = '';
      this.highlightedJson = '';
    }
  }

  private highlightJson(jsonString: string): string {
    return jsonString
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
        (match) => {
          let cls = 'number';
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'key';
            } else {
              cls = 'string';
            }
          } else if (/true|false/.test(match)) {
            cls = 'boolean';
          } else if (/null/.test(match)) {
            cls = 'null';
          }
          return `<span class="json-${cls}">${match}</span>`;
        });
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      setTimeout(() => {
        if (this.jsonEditor) {
          this.jsonEditor.nativeElement.focus();
        }
      });
    }
  }

  onJsonEdit(event: any) {
    this.editableJson = event.target.value;
    this.validateJson();
  }

  private validateJson() {
    try {
      JSON.parse(this.editableJson);
      this.isValidJson = true;
      this.jsonError = null;
    } catch (error) {
      this.isValidJson = false;
      this.jsonError = error instanceof Error ? error.message : 'Invalid JSON syntax';
    }
  }

  validateAndApplyJson() {
    this.validateJson();
    if (this.isValidJson) {
      this.applyJson();
    }
  }

  applyJson() {
    if (!this.isValidJson) return;

    try {
      const newConfig = JSON.parse(this.editableJson);
      this.configImported.emit(newConfig);
      this.editMode = false;
    } catch (error) {
      this.jsonError = error instanceof Error ? error.message : 'Failed to parse JSON';
    }
  }

  resetJson() {
    this.updateJsonDisplay();
    this.editMode = false;
  }

  formatJson() {
    if (!this.isValidJson) return;

    try {
      const parsed = JSON.parse(this.editableJson);
      this.editableJson = JSON.stringify(parsed, null, 2);
      this.highlightedJson = this.highlightJson(this.editableJson);
    } catch (error) {
      console.error('Failed to format JSON:', error);
    }
  }

  async copyToClipboard() {
    if (!this.isValidJson) return;

    try {
      await navigator.clipboard.writeText(this.editableJson);
      // Could show a snackbar notification here
      console.log('Configuration copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }

  downloadConfig() {
    if (!this.isValidJson || !this.config) return;

    const blob = new Blob([this.editableJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `layout-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getLineCount(): number {
    return this.editableJson.split('\n').length;
  }

  // Import dialog methods
  closeImportDialog() {
    this.showImportDialog = false;
    this.importJson = '';
    this.selectedFile = null;
    this.isDragOver = false;
  }

  importFromText() {
    if (!this.importJson.trim()) return;

    try {
      const config = JSON.parse(this.importJson);
      this.configImported.emit(config);
      this.closeImportDialog();
    } catch (error) {
      this.jsonError = error instanceof Error ? error.message : 'Invalid JSON in import text';
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      this.selectedFile = file;
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/json') {
        this.selectedFile = file;
      }
    }
  }

  importFromFile() {
    if (!this.selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const config = JSON.parse(content);
        this.configImported.emit(config);
        this.closeImportDialog();
      } catch (error) {
        this.jsonError = error instanceof Error ? error.message : 'Failed to parse uploaded file';
      }
    };
    reader.readAsText(this.selectedFile);
  }

  loadExample(example: any) {
    this.configImported.emit(example.config);
    this.closeImportDialog();
  }
}
