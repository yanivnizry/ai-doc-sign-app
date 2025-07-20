import * as FileSystem from 'expo-file-system';
import mammoth from 'mammoth';

export interface FormField {
  id: string;
  type: 'text' | 'checkbox' | 'signature' | 'radio' | 'date' | 'email' | 'phone' | 'number' | 'select';
  label: string;
  value?: string;
  required: boolean;
  position: { x: number; y: number; width: number; height: number };
  page: number;
  confidence: number;
  suggestions?: string[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
  };
}

export interface Question {
  id: string;
  text: string;
  type: 'yes_no' | 'multiple_choice' | 'text' | 'date' | 'number' | 'rating';
  options?: string[];
  position: { x: number; y: number; width: number; height: number };
  page: number;
  confidence: number;
  value?: string;
  aiSuggestion?: string;
}

export interface DocumentAnalysis {
  documentInfo: {
    name: string;
    size: number;
    pages: number;
    type: string;
    language?: string;
    category?: string;
  };
  formFields: FormField[];
  questions: Question[];
  signatures: {
    id: string;
    label: string;
    position: { x: number; y: number; width: number; height: number };
    page: number;
    required: boolean;
  }[];
  processingTime: number;
  confidence: number;
  content?: string;
  summary?: string;
  keyInsights?: string[];
  riskAssessment?: {
    level: 'low' | 'medium' | 'high';
    issues: string[];
    recommendations: string[];
  };
}

export interface SignatureData {
  id: string;
  name: string;
  type: 'typed' | 'image' | 'drawing';
  data: string;
  isDefault: boolean;
}

export interface AIProcessingResult {
  success: boolean;
  analysis: DocumentAnalysis;
  filledFields: FormField[];
  answeredQuestions: Question[];
  signedDocumentUri?: string;
  processingTime: number;
  errors?: string[];
  warnings?: string[];
}

