import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { DesignerService } from '../../services/designer.service';
import { Subject, takeUntil } from 'rxjs';
import { UIConfig, UIComponent } from '../../models/ui-config.interface';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'code' | 'config';
  metadata?: any;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.css']
})
export class AiChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('chatInput') chatInput!: ElementRef;
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly designerService = inject(DesignerService);

  chatForm: FormGroup;
  messages: ChatMessage[] = [];
  isLoading = false;
  isChatExpanded = false;
  currentConfig: UIConfig | null = null;
  selectedComponent: UIComponent | null = null;

  // Quick action suggestions
  quickActions = [
    { label: 'Add a form', command: 'add a form with name, email, and submit button' },
    { label: 'Create dashboard', command: 'create a dashboard with charts and cards' },
    { label: 'Add navigation', command: 'add horizontal navigation menu' },
    { label: 'Style components', command: 'make the layout more modern and colorful' },
    { label: 'Add grid layout', command: 'convert to 3-column grid layout' },
    { label: 'Add button row', command: 'add a row of action buttons at the bottom' }
  ];

  constructor() {
    this.chatForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit() {
    // Subscribe to current config changes if method exists
    if (this.designerService.getCurrentConfig) {
      this.designerService.getCurrentConfig()
        .pipe(takeUntil(this.destroy$))
        .subscribe(config => {
          this.currentConfig = config;
        });
    }

    // Subscribe to selected component changes if method exists
    if (this.designerService.getSelectedComponent) {
      this.designerService.getSelectedComponent()
        .pipe(takeUntil(this.destroy$))
        .subscribe(component => {
          this.selectedComponent = component;
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleChat() {
    this.isChatExpanded = !this.isChatExpanded;
    if (this.isChatExpanded) {
      setTimeout(() => {
        this.scrollToBottom();
        this.focusInput();
      }, 100);
    }
  }
  sendMessage() {
    if (this.chatForm.invalid || this.isLoading) return;

    const userMessage = this.chatForm.get('message')?.value?.trim();
    if (!userMessage) return;

    // Add user message
    this.addMessage({
      id: this.generateMessageId(),
      content: userMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    });

    // Clear input
    this.chatForm.reset();
    this.isLoading = true;

    // Simulate AI response for now
    setTimeout(() => {
      this.addMessage({
        id: this.generateMessageId(),
        content: this.generateSimpleResponse(userMessage),
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      });
      this.isLoading = false;
      setTimeout(() => this.focusInput(), 100);
    }, 1500);
  }

  // Template helper methods
  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  formatMessageContent(content: string): string {
    // Basic HTML formatting for messages
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  useQuickAction(command: string) {
    this.chatForm.patchValue({ message: command });
    this.sendMessage();
  }
  onEnterKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearSelection() {
    this.selectedComponent = null;
  }

  clearChat() {
    this.messages = [];
  }

  exportChat() {
    const chatData = {
      timestamp: new Date().toISOString(),
      messages: this.messages,
      config: this.currentConfig
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-chat-history-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  applyConfigChanges(configChanges: any) {
    if (!configChanges) return;

    try {
      // Apply the configuration changes through the designer service
      if (this.currentConfig) {
        const updatedConfig = { ...this.currentConfig, ...configChanges };
        // Apply through designer service if method exists
        if (this.designerService.updateConfig) {
          this.designerService.updateConfig(updatedConfig);
        }
      }

      this.addMessage({
        id: this.generateMessageId(),
        content: '✅ Configuration changes applied successfully!',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      });

    } catch (error) {
      console.error('Error applying config changes:', error);
      this.addMessage({
        id: this.generateMessageId(),
        content: '❌ Failed to apply configuration changes. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      });
    }
  }

  private addMessage(message: ChatMessage) {
    this.messages.push(message);
    setTimeout(() => this.scrollToBottom(), 100);
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  private focusInput() {
    if (this.chatInput) {
      this.chatInput.nativeElement.focus();
    }
  }
  private generateMessageId(): string {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  }

  private generateSimpleResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    if (message.includes('form')) {
      return "I can help you create forms! Try asking me to add specific form fields like name, email, or phone number.";
    } else if (message.includes('dashboard')) {
      return "I can help you build dashboards with charts, metrics, and data tables. What kind of dashboard would you like?";
    } else if (message.includes('navigation') || message.includes('menu')) {
      return "I can add navigation menus to your UI. Would you like a horizontal nav bar or a sidebar navigation?";
    } else if (message.includes('button')) {
      return "I can add various types of buttons - primary, secondary, or action buttons. Where would you like them placed?";
    } else if (message.includes('layout') || message.includes('grid')) {
      return "I can help you create responsive grid layouts. How many columns would you like in your grid?";
    } else if (message.includes('style') || message.includes('color')) {
      return "I can help you style your components with modern colors and themes. What style are you looking for?";
    } else {
      return "I'm here to help you build your UI! You can ask me to add forms, dashboards, navigation, buttons, or modify layouts and styling.";
    }
  }
}
