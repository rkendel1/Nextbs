// src/types/embed.ts
export interface DesignTokens {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
  padding: string;
  maxWidth: string;
  position: 'inline' | 'fixed-bottom-right' | 'fixed-bottom-left';
}

export interface EmbedConfig {
  widgetId: string;
  contentType: 'form' | 'chat' | 'notification' | 'custom';
  apiEndpoint: string;
  designTokens: DesignTokens;
  enableAnalytics?: boolean;
  customCSS?: string;
}

export interface WidgetContent {
  widgetId: string;
  type: string;
  timestamp: string;
  title?: string;
  message?: string;
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
}

export interface FormSubmission {
  name: string;
  email: string;
  message: string;
  [key: string]: any;
}

export interface Widget {
  id: string;
  widgetId: string;
  name: string;
  contentType: WidgetType;
  designTokens: DesignTokens;
  apiEndpoint?: string;
  customCSS?: string;
  customJS?: string;
  isActive: boolean;
  isPublic: boolean;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  shortCodes?: ShortCode[];
}

export interface ShortCode {
  id: string;
  code: string;
  config: string; // base64 encoded
  widgetId: string;
  clicks: number;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type WidgetType = 'CHAT' | 'FORM' | 'NOTIFICATION' | 'CUSTOM';

export function mapContentType(contentType: string): WidgetType {
  const map: Record<string, WidgetType> = {
    chat: 'CHAT',
    form: 'FORM',
    notification: 'NOTIFICATION',
    custom: 'CUSTOM'
  };
  return map[contentType.toLowerCase()] || 'CUSTOM';
}

// src/lib/embed-utils.ts

export function generateEmbedCode(config: EmbedConfig, baseUrl: string): string {
  const encodedConfig = btoa(JSON.stringify(config));
  
  return `<script>
(function(w,d,s,o,f,js,fjs){
w['EmbedWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
}(window,document,'script','embed','${baseUrl}/embed.js'));
embed('init','${config.widgetId}','${encodedConfig}');
</script>`;
}

export function validateEmbedConfig(config: Partial<EmbedConfig>): string[] {
  const errors: string[] = [];

  if (!config.widgetId || config.widgetId.trim() === '') {
    errors.push('Widget ID is required');
  }

  if (!config.contentType) {
    errors.push('Content type is required');
  }

  if (!config.designTokens) {
    errors.push('Design tokens are required');
  } else {
    const tokens = config.designTokens;
    
    if (!tokens.primaryColor || !isValidColor(tokens.primaryColor)) {
      errors.push('Valid primary color is required');
    }
    
    if (!tokens.backgroundColor || !isValidColor(tokens.backgroundColor)) {
      errors.push('Valid background color is required');
    }
    
    if (!tokens.textColor || !isValidColor(tokens.textColor)) {
      errors.push('Valid text color is required');
    }
  }

  return errors;
}

function isValidColor(color: string): boolean {
  // Check if it's a hex color
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return true;
  }
  
  // Check if it's rgb/rgba
  if (/^rgba?\(/.test(color)) {
    return true;
  }
  
  // Check if it's a named color (basic check)
  const namedColors = ['red', 'blue', 'green', 'white', 'black', 'yellow', 'purple', 'orange', 'pink', 'gray', 'grey'];
  if (namedColors.includes(color.toLowerCase())) {
    return true;
  }
  
  return false;
}

export function generateWidgetPreview(config: EmbedConfig): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Widget Preview - ${config.widgetId}</title>
  <style>
    body {
      font-family: ${config.designTokens.fontFamily};
      padding: 40px;
      background: #f5f5f5;
    }
  </style>
</head>
<body>
  <h1>Widget Preview</h1>
  <p>This is how your widget will appear on external websites.</p>
  
  ${generateEmbedCode(config, window.location.origin)}
  
</body>
</html>
  `;
}