// Add fetchWithTimeout helper OUTSIDE the class
function fetchWithTimeout(resource: RequestInfo, options: any = {}) {
  const { timeout = 15000 } = options;
  return Promise.race([
    fetch(resource, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
}

class AIService {
  private userProfile: Record<string, any> = {};

  constructor() {
    this.loadUserProfile();
  }

  /**
   * Load user profile for AI-powered form filling
   */
  private async loadUserProfile() {
    // In real app, load from secure storage
    this.userProfile = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main St, City, State 12345',
      dateOfBirth: '1990-01-01',
      occupation: 'Software Engineer',
      company: 'Tech Corp',
      experience: '5 years',
      education: 'Bachelor\'s Degree',
      skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      preferences: {
        salary_range: '$70,000 - $90,000',
        work_type: 'Full-time',
        location: 'Remote',
        benefits: ['Health Insurance', '401k', 'PTO']
      }
    };
  }

  /**
   * Extract text content from DOCX file with enhanced processing
   */
  private async extractDocxContent(fileUri: string): Promise<{ content: string; metadata: any }> {
    try {
      const fileBuffer = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const arrayBuffer = Uint8Array.from(atob(fileBuffer), c => c.charCodeAt(0)).buffer;
      
      // Use mammoth with UTF-8 encoding support
      const result = await mammoth.extractRawText({ 
        arrayBuffer
      });
      
      // Ensure content is properly encoded as UTF-8
      let content = result.value;
      
      // Handle Hebrew and other Unicode characters properly
      if (content.includes('ל') || content.includes('ב') || content.includes('א')) {
        console.log('Hebrew content detected, ensuring proper UTF-8 encoding');
        // Hebrew content should already be UTF-8 from mammoth, no need for additional encoding
      }
      
      // Extract additional metadata
      const metadata = {
        wordCount: content.split(/\s+/).length,
        paragraphCount: content.split('\n\n').length,
        hasTables: content.includes('|') || content.includes('\t'),
        hasLists: content.includes('•') || content.includes('-'),
        language: this.detectLanguage(content)
      };
      
      return { content, metadata };
    } catch (error) {
      console.error('Error extracting DOCX content:', error);
      throw new Error('Failed to extract DOCX content');
    }
  }

  /**
   * Detect document language using character analysis
   */
  private detectLanguage(text: string): string {
    // Enhanced language detection
    const hebrewChars = /[\u0590-\u05FF]/;
    const arabicChars = /[\u0600-\u06FF]/;
    const chineseChars = /[\u4E00-\u9FFF]/;
    const japaneseChars = /[\u3040-\u309F\u30A0-\u30FF]/;
    const koreanChars = /[\uAC00-\uD7AF]/;
    const cyrillicChars = /[\u0400-\u04FF]/;
    const thaiChars = /[\u0E00-\u0E7F]/;
    const devanagariChars = /[\u0900-\u097F]/;
    
    if (hebrewChars.test(text)) return 'he';
    if (arabicChars.test(text)) return 'ar';
    if (chineseChars.test(text)) return 'zh';
    if (japaneseChars.test(text)) return 'ja';
    if (koreanChars.test(text)) return 'ko';
    if (cyrillicChars.test(text)) return 'ru';
    if (thaiChars.test(text)) return 'th';
    if (devanagariChars.test(text)) return 'hi';
    
    return 'en';
  }

  /**
   * Real AI analysis using Local LLM (Ollama)
   */
  private async analyzeContentWithAI(content: string, fileType: string): Promise<any> {
    const llmUrl = process.env.EXPO_PUBLIC_LOCAL_LLM_URL;
    const model = process.env.EXPO_PUBLIC_LOCAL_LLM_MODEL || 'llama3';
    const maxTokens = parseInt(process.env.EXPO_PUBLIC_LOCAL_LLM_MAX_TOKENS || '3000'); // Maps to num_predict in Ollama

    if (!llmUrl) {
      console.warn('Local LLM URL not configured. Using fallback analysis.');
      return this.getFallbackAnalysis(content, fileType);
    }

    try {
      console.log('Making real AI API call to Local LLM...');
      console.log('LLM URL:', llmUrl);
      console.log('Model:', model);
      const apiStart = Date.now();
      // Reduce prompt size for debugging
      const promptContent = content.substring(0, 200);
      const response = await fetchWithTimeout(`${llmUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: `Analyze this ${fileType.toUpperCase()} document and extract the following information. Respond ONLY with a valid JSON object matching this schema and no other text:

{
  "language": "en",
  "category": "legal",
  "summary": "Brief document summary",
  "keyInsights": ["insight1", "insight2"],
  "riskAssessment": {
    "level": "medium",
    "issues": ["issue1", "issue2"],
    "recommendations": ["rec1", "rec2"]
  },
  "formFields": [
    {
      "id": "1",
      "label": "Field Label",
      "type": "text",
      "required": true,
      "position": { "x": 100, "y": 150, "width": 200, "height": 30 },
      "page": 1,
      "confidence": 0.95,
      "suggestions": ["suggestion1", "suggestion2"]
    }
  ],
  "questions": [...],
  "signatures": [...]
}

For each form field, be sure to include the position (x, y) and block size (width, height) in the 'position' object. Do not omit these fields.

Document content to analyze:
${promptContent}`,
          stream: false,
          temperature: 0.0,
          top_p: 0.9,
          num_predict: maxTokens
        }),
        timeout: 90000
      });
      const apiEnd = Date.now();
      console.log(`LLM API call took ${(apiEnd - apiStart) / 1000}s`);

      // Type check for timeout or error
      if (!(response instanceof Response)) {
        throw new Error('LLM API call failed or timed out');
      }
      if (!response.ok) {
        throw new Error(`Local LLM API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.response;
      
      console.log('Local LLM Response received:', aiResponse.substring(0, 200) + '...');
      console.log('Full LLM Response:', aiResponse);
      
      try {
        // Try to extract JSON from the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse Local LLM response:', parseError);
        console.log('Raw response:', aiResponse);
        return this.getFallbackAnalysis(content, fileType);
      }
    } catch (error) {
      console.error('Real Local LLM analysis error:', error);
      return this.getFallbackAnalysis(content, fileType);
    }
  }

  /**
   * Fallback analysis when AI is not available
   */
  private getFallbackAnalysis(content: string, fileType: string): any {
    console.log('Using fallback analysis for', fileType);
    
    const language = this.detectLanguage(content);
    const wordCount = content.split(/\s+/).length;
    
    // Enhanced fallback analysis with language-specific content
    const hasHebrew = content.includes('בלינק') || content.includes('פינטק') || content.includes('ויתור');
    const hasArabic = content.includes('عربي') || content.includes('وثيقة');
    const hasChinese = content.includes('中文') || content.includes('文档');
    const hasJapanese = content.includes('日本語') || content.includes('文書');
    
    let category = 'general_form';
    let insights = ['Document contains form fields requiring user input'];
    
    if (hasHebrew) {
      category = 'legal_waiver';
      insights = [
        'Hebrew legal document detected',
        'Contains waiver and legal clauses',
        'Requires careful review before signing'
      ];
    } else if (hasArabic) {
      category = 'arabic_document';
      insights = [
        'Arabic document detected',
        'May contain legal or business terms',
        'Consider translation if needed'
      ];
    } else if (hasChinese) {
      category = 'chinese_document';
      insights = [
        'Chinese document detected',
        'May contain business or legal content',
        'Consider translation if needed'
      ];
    } else if (hasJapanese) {
      category = 'japanese_document';
      insights = [
        'Japanese document detected',
        'May contain business or legal content',
        'Consider translation if needed'
      ];
    }
    
    return {
      language,
      category,
      summary: `${language.toUpperCase()} document analysis with approximately ${wordCount} words`,
      keyInsights: insights,
      riskAssessment: {
        level: 'medium',
        issues: ['Document requires careful review'],
        recommendations: ['Review all terms before signing', 'Verify personal information']
      },
      formFields: this.extractFormFieldsFromContent(content),
      questions: this.extractQuestionsFromContent(content),
      signatures: this.getGenericSignatures(language)
    };
  }

  /**
   * Test Local LLM connection
   */
  async testLLMConnection(): Promise<{ success: boolean; message: string; responseTime?: number }> {
    const llmUrl = process.env.EXPO_PUBLIC_LOCAL_LLM_URL;
    const model = process.env.EXPO_PUBLIC_LOCAL_LLM_MODEL || 'llama3';

    if (!llmUrl) {
      return {
        success: false,
        message: 'Local LLM URL not configured. Please set EXPO_PUBLIC_LOCAL_LLM_URL in your .env file.'
      };
    }

    try {
      console.log('Testing Local LLM connection...');
      console.log('LLM URL:', llmUrl);
      console.log('Model:', model);
      
      const startTime = Date.now();
      
      // First test if the server is reachable
      try {
        const healthCheck = await fetch(`${llmUrl}/api/tags`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!healthCheck.ok) {
          return {
            success: false,
            message: `Server not reachable: ${healthCheck.status} - ${healthCheck.statusText}`,
            responseTime: Date.now() - startTime
          };
        }
        
        console.log('Server health check passed');
      } catch (healthError) {
        return {
          success: false,
          message: `Cannot reach LLM server at ${llmUrl}. Make sure Ollama is running with: OLLAMA_HOST=0.0.0.0:11434 ollama serve`,
          responseTime: Date.now() - startTime
        };
      }
      
      // Now test the actual model
      const response = await fetch(`${llmUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: 'Hello, this is a test. Please respond with "Connection successful"',
          stream: false,
          temperature: 0.0,
          num_predict: 50
        })
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          message: `Model test failed: ${response.status} - ${response.statusText}`,
          responseTime
        };
      }

      const data = await response.json();
      console.log('LLM test response:', data.response);
      
      return {
        success: true,
        message: `Local LLM connection successful! Model: ${model}`,
        responseTime
      };
    } catch (error) {
      console.error('LLM connection test error:', error);
      return {
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}. Check if Ollama is running and accessible from your device.`
      };
    }
  }

  /**
   * Extract form fields from document content
   */
  private extractFormFieldsFromContent(content: string): FormField[] {
    const fields: FormField[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Look for common field patterns
      if (trimmedLine.includes('_____') || trimmedLine.includes('________')) {
        fields.push({
          id: `field_${index}`,
          type: 'text',
          label: this.extractFieldLabel(trimmedLine),
          required: true,
          position: { x: 100, y: 150 + (index * 30), width: 200, height: 30 },
          page: 1,
          confidence: 0.8
        });
      } else if (trimmedLine.includes('[ ]') || trimmedLine.includes('☐')) {
        fields.push({
          id: `checkbox_${index}`,
          type: 'checkbox',
          label: this.extractFieldLabel(trimmedLine),
          required: false,
          position: { x: 100, y: 150 + (index * 30), width: 20, height: 20 },
          page: 1,
          confidence: 0.9
        });
      } else if (trimmedLine.toLowerCase().includes('signature') || 
                 trimmedLine.toLowerCase().includes('חתימה') ||
                 trimmedLine.toLowerCase().includes('توقيع')) {
        fields.push({
          id: `signature_${index}`,
          type: 'signature',
          label: this.extractFieldLabel(trimmedLine),
          required: true,
          position: { x: 100, y: 150 + (index * 30), width: 150, height: 50 },
          page: 1,
          confidence: 0.95
        });
      }
    });
    
    return fields;
  }

  /**
   * Extract field label from line content
   */
  private extractFieldLabel(line: string): string {
    // Remove common field indicators
    let label = line
      .replace(/[_\s]+$/, '') // Remove trailing underscores and spaces
      .replace(/^[_\s]+/, '') // Remove leading underscores and spaces
      .replace(/\[ \]/, '') // Remove checkbox
      .replace(/☐/, '') // Remove checkbox
      .trim();
    
    // If label is empty, provide a generic one
    if (!label) {
      label = 'Field';
    }
    
    return label;
  }

  /**
   * Extract questions from document content
   */
  private extractQuestionsFromContent(content: string): Question[] {
    const questions: Question[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Look for question patterns
      if (trimmedLine.includes('?') || 
          trimmedLine.toLowerCase().includes('do you') ||
          trimmedLine.toLowerCase().includes('have you') ||
          trimmedLine.toLowerCase().includes('are you')) {
        questions.push({
          id: `question_${index}`,
          text: trimmedLine,
          type: 'yes_no',
          position: { x: 100, y: 200 + (index * 30), width: 300, height: 30 },
          page: 1,
          confidence: 0.8,
          aiSuggestion: 'Please answer based on your situation'
        });
      }
    });
    
    return questions;
  }

  /**
   * Get generic signatures based on language
   */
  private getGenericSignatures(language: string): any[] {
    const signatureLabels = {
      he: 'חתימה',
      ar: 'توقيع',
      zh: '签名',
      ja: '署名',
      ko: '서명',
      ru: 'Подпись',
      th: 'ลายเซ็น',
      hi: 'हस्ताक्षर'
    };

    const label = signatureLabels[language as keyof typeof signatureLabels] || 'Signature';
    
    return [
      {
        id: '1',
        label,
        required: true,
        position: { x: 100, y: 500, width: 150, height: 50 },
        page: 1
      }
    ];
  }

  /**
   * Analyze document with AI
   */
  async analyzeDocument(fileUri: string, fileType: 'pdf' | 'docx'): Promise<DocumentAnalysis> {
    const startTime = Date.now();
    
    try {
      console.log(`Starting AI analysis of ${fileType.toUpperCase()} document...`);
      
      let content = '';
      
      if (fileType === 'docx') {
        const result = await this.extractDocxContent(fileUri);
        content = result.content;
      } else {
        // For PDF, we'll use a simplified text extraction
        // In a real implementation, you'd use a PDF parsing library
        content = 'PDF document content - form fields and signatures detected';
      }
      
      // Get AI analysis
      const aiAnalysis = await this.analyzeContentWithAI(content, fileType);
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      const analysis: DocumentAnalysis = {
        documentInfo: {
          name: fileUri.split('/').pop() || 'document',
          size: fileInfo.exists ? (fileInfo as any).size || 0 : 0,
          pages: 1, // Simplified
          type: fileType.toUpperCase(),
          language: aiAnalysis.language,
          category: aiAnalysis.category
        },
        formFields: aiAnalysis.formFields || [],
        questions: aiAnalysis.questions || [],
        signatures: aiAnalysis.signatures || [],
        processingTime: (Date.now() - startTime) / 1000,
        confidence: 0.85,
        content,
        summary: aiAnalysis.summary,
        keyInsights: aiAnalysis.keyInsights,
        riskAssessment: aiAnalysis.riskAssessment
      };
      const endTime = Date.now();
      console.log(`Total document analysis time: ${(endTime - startTime) / 1000}s`);
      console.log('Document analysis completed:', analysis.formFields.length, 'fields found');
      console.log('Detected fields:', analysis.formFields.map(f => ({ label: f.label, type: f.type })));
      return analysis;
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw new Error(`Failed to analyze ${fileType.toUpperCase()} document`);
    }
  }

  /**
   * Fill form fields with AI suggestions
   */
  async fillFormFields(fields: FormField[], userData: Record<string, any> = {}): Promise<FormField[]> {
    console.log('Filling form fields with AI suggestions...');
    
    return fields.map(field => {
      const filledField = { ...field };
      
      // Try to find a value from user data first
      const userValue = this.findUserValue(field.label, userData);
      if (userValue) {
        filledField.value = userValue;
        return filledField;
      }
      
      // Generate AI suggestion based on field type and label
      filledField.value = this.generateFieldValue(field);
      
      return filledField;
    });
  }

  /**
   * Find user value for a field
   */
  private findUserValue(fieldLabel: string, userData: Record<string, any>): string | null {
    const label = fieldLabel.toLowerCase();
    
    // Direct matches
    if (userData.name && (label.includes('name') || label.includes('שם'))) {
      return userData.name;
    }
    if (userData.email && (label.includes('email') || label.includes('אימייל'))) {
      return userData.email;
    }
    if (userData.phone && (label.includes('phone') || label.includes('טלפון'))) {
      return userData.phone;
    }
    if (userData.address && (label.includes('address') || label.includes('כתובת'))) {
      return userData.address;
    }
    
    // Check for partial matches
    for (const [key, value] of Object.entries(userData)) {
      if (typeof value === 'string' && label.includes(key.toLowerCase())) {
        return value;
      }
    }
    
    return null;
  }

  /**
   * Generate field value based on type and label
   */
  private generateFieldValue(field: FormField): string {
    const label = field.label.toLowerCase();
    
    switch (field.type) {
      case 'text':
        if (label.includes('name')) return this.userProfile.name;
        if (label.includes('email')) return this.userProfile.email;
        if (label.includes('phone')) return this.userProfile.phone;
        if (label.includes('address')) return this.userProfile.address;
        if (label.includes('company')) return this.userProfile.company;
        if (label.includes('occupation')) return this.userProfile.occupation;
        return 'Sample text';
        
      case 'email':
        return this.userProfile.email;
        
      case 'phone':
        return this.userProfile.phone;
        
      case 'date':
        return new Date().toISOString().split('T')[0];
        
      case 'number':
        return '42';
        
      case 'signature':
        return this.userProfile.name;
        
      default:
        return 'Sample value';
    }
  }

  /**
   * Answer questions with AI suggestions
   */
  async answerQuestions(questions: Question[], userData: Record<string, any> = {}): Promise<Question[]> {
    console.log('Answering questions with AI suggestions...');
    
    return questions.map(question => {
      const answeredQuestion = { ...question };
      
      // Generate AI suggestion based on question type and content
      answeredQuestion.value = this.generateQuestionAnswer(question);
      
      return answeredQuestion;
    });
  }

  /**
   * Generate answer for a question
   */
  private generateQuestionAnswer(question: Question): string {
    const text = question.text.toLowerCase();
    
    switch (question.type) {
      case 'yes_no':
        if (text.includes('experience') || text.includes('skill')) return 'Yes';
        if (text.includes('criminal') || text.includes('conviction')) return 'No';
        return 'Yes';
        
      case 'multiple_choice':
        return question.options?.[0] || 'Option 1';
        
      case 'text':
        return 'Sample answer based on question context';
        
      case 'date':
        return new Date().toISOString().split('T')[0];
        
      case 'number':
        return '5';
        
      case 'rating':
        return '4';
        
      default:
        return 'Sample answer';
    }
  }

  /**
   * Validate form data
   */
  async validateForm(fields: FormField[]): Promise<{ isValid: boolean; errors: string[]; warnings: string[]; suggestions: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    fields.forEach(field => {
      if (field.required && !field.value) {
        errors.push(`${field.label} is required`);
      }
      
      if (field.value) {
        // Email validation
        if (field.type === 'email' && !this.isValidEmail(field.value)) {
          errors.push(`${field.label} must be a valid email address`);
        }
        
        // Phone validation
        if (field.type === 'phone' && !this.isValidPhone(field.value)) {
          warnings.push(`${field.label} may not be in the correct format`);
        }
        
        // Length validation
        if (field.validation?.minLength && field.value.length < field.validation.minLength) {
          errors.push(`${field.label} must be at least ${field.validation.minLength} characters`);
        }
        
        if (field.validation?.maxLength && field.value.length > field.validation.maxLength) {
          warnings.push(`${field.label} is longer than recommended`);
        }
      }
    });
    
    if (errors.length === 0 && warnings.length === 0) {
      suggestions.push('All fields look good!');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Get default signatures
   */
  async getDefaultSignatures(): Promise<SignatureData[]> {
    return [
      {
        id: 'default_1',
        name: 'John Doe',
        type: 'typed',
        data: 'John Doe',
        isDefault: true
      },
      {
        id: 'default_2',
        name: 'Digital Signature',
        type: 'image',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        isDefault: true
      }
    ];
  }

  /**
   * Parse signature vectors from drawing data
   */
  private parseSignatureVectors(data: string): number[][] {
    try {
      // If data is already in vector format, return it
      if (data.startsWith('[') && data.includes('[')) {
        return JSON.parse(data);
      }
      // For now, return empty vectors
      return [];
    } catch (error) {
      console.error('Error parsing signature vectors:', error);
      return [];
    }
  }

  /**
   * Save processed document to file system
   */
  private async saveProcessedDocument(base64Data: string, fileType: 'pdf' | 'docx'): Promise<string> {
    try {
      const fileName = `processed_document_${Date.now()}.${fileType}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Remove data URL prefix if present
      const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');
      
      await FileSystem.writeAsStringAsync(fileUri, base64Content, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      console.log('Processed document saved:', fileUri);
      return fileUri;
    } catch (error) {
      console.error('Error saving processed document:', error);
      throw error;
    }
  }

  /**
   * Apply signatures to document
   */
  async applySignatures(
    documentUri: string,
    signatures: SignatureData[],
    signatureAreas: any[],
    fileType: 'pdf' | 'docx' = 'pdf'
  ): Promise<string> {
    // Mock signature application
    console.log('Applying signatures to document...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return documentUri;
  }

  /**
   * Complete document processing with AI
   */
  async processDocument(
    fileUri: string,
    fileType: 'pdf' | 'docx',
    userData: Record<string, any> = {}
  ): Promise<AIProcessingResult> {
    try {
      console.log('Starting document processing with real modification...');
      console.log('User data received:', Object.keys(userData));
      Object.keys(userData).forEach(key => {
        if (key.startsWith('signature_')) {
          console.log(`Signature key ${key}:`, typeof userData[key], userData[key]?.substring?.(0, 50) + '...');
        }
      });
      
      const analysis = await this.analyzeDocument(fileUri, fileType);
      const filledFields = await this.fillFormFields(analysis.formFields, userData);
      const answeredQuestions = await this.answerQuestions(analysis.questions, userData);
      
      // Convert filled fields to a simple format for processing
      const fieldData = filledFields
        .filter(field => field.value)
        .map(field => ({
          name: field.label || 'Unnamed Field',
          value: field.value || '',
          type: field.type === 'signature' ? 'signature' : 'text',
          x: field.position?.x,
          y: field.position?.y,
          page: field.page
        }));
      
      // Extract signature data from field values and create SignatureData objects
      const signatures: SignatureData[] = [];
      filledFields.forEach(field => {
        if (field.type === 'signature' && field.value) {
          // Check if the value is base64 signature data
          if (field.value.startsWith('data:image/') || field.value.startsWith('data:application/')) {
            signatures.push({
              id: field.id,
              name: field.label || 'Signature',
              type: 'image',
              data: field.value, // This is the base64 signature data
              isDefault: false
            });
          } else {
            // If it's just text, treat it as typed signature
            signatures.push({
              id: field.id,
              name: field.label || 'Signature',
              type: 'typed',
              data: field.value,
              isDefault: false
            });
          }
        }
      });
      
      // Also add signatures from the analysis.signatures array
      analysis.signatures.forEach(sig => {
        // Check if we already have a signature for this ID
        const existingSignature = signatures.find(s => s.id === sig.id);
        if (!existingSignature) {
          // Add a default signature for this position
          signatures.push({
            id: sig.id,
            name: sig.label || 'Signature',
            type: 'typed',
            data: 'John Doe', // Default signature text
            isDefault: true
          });
        }
      });
      
      // If no signatures found in fields, use user signatures or default signatures
      if (signatures.length === 0) {
        if (userData.signatures && Array.isArray(userData.signatures) && userData.signatures.length > 0) {
          // Safely extract user signatures to avoid circular references
          try {
            const userSignatures = userData.signatures.map((sig: any) => ({
              id: sig.id || 'user_sig',
              name: sig.name || 'User Signature',
              type: sig.type || 'typed',
              data: sig.data || 'User',
              isDefault: false
            }));
            signatures.push(...userSignatures);
            console.log('Using user signatures:', userSignatures.length);
          } catch (error) {
            console.error('Error processing user signatures:', error);
            // Fallback to default signatures
            const defaultSignatures = await this.getDefaultSignatures();
            signatures.push(...defaultSignatures);
            console.log('Using default signatures:', defaultSignatures.length);
          }
        } else {
          // Use default signatures as fallback
          const defaultSignatures = await this.getDefaultSignatures();
          signatures.push(...defaultSignatures);
          console.log('Using default signatures:', defaultSignatures.length);
        }
      }
      
      console.log('Signatures to apply:', signatures.length);
      signatures.forEach(sig => {
        console.log(`- ${sig.name} (${sig.type}): ${sig.data.substring(0, 50)}...`);
      });
      
      // Convert answered questions to the format expected by document processor
      const questionData = answeredQuestions
        .filter(q => q.value)
        .map(q => ({
          id: q.id,
          text: q.text,
          value: q.value || '',
          type: q.type
        }));
      
      // Call the backend API for document processing
      let signedDocumentUri: string | undefined = fileUri;
      try {
        console.log('Calling backend API for document processing...');
        
        // Create signature requests from actual signatures
        const signatureRequests: any[] = [];
        
        // Add signatures from filled fields
        filledFields.forEach((field, index) => {
          if (field.type === 'signature' && field.value) {
            const signature = signatures.find(s => s.id === field.id);
            if (signature) {
              // Convert signature data to points format
              let points: any[] = [];
              
              if (signature.type === 'drawing' && signature.data) {
                try {
                  // Parse vector data if it's a drawing
                  const vectorData = JSON.parse(signature.data);
                  if (Array.isArray(vectorData)) {
                    points = vectorData.map((point: any, i: number) => ({
                      x: point.x || i * 10,
                      y: point.y || 0,
                      pressure: point.pressure || 1.0,
                      timestamp: Date.now() + i * 10
                    }));
                  }
                } catch (e) {
                  console.warn('Failed to parse signature vector data:', e);
                }
              }
              
              // If no points from vector data, create default points
              if (points.length === 0) {
                points = [
                  { x: 0, y: 0, pressure: 1.0, timestamp: Date.now() },
                  { x: 50, y: 10, pressure: 1.0, timestamp: Date.now() + 100 },
                  { x: 100, y: 0, pressure: 1.0, timestamp: Date.now() + 200 },
                  { x: 100, y: 20, pressure: 1.0, timestamp: Date.now() + 300 },
                  { x: 0, y: 20, pressure: 1.0, timestamp: Date.now() + 400 }
                ];
              }
              
              signatureRequests.push({
                points,
                x: field.position?.x || 100 + (index * 150),
                y: field.position?.y || 200,
                width: field.position?.width || 120,
                height: field.position?.height || 40,
                color: '#000000',
                page: field.page || 0
              });
            }
          }
        });
        
        // Also add signatures from userData (from analysis.signatures)
        if (analysis.signatures && analysis.signatures.length > 0) {
          analysis.signatures.forEach((sig, index) => {
            // Check if we already have a signature request for this signature
            const existingRequest = signatureRequests.find(req => 
              req.x === sig.position?.x && req.y === sig.position?.y
            );
            
            if (!existingRequest) {
              // Look for signature value in userData
              const signatureKey = `signature_${sig.id}`;
              const signatureValue = userData[signatureKey];
              
              if (signatureValue) {
                console.log(`Found signature value for ${sig.label}:`, signatureValue.substring(0, 50) + '...');
                
                // Convert signature data to points format
                let points: any[] = [];
                
                try {
                  // Try to parse as JSON (for drawing signatures)
                  const parsedData = JSON.parse(signatureValue);
                  if (Array.isArray(parsedData)) {
                    points = parsedData.map((point: any, i: number) => ({
                      x: point.x || i * 10,
                      y: point.y || 0,
                      pressure: point.pressure || 1.0,
                      timestamp: Date.now() + i * 10
                    }));
                  }
                } catch (e) {
                  // If not JSON, it might be base64 image data
                  console.log('Signature data is not JSON, treating as image data');
                }
                
                // If no points from parsing, create default points
                if (points.length === 0) {
                  points = [
                    { x: 0, y: 0, pressure: 1.0, timestamp: Date.now() },
                    { x: 50, y: 10, pressure: 1.0, timestamp: Date.now() + 100 },
                    { x: 100, y: 0, pressure: 1.0, timestamp: Date.now() + 200 },
                    { x: 100, y: 20, pressure: 1.0, timestamp: Date.now() + 300 },
                    { x: 0, y: 20, pressure: 1.0, timestamp: Date.now() + 400 }
                  ];
                }
                
                signatureRequests.push({
                  points,
                  x: sig.position?.x || 100 + (index * 150),
                  y: sig.position?.y || 200,
                  width: sig.position?.width || 120,
                  height: sig.position?.height || 40,
                  color: '#000000',
                  page: sig.page || 0
                });
              } else {
                console.log(`No signature value found for ${sig.label} (key: ${signatureKey})`);
              }
            }
          });
        }
        
        // If no signatures from fields, add default signatures
        if (signatureRequests.length === 0) {
          console.log('No signatures found in fields, adding default signature');
          signatureRequests.push({
            points: [
              { x: 0, y: 0, pressure: 1.0, timestamp: Date.now() },
              { x: 50, y: 10, pressure: 1.0, timestamp: Date.now() + 100 },
              { x: 100, y: 0, pressure: 1.0, timestamp: Date.now() + 200 },
              { x: 100, y: 20, pressure: 1.0, timestamp: Date.now() + 300 },
              { x: 0, y: 20, pressure: 1.0, timestamp: Date.now() + 400 }
            ],
            x: 100,
            y: 200,
            width: 120,
            height: 40,
            color: '#000000',
            page: 0
          });
        }
        
        console.log('Created signature requests:', signatureRequests.length);
        signatureRequests.forEach((req, index) => {
          console.log(`Signature ${index + 1}:`, {
            points: req.points.length,
            position: { x: req.x, y: req.y, width: req.width, height: req.height },
            page: req.page
          });
        });

        // Create form data for file upload
        const formData = new FormData();
        formData.append('document', {
          uri: fileUri,
          type: fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          name: fileUri.split('/').pop() || `document.${fileType}`
        } as any);
        // Add signatures to form data as a JSON string array
        let signaturesJson: string;
        try {
          // Check for circular references in signatureRequests
          const seen = new WeakSet();
          const isCircular = (obj: any): boolean => {
            if (obj && typeof obj === 'object') {
              if (seen.has(obj)) return true;
              seen.add(obj);
              for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                  if (isCircular(obj[key])) return true;
                }
              }
            }
            return false;
          };
          if (isCircular(signatureRequests)) {
            console.warn('Circular reference detected in signatureRequests, sending empty array to backend.');
            signaturesJson = JSON.stringify([]);
          } else {
            signaturesJson = JSON.stringify(signatureRequests);
          }
          formData.append('signatures', signaturesJson);
          console.log('Signatures JSON created successfully, length:', signaturesJson.length);
        } catch (jsonError) {
          console.error('Error creating signatures JSON:', jsonError);
          // Fallback: send empty signatures array
          signaturesJson = JSON.stringify([]);
          formData.append('signatures', signaturesJson);
        }
        console.log('Sending signatures to backend, JSON length:', signaturesJson.length);

        const backendUrl = process.env.EXPO_PUBLIC_BACKEND_API_URL;
        const response = await fetch(`${backendUrl}/api/add-signature`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.ok) {
          console.log('Backend response received, processing document...');
          // Get the response as an array buffer (binary data)
          const arrayBuffer = await response.arrayBuffer();
          console.log('Response buffer size:', arrayBuffer.byteLength);
          // Convert array buffer to base64
          const uint8Array = new Uint8Array(arrayBuffer);
          const base64String = btoa(String.fromCharCode(...uint8Array));
          // Create data URL
          const mimeType = fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          const dataUrl = `data:${mimeType};base64,${base64String}`;
          // Save the processed document
          signedDocumentUri = await this.saveProcessedDocument(dataUrl, fileType);
          console.log('Document processed successfully by backend:', signedDocumentUri);
        } else {
          // Try to parse backend error response as JSON
          let errorText = await response.text();
          try {
            const errorJson = JSON.parse(errorText);
            console.warn('Backend processing failed:', response.status, errorJson.error, errorJson.details || '');
          } catch (e) {
            console.warn('Backend processing failed:', response.status, errorText);
          }
          // Check if it's a Hebrew encoding error
          if (errorText.includes('WinAnsi cannot encode') && errorText.includes('ל')) {
            console.log('Hebrew encoding error detected, using fallback processing');
            // For Hebrew documents, we'll create a simple text-based version
            signedDocumentUri = await this.createHebrewDocumentFallback(fileUri, fileType, signatures, analysis);
          } else {
            signedDocumentUri = fileUri;
          }
        }
      } catch (error) {
        console.error('Error calling backend API:', error);
        signedDocumentUri = fileUri; // Fallback to original file
      }
      
      return {
        success: true,
        analysis,
        filledFields,
        answeredQuestions,
        signedDocumentUri,
        processingTime: analysis.processingTime,
        errors: [],
        warnings: []
      };
    } catch (error) {
      console.error('Error in complete document processing:', error);
      throw new Error(`Failed to process ${fileType.toUpperCase()} document`);
    }
  }

  /**
   * Fallback processing for Hebrew documents
   */
  private async processDocumentFallback(
    fileUri: string,
    fileType: 'pdf' | 'docx',
    signatures: SignatureData[],
    analysis: DocumentAnalysis
  ): Promise<string> {
    console.log('Applying fallback processing for Hebrew document...');
    
    // For Hebrew, we'll try to re-extract content and re-analyze
    let content = '';
    try {
      const result = await this.extractDocxContent(fileUri);
      content = result.content;
    } catch (error) {
      console.error('Error re-extracting Hebrew content for fallback:', error);
      throw new Error('Failed to re-extract Hebrew content for fallback processing');
    }

    const llmUrl = process.env.EXPO_PUBLIC_LOCAL_LLM_URL;
    const model = process.env.EXPO_PUBLIC_LOCAL_LLM_MODEL || 'llama3';
    const maxTokens = parseInt(process.env.EXPO_PUBLIC_LOCAL_LLM_MAX_TOKENS || '3000');

    if (!llmUrl) {
      console.warn('Local LLM URL not configured for fallback. Cannot process Hebrew document.');
      return fileUri;
    }

    try {
      console.log('Making real AI API call to Local LLM for fallback analysis...');
      console.log('LLM URL:', llmUrl);
      console.log('Model:', model);
      
      const response = await fetch(`${llmUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: `Analyze this ${fileType.toUpperCase()} document and extract the following information. Respond ONLY with a valid JSON object matching this schema and no other text:

{
  "language": "en",
  "category": "legal",
  "summary": "Brief document summary",
  "keyInsights": ["insight1", "insight2"],
  "riskAssessment": {
    "level": "medium",
    "issues": ["issue1", "issue2"],
    "recommendations": ["rec1", "rec2"]
  },
  "formFields": [
    {
      "id": "1",
      "label": "Field Label",
      "type": "text",
      "required": true,
      "position": { "x": 100, "y": 150, "width": 200, "height": 30 },
      "page": 1,
      "confidence": 0.95,
      "suggestions": ["suggestion1", "suggestion2"]
    }
  ],
  "questions": [...],
  "signatures": [...]
}

For each form field, be sure to include the position (x, y) and block size (width, height) in the 'position' object. Do not omit these fields.

Document content to analyze:
${content.substring(0, 2000)}`,
          stream: false,
          temperature: 0.0,
          top_p: 0.9,
          num_predict: maxTokens
        })
      });

      if (!response.ok) {
        throw new Error(`Local LLM API error for fallback: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.response;
      
      console.log('Local LLM Response received for fallback:', aiResponse.substring(0, 200) + '...');
      console.log('Full LLM Response for fallback:', aiResponse);
      
      try {
        // Try to extract JSON from the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in fallback response');
        }
      } catch (parseError) {
        console.error('Failed to parse Local LLM response for fallback:', parseError);
        console.log('Raw response for fallback:', aiResponse);
        return fileUri; // Fallback to original file on parsing error
      }
    } catch (error) {
      console.error('Real Local LLM analysis error for fallback:', error);
      return fileUri; // Fallback to original file on API call error
    }
  }

  /**
   * Create a simple fallback document for Hebrew content
   */
  private async createHebrewDocumentFallback(
    fileUri: string,
    fileType: 'pdf' | 'docx',
    signatures: SignatureData[],
    analysis: DocumentAnalysis
  ): Promise<string> {
    console.log('Creating Hebrew document fallback...');
    
    try {
      // Extract content from original document
      let content = '';
      if (fileType === 'docx') {
        const result = await this.extractDocxContent(fileUri);
        content = result.content;
      }
      
      // Create a simple text-based document with signatures
      const fallbackContent = this.createHebrewTextDocument(content, signatures, analysis);
      
      // Save as a text file for now (we can enhance this later)
      const fileName = `hebrew_document_${Date.now()}.txt`;
      const fallbackFileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fallbackFileUri, fallbackContent, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      console.log('Hebrew fallback document created:', fallbackFileUri);
      return fallbackFileUri;
    } catch (error) {
      console.error('Error creating Hebrew fallback:', error);
      return fileUri; // Return original file if fallback fails
    }
  }
  
  /**
   * Create a text-based document for Hebrew content
   */
  private createHebrewTextDocument(content: string, signatures: SignatureData[], analysis: DocumentAnalysis): string {
    let document = '';
    
    // Add header
    document += '=== AI DOC SIGN - HEBREW DOCUMENT ===\n\n';
    
    // Add original content (sanitized)
    if (content) {
      document += '=== ORIGINAL CONTENT ===\n';
      document += content.substring(0, 1000) + (content.length > 1000 ? '...' : '') + '\n\n';
    }
    
    // Add form fields
    if (analysis.formFields.length > 0) {
      document += '=== FORM FIELDS ===\n';
      analysis.formFields.forEach((field, index) => {
        document += `${index + 1}. ${field.label || 'Unnamed Field'} (${field.type})\n`;
        if (field.value) {
          document += `   Value: ${field.value}\n`;
        }
        document += '\n';
      });
    }
    
    // Add signatures
    if (signatures.length > 0) {
      document += '=== SIGNATURES ===\n';
      signatures.forEach((sig, index) => {
        document += `${index + 1}. ${sig.name} (${sig.type})\n`;
        if (sig.type === 'typed') {
          document += `   Signature: ${sig.data}\n`;
        } else {
          document += `   Signature: [DRAWN SIGNATURE]\n`;
        }
        document += '\n';
      });
    }
    
    // Add questions
    if (analysis.questions.length > 0) {
      document += '=== QUESTIONS ===\n';
      analysis.questions.forEach((question, index) => {
        document += `${index + 1}. ${question.text}\n`;
        if (question.value) {
          document += `   Answer: ${question.value}\n`;
        }
        document += '\n';
      });
    }
    
    // Add footer
    document += '=== PROCESSED BY AI DOC SIGN ===\n';
    document += `Processing Date: ${new Date().toLocaleString()}\n`;
    document += `Document Type: ${analysis.documentInfo.type}\n`;
    document += `Language: ${analysis.documentInfo.language || 'Hebrew'}\n`;
    
    return document;
  }
}

// Export singleton instance
export const aiService = new AIService(); 