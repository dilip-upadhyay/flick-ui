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
  selector: 'app-ai-chat-embedded',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './ai-chat-embedded.component.html',
  styleUrls: ['./ai-chat-embedded.component.css']
})
export class AiChatEmbeddedComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('chatInput') chatInput!: ElementRef;
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly designerService = inject(DesignerService);

  chatForm: FormGroup;
  messages: ChatMessage[] = [];
  isLoading = false;
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
    // Subscribe to designer service updates
    this.designerService.getCurrentConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe((config: UIConfig) => {
        this.currentConfig = config;
      });

    this.designerService.getSelectedComponent()
      .pipe(takeUntil(this.destroy$))
      .subscribe((component: UIComponent | null) => {
        this.selectedComponent = component;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    if (this.chatForm.valid && !this.isLoading) {
      const messageText = this.chatForm.get('message')?.value?.trim();
      if (messageText) {
        this.sendMessage(messageText);
      }
    }
  }

  onEnterKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  sendMessage(content: string) {
    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };
    
    this.messages.push(userMessage);
    this.chatForm.get('message')?.setValue('');
    this.isLoading = true;

    // Scroll to bottom
    setTimeout(() => this.scrollToBottom(), 100);

    // Simulate AI processing
    setTimeout(() => {
      this.processAIResponse(content);
    }, 1000);
  }

  private processAIResponse(userMessage: string) {
    // Simple AI response simulation
    let aiResponse = this.generateAIResponse(userMessage);
    
    const aiMessage: ChatMessage = {
      id: this.generateMessageId(),
      content: aiResponse,
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    };

    this.messages.push(aiMessage);
    this.isLoading = false;
    
    setTimeout(() => this.scrollToBottom(), 100);
  }

  private generateAIResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    if (message.includes('form')) {
      return "I can help you create a form! I'll add a form component with the fields you specified. This will include proper validation and styling.";
    } else if (message.includes('dashboard')) {
      return "Let me create a dashboard layout for you. I'll add cards, charts, and data visualization components arranged in a responsive grid.";
    } else if (message.includes('navigation')) {
      return "I'll add a navigation component to your layout. This will include menu items and proper routing structure.";
    } else if (message.includes('style') || message.includes('color')) {
      return "I can help you improve the styling! I'll update the components with modern colors, better spacing, and improved typography.";
    } else if (message.includes('grid') || message.includes('layout')) {
      return "I'll convert your layout to use a responsive grid system. This will make your components organize better across different screen sizes.";
    } else if (message.includes('button')) {
      return "I'll add action buttons to your layout. These will be properly styled and positioned for the best user experience.";
    } else {
      return "I understand you want to modify your UI components. Could you be more specific about what you'd like me to add or change? For example, you can ask me to add forms, create dashboards, modify layouts, or improve styling.";
    }
  }

  useQuickAction(action: any) {
    this.chatForm.get('message')?.setValue(action.command);
    this.onSubmit();
  }

  clearChat() {
    this.messages = [];
  }

  exportChat() {
    const chatData = {
      messages: this.messages,
      exportDate: new Date(),
      config: this.currentConfig
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-export-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }
}
