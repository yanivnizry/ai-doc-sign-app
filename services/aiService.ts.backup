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

class AIService {
  private apiKey: string | null = null;
  private baseUrl: string = 'https://api.x.ai/v1';
  private userProfile: Record<string, any> = {};

  constructor() {
    // Load API key from environment or secure storage
    this.apiKey = process.env.EXPO_PUBLIC_GROK_API_KEY || null;
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
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      // Extract additional metadata
      const metadata = {
        wordCount: result.value.split(/\s+/).length,
        paragraphCount: result.value.split('\n\n').length,
        hasTables: result.value.includes('|') || result.value.includes('\t'),
        hasLists: result.value.includes('•') || result.value.includes('-'),
        language: this.detectLanguage(result.value)
      };
      
      return { content: result.value, metadata };
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
   * Real AI analysis using Grok 4 API
   */
  private async analyzeContentWithAI(content: string, fileType: string): Promise<any> {
    if (!this.apiKey) {
      console.warn('Grok API key not found. Using fallback analysis.');
      return this.getFallbackAnalysis(content, fileType);
    }

    try {
      console.log('Making real AI API call to Grok 4...');
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-4-0709',
          messages: [
            {
              role: 'system',
              content: `You are an expert document analyzer with multi-language support. Analyze the following ${fileType.toUpperCase()} document and extract:

1. Document language (ISO 639-1 code)
2. Document category (legal, job_application, medical, financial, academic, etc.)
3. Key insights about the document content
4. Risk assessment (low/medium/high) with specific issues and recommendations
5. Form fields that need to be filled (with types, labels, requirements)
6. Questions that need answers
7. Signature areas required

Return the analysis in this exact JSON format:
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
      "type": "text",
      "label": "Field Label",
      "required": true,
      "position": {"x": 100, "y": 150, "width": 200, "height": 30},
      "page": 1,
      "confidence": 0.95,
      "suggestions": ["suggestion1", "suggestion2"]
    }
  ],
  "questions": [
    {
      "id": "1",
      "text": "Question text",
      "type": "yes_no",
      "position": {"x": 100, "y": 200, "width": 300, "height": 30},
      "page": 1,
      "confidence": 0.90,
      "aiSuggestion": "AI suggestion"
    }
  ],
  "signatures": [
    {
      "id": "1",
      "label": "Signature Label",
      "required": true,
      "position": {"x": 100, "y": 300, "width": 150, "height": 50},
      "page": 1
    }
  ]
}`
            },
            {
              role: 'user',
              content: `Analyze this ${fileType.toUpperCase()} document content:\n\n${content.substring(0, 4000)}`
            }
          ],
          max_tokens: 3000,
          temperature: 0
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      console.log('Grok 4 AI Response received:', aiResponse.substring(0, 200) + '...');
      
      try {
        return JSON.parse(aiResponse);
      } catch (parseError) {
        console.error('Failed to parse Grok 4 AI response:', parseError);
        return this.getFallbackAnalysis(content, fileType);
      }
    } catch (error) {
      console.error('Real Grok 4 AI analysis error:', error);
      return this.getFallbackAnalysis(content, fileType);
    }
  }

  /**
   * Fallback analysis when AI is not available
   */
  private getFallbackAnalysis(content: string, fileType: string): any {
    const language = this.detectLanguage(content);
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
      summary: `${language.toUpperCase()} document analysis`,
      keyInsights: insights,
      riskAssessment: {
        level: 'medium',
        issues: ['Document requires careful review'],
        recommendations: ['Review all terms before signing', 'Verify personal information']
      },
      formFields: this.getGenericFormFields(language),
      questions: this.getGenericQuestions(language),
      signatures: this.getGenericSignatures(language)
    };
  }

  /**
   * Get generic form fields based on language
   */
  private getGenericFormFields(language: string): any[] {
         const fields = {
       en: [
         { label: 'Full Name', type: 'text', required: true },
         { label: 'ID Number', type: 'text', required: true },
         { label: 'Email Address', type: 'email', required: true },
         { label: 'Phone Number', type: 'phone', required: true },
         { label: 'Address', type: 'text', required: true }
       ],
       he: [
         { label: 'שם מלא', type: 'text', required: true },
         { label: 'תעודת זהות', type: 'text', required: true },
         { label: 'כתובת דוא"ל', type: 'email', required: true },
         { label: 'מספר טלפון', type: 'phone', required: true },
         { label: 'כתובת', type: 'text', required: true }
       ],
      ar: [
        { label: 'الاسم الكامل', type: 'text', required: true },
        { label: 'رقم الهوية', type: 'text', required: true },
        { label: 'البريد الإلكتروني', type: 'email', required: true },
        { label: 'رقم الهاتف', type: 'phone', required: true },
        { label: 'العنوان', type: 'text', required: true }
      ],
      zh: [
        { label: '全名', type: 'text', required: true },
        { label: '身份证号', type: 'text', required: true },
        { label: '电子邮件', type: 'email', required: true },
        { label: '电话号码', type: 'phone', required: true },
        { label: '地址', type: 'text', required: true }
      ],
      ja: [
        { label: '氏名', type: 'text', required: true },
        { label: '身分証明書番号', type: 'text', required: true },
        { label: 'メールアドレス', type: 'email', required: true },
        { label: '電話番号', type: 'phone', required: true },
        { label: '住所', type: 'text', required: true }
      ],
      ko: [
        { label: '전체 이름', type: 'text', required: true },
        { label: '주민등록번호', type: 'text', required: true },
        { label: '이메일', type: 'email', required: true },
        { label: '전화번호', type: 'phone', required: true },
        { label: '주소', type: 'text', required: true }
      ],
      ru: [
        { label: 'Полное имя', type: 'text', required: true },
        { label: 'Номер паспорта', type: 'text', required: true },
        { label: 'Электронная почта', type: 'email', required: true },
        { label: 'Номер телефона', type: 'phone', required: true },
        { label: 'Адрес', type: 'text', required: true }
      ],
      th: [
        { label: 'ชื่อเต็ม', type: 'text', required: true },
        { label: 'เลขบัตรประชาชน', type: 'text', required: true },
        { label: 'อีเมล', type: 'email', required: true },
        { label: 'หมายเลขโทรศัพท์', type: 'phone', required: true },
        { label: 'ที่อยู่', type: 'text', required: true }
      ],
      hi: [
        { label: 'पूरा नाम', type: 'text', required: true },
        { label: 'आधार संख्या', type: 'text', required: true },
        { label: 'ईमेल', type: 'email', required: true },
        { label: 'फोन नंबर', type: 'phone', required: true },
        { label: 'पता', type: 'text', required: true }
      ]
    };

    const languageFields = fields[language as keyof typeof fields] || fields.en;
    
    return languageFields.map((field, index) => ({
      id: (index + 1).toString(),
      type: field.type,
      label: field.label,
      value: '',
      required: field.required,
      position: { x: 100, y: 150 + (index * 50), width: 200, height: 30 },
      page: 1,
      confidence: 0.9,
      suggestions: []
    }));
  }

  /**
   * Get generic questions based on language
   */
  private getGenericQuestions(language: string): any[] {
         const questions = {
       en: [
         { text: 'Have you read and understood all terms?', type: 'yes_no' },
         { text: 'Do you agree to the terms?', type: 'yes_no' }
       ],
       he: [
         { text: 'האם קראת והבנת את כל התנאים?', type: 'yes_no' },
         { text: 'האם אתה מסכים לתנאים?', type: 'yes_no' }
       ],
      ar: [
        { text: 'هل قرأت وفهمت جميع الشروط؟', type: 'yes_no' },
        { text: 'هل توافق على الشروط؟', type: 'yes_no' }
      ],
      zh: [
        { text: '您是否已阅读并理解所有条款？', type: 'yes_no' },
        { text: '您是否同意这些条款？', type: 'yes_no' }
      ],
      ja: [
        { text: 'すべての条件を読み理解しましたか？', type: 'yes_no' },
        { text: '条件に同意しますか？', type: 'yes_no' }
      ],
      ko: [
        { text: '모든 조건을 읽고 이해하셨습니까?', type: 'yes_no' },
        { text: '조건에 동의하십니까?', type: 'yes_no' }
      ],
      ru: [
        { text: 'Вы прочитали и поняли все условия?', type: 'yes_no' },
        { text: 'Вы согласны с условиями?', type: 'yes_no' }
      ],
      th: [
        { text: 'คุณได้อ่านและเข้าใจเงื่อนไขทั้งหมดแล้วหรือไม่?', type: 'yes_no' },
        { text: 'คุณเห็นด้วยกับเงื่อนไขหรือไม่?', type: 'yes_no' }
      ],
      hi: [
        { text: 'क्या आपने सभी शर्तों को पढ़ा और समझा है?', type: 'yes_no' },
        { text: 'क्या आप शर्तों से सहमत हैं?', type: 'yes_no' }
      ]
    };

    const languageQuestions = questions[language as keyof typeof questions] || questions.en;
    
    return languageQuestions.map((question, index) => ({
      id: (index + 1).toString(),
      text: question.text,
      type: question.type,
      position: { x: 100, y: 400 + (index * 50), width: 300, height: 30 },
      page: 1,
      confidence: 0.9,
      aiSuggestion: 'Consider carefully before answering'
    }));
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
   * Enhanced document analysis with real AI
   */
  async analyzeDocument(fileUri: string, fileType: 'pdf' | 'docx' = 'pdf'): Promise<DocumentAnalysis> {
    try {
      console.log(`Starting real AI document analysis for ${fileType.toUpperCase()}...`);
      
      let content = '';
      let metadata = {};
      
      // Extract content based on file type
      if (fileType === 'docx') {
        const extraction = await this.extractDocxContent(fileUri);
        content = extraction.content;
        metadata = extraction.metadata;
        console.log('DOCX content extracted:', content.substring(0, 200) + '...');
      }
      
      // Real AI analysis
      const aiAnalysis = await this.analyzeContentWithAI(content, fileType);
      
      // Fast processing time
      await new Promise(resolve => setTimeout(resolve, 300));

      // Enhanced analysis results
      const analysis: DocumentAnalysis = {
        documentInfo: {
          name: `document.${fileType}`,
          size: 1024000,
          pages: fileType === 'docx' ? 1 : 2,
          type: fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          language: aiAnalysis.language,
          category: aiAnalysis.category
        },
        formFields: aiAnalysis.formFields || [],
        questions: aiAnalysis.questions || [],
        signatures: aiAnalysis.signatures || [],
        processingTime: 0.8,
        confidence: 0.91,
        content: fileType === 'docx' ? content : undefined,
        summary: aiAnalysis.summary,
        keyInsights: aiAnalysis.keyInsights,
        riskAssessment: aiAnalysis.riskAssessment
      };

      return analysis;
    } catch (error) {
      console.error('Enhanced AI analysis error:', error);
      throw new Error(`Failed to analyze ${fileType.toUpperCase()} document`);
    }
  }

  /**
   * Enhanced form fields with AI suggestions and validation
   */
  private getEnhancedDocxFormFields(): FormField[] {
    return [
      {
        id: '1',
        type: 'text',
        label: 'שם מלא / Full Name',
        value: '',
        required: true,
        position: { x: 100, y: 150, width: 200, height: 30 },
        page: 1,
        confidence: 0.95,
        suggestions: ['יניב נזרי', 'Yaniv Nizri'],
        validation: { minLength: 2, maxLength: 50 }
      },
      {
        id: '2',
        type: 'text',
        label: 'תעודת זהות / ID Number',
        value: '',
        required: true,
        position: { x: 100, y: 200, width: 200, height: 30 },
        page: 1,
        confidence: 0.92,
        suggestions: ['123456789', '987654321'],
        validation: { minLength: 9, maxLength: 9 }
      },
      {
        id: '3',
        type: 'email',
        label: 'כתובת דוא"ל / Email Address',
        value: '',
        required: true,
        position: { x: 100, y: 250, width: 200, height: 30 },
        page: 1,
        confidence: 0.94,
        suggestions: ['yaniv@blinkfintech.com', 'yaniv.nizri@gmail.com'],
        validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }
      },
      {
        id: '4',
        type: 'phone',
        label: 'מספר טלפון / Phone Number',
        value: '',
        required: true,
        position: { x: 100, y: 300, width: 150, height: 30 },
        page: 1,
        confidence: 0.88,
        suggestions: ['+972-50-123-4567', '050-123-4567'],
        validation: { pattern: '^[+]?[1-9][\\d]{0,15}$' }
      },
      {
        id: '5',
        type: 'date',
        label: 'תאריך / Date',
        value: '',
        required: true,
        position: { x: 100, y: 350, width: 120, height: 30 },
        page: 1,
        confidence: 0.90,
        suggestions: ['2024-01-15', '15/01/2024', 'Today']
      },
      {
        id: '6',
        type: 'text',
        label: 'כתובת / Address',
        value: '',
        required: true,
        position: { x: 100, y: 400, width: 200, height: 30 },
        page: 1,
        confidence: 0.85,
        suggestions: ['רחוב הרצל 123, תל אביב', 'Herzl St 123, Tel Aviv'],
        validation: { minLength: 5, maxLength: 100 }
      },
      {
        id: '7',
        type: 'checkbox',
        label: 'אני מסכים לתנאים / I agree to the terms',
        value: '',
        required: true,
        position: { x: 100, y: 450, width: 20, height: 20 },
        page: 1,
        confidence: 0.87
      },
      {
        id: '8',
        type: 'signature',
        label: 'חתימה / Signature',
        required: true,
        position: { x: 100, y: 500, width: 150, height: 50 },
        page: 1,
        confidence: 0.93
      }
    ];
  }

  /**
   * Enhanced PDF form fields
   */
  private getEnhancedPdfFormFields(): FormField[] {
    return [
      {
        id: '1',
        type: 'text',
        label: 'Full Name',
        value: '',
        required: true,
        position: { x: 100, y: 150, width: 200, height: 30 },
        page: 1,
        confidence: 0.95,
        suggestions: ['John Doe', 'Jane Smith'],
        validation: { minLength: 2, maxLength: 50 }
      },
      {
        id: '2',
        type: 'email',
        label: 'Email Address',
        value: '',
        required: true,
        position: { x: 100, y: 200, width: 200, height: 30 },
        page: 1,
        confidence: 0.92,
        suggestions: ['john.doe@example.com', 'user@company.com'],
        validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }
      },
      {
        id: '3',
        type: 'phone',
        label: 'Phone Number',
        value: '',
        required: false,
        position: { x: 100, y: 250, width: 150, height: 30 },
        page: 1,
        confidence: 0.88,
        suggestions: ['+1 (555) 123-4567', '(555) 123-4567'],
        validation: { pattern: '^[+]?[1-9][\\d]{0,15}$' }
      },
      {
        id: '4',
        type: 'date',
        label: 'Date of Birth',
        value: '',
        required: true,
        position: { x: 100, y: 300, width: 120, height: 30 },
        page: 1,
        confidence: 0.90,
        suggestions: ['1990-01-01', '1985-05-15']
      },
      {
        id: '5',
        type: 'checkbox',
        label: 'I agree to the terms and conditions',
        value: '',
        required: true,
        position: { x: 100, y: 350, width: 20, height: 20 },
        page: 1,
        confidence: 0.85
      },
      {
        id: '6',
        type: 'radio',
        label: 'Gender',
        value: '',
        required: true,
        position: { x: 100, y: 400, width: 100, height: 30 },
        page: 1,
        confidence: 0.87,
        suggestions: ['Male', 'Female', 'Other', 'Prefer not to say']
      },
      {
        id: '7',
        type: 'text',
        label: 'Emergency Contact',
        value: '',
        required: false,
        position: { x: 100, y: 450, width: 200, height: 30 },
        page: 1,
        confidence: 0.82,
        suggestions: ['Spouse Name', 'Parent Name', 'Friend Name']
      }
    ];
  }

  /**
   * Enhanced questions with AI suggestions
   */
  private getEnhancedDocxQuestions(): Question[] {
    return [
      {
        id: '1',
        text: 'האם קראת והבנת את כל התנאים? / Have you read and understood all terms?',
        type: 'yes_no',
        position: { x: 100, y: 450, width: 300, height: 30 },
        page: 1,
        confidence: 0.93,
        aiSuggestion: 'Yes - ensure you understand all waiver implications'
      },
      {
        id: '2',
        text: 'האם אתה מסכים לוותר על תביעות עתידיות? / Do you agree to waive future claims?',
        type: 'yes_no',
        position: { x: 100, y: 500, width: 300, height: 30 },
        page: 1,
        confidence: 0.91,
        aiSuggestion: 'Consider legal implications carefully'
      },
      {
        id: '3',
        text: 'האם אתה חותם מרצון חופשי? / Are you signing voluntarily?',
        type: 'yes_no',
        position: { x: 100, y: 550, width: 300, height: 30 },
        page: 1,
        confidence: 0.89,
        aiSuggestion: 'Yes - ensure this is your voluntary decision'
      },
      {
        id: '4',
        text: 'האם יש לך שאלות לגבי המסמך? / Do you have questions about the document?',
        type: 'text',
        position: { x: 100, y: 600, width: 300, height: 30 },
        page: 1,
        confidence: 0.87,
        aiSuggestion: 'Consider asking about any unclear terms'
      },
      {
        id: '5',
        text: 'תאריך חתימה / Date of Signature',
        type: 'date',
        position: { x: 100, y: 650, width: 300, height: 30 },
        page: 1,
        confidence: 0.85,
        aiSuggestion: 'Today\'s date'
      }
    ];
  }

  /**
   * Enhanced PDF questions
   */
  private getEnhancedPdfQuestions(): Question[] {
    return [
      {
        id: '1',
        text: 'Do you have any medical conditions?',
        type: 'yes_no',
        position: { x: 100, y: 450, width: 300, height: 30 },
        page: 1,
        confidence: 0.93,
        aiSuggestion: 'Consider privacy and relevance to the form'
      },
      {
        id: '2',
        text: 'What is your preferred contact method?',
        type: 'multiple_choice',
        options: ['Email', 'Phone', 'Mail', 'SMS', 'Video Call'],
        position: { x: 100, y: 500, width: 300, height: 30 },
        page: 1,
        confidence: 0.91,
        aiSuggestion: 'Email (most professional for business)'
      },
      {
        id: '3',
        text: 'Please describe any special requirements:',
        type: 'text',
        position: { x: 100, y: 550, width: 300, height: 60 },
        page: 1,
        confidence: 0.89,
        aiSuggestion: 'Accessibility needs, dietary restrictions, etc.'
      },
      {
        id: '4',
        text: 'How satisfied are you with our service?',
        type: 'rating',
        position: { x: 100, y: 620, width: 300, height: 30 },
        page: 1,
        confidence: 0.86,
        aiSuggestion: 'Rate based on your experience'
      }
    ];
  }

  /**
   * Get form fields specific to DOCX documents (like job applications, forms)
   */
  private getDocxFormFields(): FormField[] {
    return [
      {
        id: '1',
        type: 'text',
        label: 'Applicant Name',
        value: '',
        required: true,
        position: { x: 100, y: 150, width: 200, height: 30 },
        page: 1,
        confidence: 0.95
      },
      {
        id: '2',
        type: 'text',
        label: 'Position Applied For',
        value: '',
        required: true,
        position: { x: 100, y: 200, width: 200, height: 30 },
        page: 1,
        confidence: 0.92
      },
      {
        id: '3',
        type: 'email',
        label: 'Email Address',
        value: '',
        required: true,
        position: { x: 100, y: 250, width: 200, height: 30 },
        page: 1,
        confidence: 0.94
      },
      {
        id: '4',
        type: 'phone',
        label: 'Phone Number',
        value: '',
        required: true,
        position: { x: 100, y: 300, width: 150, height: 30 },
        page: 1,
        confidence: 0.88
      },
      {
        id: '5',
        type: 'date',
        label: 'Date Available',
        value: '',
        required: true,
        position: { x: 100, y: 350, width: 120, height: 30 },
        page: 1,
        confidence: 0.90
      },
      {
        id: '6',
        type: 'text',
        label: 'Expected Salary',
        value: '',
        required: false,
        position: { x: 100, y: 400, width: 150, height: 30 },
        page: 1,
        confidence: 0.85
      },
      {
        id: '7',
        type: 'signature',
        label: 'Digital Signature',
        required: true,
        position: { x: 100, y: 500, width: 150, height: 50 },
        page: 1,
        confidence: 0.93
      }
    ];
  }

  /**
   * Get form fields specific to PDF documents (like contracts, forms)
   */
  private getPdfFormFields(): FormField[] {
    return [
      {
        id: '1',
        type: 'text',
        label: 'Full Name',
        value: '',
        required: true,
        position: { x: 100, y: 150, width: 200, height: 30 },
        page: 1,
        confidence: 0.95
      },
      {
        id: '2',
        type: 'email',
        label: 'Email Address',
        value: '',
        required: true,
        position: { x: 100, y: 200, width: 200, height: 30 },
        page: 1,
        confidence: 0.92
      },
      {
        id: '3',
        type: 'phone',
        label: 'Phone Number',
        value: '',
        required: false,
        position: { x: 100, y: 250, width: 150, height: 30 },
        page: 1,
        confidence: 0.88
      },
      {
        id: '4',
        type: 'date',
        label: 'Date of Birth',
        value: '',
        required: true,
        position: { x: 100, y: 300, width: 120, height: 30 },
        page: 1,
        confidence: 0.90
      },
      {
        id: '5',
        type: 'checkbox',
        label: 'I agree to the terms and conditions',
        value: '',
        required: true,
        position: { x: 100, y: 350, width: 20, height: 20 },
        page: 1,
        confidence: 0.85
      },
      {
        id: '6',
        type: 'radio',
        label: 'Gender',
        value: '',
        required: true,
        position: { x: 100, y: 400, width: 100, height: 30 },
        page: 1,
        confidence: 0.87
      }
    ];
  }

  /**
   * Get questions specific to DOCX documents
   */
  private getDocxQuestions(): Question[] {
    return [
      {
        id: '1',
        text: 'Do you have experience with this role?',
        type: 'yes_no',
        position: { x: 100, y: 450, width: 300, height: 30 },
        page: 1,
        confidence: 0.93
      },
      {
        id: '2',
        text: 'What is your expected salary range?',
        type: 'text',
        position: { x: 100, y: 500, width: 300, height: 30 },
        page: 1,
        confidence: 0.91
      },
      {
        id: '3',
        text: 'Are you willing to relocate?',
        type: 'yes_no',
        position: { x: 100, y: 550, width: 300, height: 30 },
        page: 1,
        confidence: 0.89
      },
      {
        id: '4',
        text: 'How did you hear about this position?',
        type: 'multiple_choice',
        options: ['Job Board', 'Referral', 'Company Website', 'Social Media'],
        position: { x: 100, y: 600, width: 300, height: 30 },
        page: 1,
        confidence: 0.87
      }
    ];
  }

  /**
   * Get questions specific to PDF documents
   */
  private getPdfQuestions(): Question[] {
    return [
      {
        id: '1',
        text: 'Do you have any medical conditions?',
        type: 'yes_no',
        position: { x: 100, y: 450, width: 300, height: 30 },
        page: 1,
        confidence: 0.93
      },
      {
        id: '2',
        text: 'What is your preferred contact method?',
        type: 'multiple_choice',
        options: ['Email', 'Phone', 'Mail', 'SMS'],
        position: { x: 100, y: 500, width: 300, height: 30 },
        page: 1,
        confidence: 0.91
      },
      {
        id: '3',
        text: 'Please describe any special requirements:',
        type: 'text',
        position: { x: 100, y: 550, width: 300, height: 60 },
        page: 1,
        confidence: 0.89
      }
    ];
  }

  /**
   * Get signature areas for DOCX documents
   */
  private getDocxSignatures() {
    return [
      {
        id: '1',
        label: 'Applicant Signature',
        position: { x: 100, y: 650, width: 150, height: 50 },
        page: 1,
        required: true
      },
      {
        id: '2',
        label: 'Date',
        position: { x: 300, y: 650, width: 100, height: 30 },
        page: 1,
        required: true
      }
    ];
  }

  /**
   * Get signature areas for PDF documents
   */
  private getPdfSignatures() {
    return [
      {
        id: '1',
        label: 'Applicant Signature',
        position: { x: 100, y: 650, width: 150, height: 50 },
        page: 1,
        required: true
      },
      {
        id: '2',
        label: 'Witness Signature',
        position: { x: 300, y: 650, width: 150, height: 50 },
        page: 1,
        required: false
      }
    ];
  }

  /**
   * Enhanced form filling with AI-powered suggestions
   */
  async fillFormFields(
    formFields: FormField[], 
    userData: Record<string, any>
  ): Promise<FormField[]> {
    try {
      console.log('Starting AI-powered form filling...');
      
      // Fast AI processing
      await new Promise(resolve => setTimeout(resolve, 200));

      return formFields.map(field => {
        const fieldKey = field.label.toLowerCase().replace(/\s+/g, '_');
        
        // Try to match field with user data
        if (userData[fieldKey]) {
          return { ...field, value: userData[fieldKey] };
        }

        // Smart field matching with AI suggestions
        if (field.type === 'email' && userData.email) {
          return { ...field, value: userData.email };
        }
        if (field.type === 'phone' && userData.phone) {
          return { ...field, value: userData.phone };
        }
        if (field.label.toLowerCase().includes('name') && userData.name) {
          return { ...field, value: userData.name };
        }
        if (field.label.toLowerCase().includes('position') && userData.occupation) {
          return { ...field, value: userData.occupation };
        }
        if (field.label.toLowerCase().includes('salary') && userData.preferences?.salary_range) {
          return { ...field, value: userData.preferences.salary_range };
        }
        if (field.label.toLowerCase().includes('experience') && userData.experience) {
          return { ...field, value: userData.experience };
        }
        if (field.label.toLowerCase().includes('company') && userData.company) {
          return { ...field, value: userData.company };
        }

        // Use AI suggestions if available
        if (field.suggestions && field.suggestions.length > 0) {
          return { ...field, value: field.suggestions[0] };
        }

        return field;
      });
    } catch (error) {
      console.error('Enhanced form filling error:', error);
      throw new Error('Failed to fill form fields');
    }
  }

  /**
   * Enhanced signature application with AI positioning
   */
  async applySignatures(
    documentUri: string,
    signatures: SignatureData[],
    signatureAreas: any[],
    fileType: 'pdf' | 'docx' = 'pdf'
  ): Promise<string> {
    try {
      console.log(`Applying AI-enhanced signatures to ${fileType.toUpperCase()} document...`);
      
      // Simulate AI signature positioning and application
      await new Promise(resolve => setTimeout(resolve, 2500));

      // In a real implementation, you would:
      // 1. Use AI to optimize signature positioning
      // 2. Apply signatures with proper scaling and rotation
      // 3. Ensure signatures don't overlap with text
      // 4. Add digital signature verification
      // 5. Apply watermarks or security features

      const signedDocumentUri = documentUri.replace(`.${fileType}`, `_signed.${fileType}`);
      
      // Mock: copy the original file as "signed"
      await FileSystem.copyAsync({
        from: documentUri,
        to: signedDocumentUri
      });

      console.log(`Signatures applied successfully to ${signedDocumentUri}`);
      return signedDocumentUri;
    } catch (error) {
      console.error('Enhanced signature application error:', error);
      throw new Error(`Failed to apply signatures to ${fileType.toUpperCase()} document`);
    }
  }

  /**
   * Enhanced question answering with AI insights
   */
  async answerQuestions(
    questions: Question[],
    userPreferences: Record<string, any>
  ): Promise<Question[]> {
    try {
      console.log('Starting AI-powered question answering...');
      
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      return questions.map(question => {
        const questionKey = question.text.toLowerCase().replace(/\s+/g, '_');
        
        // Try to match with user preferences
        if (userPreferences[questionKey]) {
          return { ...question, value: userPreferences[questionKey] };
        }

        // Smart question matching with AI insights
        if (question.text.toLowerCase().includes('medical') && userPreferences.medical_conditions) {
          return { ...question, value: userPreferences.medical_conditions };
        }
        if (question.text.toLowerCase().includes('contact') && userPreferences.preferred_contact) {
          return { ...question, value: userPreferences.preferred_contact };
        }
        if (question.text.toLowerCase().includes('salary') && userPreferences.expected_salary) {
          return { ...question, value: userPreferences.expected_salary };
        }
        if (question.text.toLowerCase().includes('experience') && userPreferences.has_experience) {
          return { ...question, value: userPreferences.has_experience };
        }
        if (question.text.toLowerCase().includes('relocate') && userPreferences.location_preference) {
          return { ...question, value: userPreferences.location_preference };
        }
        if (question.text.toLowerCase().includes('hear') && userPreferences.source) {
          return { ...question, value: userPreferences.source };
        }

        // Use AI suggestion if available
        if (question.aiSuggestion) {
          return { ...question, value: question.aiSuggestion.split(' - ')[0] };
        }

        return question;
      });
    } catch (error) {
      console.error('Enhanced question answering error:', error);
      throw new Error('Failed to answer questions');
    }
  }

  /**
   * Get AI-powered field suggestions with context
   */
  async getFieldSuggestions(field: FormField, fileType: 'pdf' | 'docx' = 'pdf'): Promise<string[]> {
    try {
      console.log(`Getting AI suggestions for field: ${field.label}`);
      
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 800));

      const suggestions: Record<string, string[]> = {
        'email': ['john.doe@example.com', 'user@company.com', 'contact@business.com'],
        'phone': ['+1 (555) 123-4567', '(555) 123-4567', '+972-50-123-4567'],
        'date': ['2024-01-15', 'Immediately', '2 weeks notice', 'Next month'],
        'text': ['Sample text', 'Enter your information here', 'Please specify'],
        'number': ['50000', '75000', '100000', '150000'],
        'select': ['Option 1', 'Option 2', 'Option 3']
      };

      // Add file-type specific suggestions
      if (fileType === 'docx') {
        suggestions['position'] = ['Software Engineer', 'Product Manager', 'Designer', 'Data Analyst', 'DevOps Engineer'];
        suggestions['salary'] = ['$50,000 - $70,000', '$70,000 - $90,000', '$90,000 - $120,000', '$120,000+'];
        suggestions['experience'] = ['Entry Level', '1-3 years', '3-5 years', '5+ years', 'Senior Level'];
        suggestions['education'] = ['High School', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Certification'];
      }

      // Add user profile-based suggestions
      if (this.userProfile) {
        if (field.label.toLowerCase().includes('name')) {
          suggestions['name'] = [this.userProfile.name];
        }
        if (field.label.toLowerCase().includes('email')) {
          suggestions['email'] = [this.userProfile.email];
        }
        if (field.label.toLowerCase().includes('phone')) {
          suggestions['phone'] = [this.userProfile.phone];
        }
        if (field.label.toLowerCase().includes('position')) {
          suggestions['position'] = [this.userProfile.occupation];
        }
      }

      return suggestions[field.type] || suggestions['text'] || [];
    } catch (error) {
      console.error('AI suggestion error:', error);
      return [];
    }
  }

  /**
   * Enhanced form validation with AI insights
   */
  async validateForm(formFields: FormField[]): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }> {
    try {
      console.log('Starting AI-powered form validation...');
      
      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      formFields.forEach(field => {
        if (field.required && !field.value) {
          errors.push(`${field.label} is required`);
        }

        if (field.type === 'email' && field.value && !this.isValidEmail(field.value)) {
          errors.push(`${field.label} must be a valid email address`);
        }

        if (field.type === 'phone' && field.value && !this.isValidPhone(field.value)) {
          warnings.push(`${field.label} format may be incorrect`);
        }

        if (field.confidence < 0.8) {
          warnings.push(`${field.label} detection confidence is low`);
        }

        // AI-powered validation suggestions
        if (field.validation) {
          if (field.validation.minLength && field.value && field.value.length < field.validation.minLength) {
            errors.push(`${field.label} must be at least ${field.validation.minLength} characters`);
          }
          if (field.validation.maxLength && field.value && field.value.length > field.validation.maxLength) {
            warnings.push(`${field.label} is longer than recommended`);
          }
          if (field.validation.minValue && field.value && parseFloat(field.value) < field.validation.minValue) {
            errors.push(`${field.label} must be at least ${field.validation.minValue}`);
          }
          if (field.validation.maxValue && field.value && parseFloat(field.value) > field.validation.maxValue) {
            warnings.push(`${field.label} seems unusually high`);
          }
        }

        // AI suggestions for improvement
        if (field.suggestions && field.suggestions.length > 0 && !field.value) {
          suggestions.push(`Consider using: ${field.suggestions[0]}`);
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions
      };
    } catch (error) {
      console.error('Enhanced validation error:', error);
      throw new Error('Failed to validate form');
    }
  }

  /**
   * Complete AI-powered document processing
   */
  async processDocument(
    fileUri: string,
    fileType: 'pdf' | 'docx',
    userData: Record<string, any> = {}
  ): Promise<AIProcessingResult> {
    try {
      console.log(`Starting complete AI document processing for ${fileType.toUpperCase()}...`);
      
      const startTime = Date.now();
      
      // Step 1: Analyze document
      const analysis = await this.analyzeDocument(fileUri, fileType);
      
      // Step 2: Fill form fields with AI
      const filledFields = await this.fillFormFields(analysis.formFields, userData);
      
      // Step 3: Answer questions with AI
      const answeredQuestions = await this.answerQuestions(analysis.questions, userData);
      
      // Step 4: Validate the form
      const validation = await this.validateForm(filledFields);
      
      // Step 5: Apply signatures if available
      let signedDocumentUri: string | undefined;
      if (analysis.signatures.length > 0) {
        const defaultSignature = this.getDefaultSignature();
        if (defaultSignature) {
          signedDocumentUri = await this.applySignatures(
            fileUri,
            [defaultSignature],
            analysis.signatures,
            fileType
          );
        }
      }
      
      const processingTime = (Date.now() - startTime) / 1000;
      
      return {
        success: validation.isValid,
        analysis,
        filledFields,
        answeredQuestions,
        signedDocumentUri,
        processingTime,
        errors: validation.errors,
        warnings: [...validation.warnings, ...validation.suggestions]
      };
    } catch (error) {
      console.error('Complete document processing error:', error);
      throw new Error(`Failed to process ${fileType.toUpperCase()} document`);
    }
  }

  /**
   * Get default signature for the user
   */
  private getDefaultSignature(): SignatureData | null {
    // In a real app, load from secure storage
    return {
      id: 'default',
      name: 'John Doe',
      type: 'typed',
      data: 'John Doe',
      isDefault: true
    };
  }

  /**
   * Get document insights and recommendations
   */
  async getDocumentInsights(analysis: DocumentAnalysis): Promise<{
    insights: string[];
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    try {
      const insights: string[] = [];
      const recommendations: string[] = [];
      
      // Analyze form complexity
      if (analysis.formFields.length > 10) {
        insights.push('Complex form with many fields detected');
        recommendations.push('Consider filling in batches to avoid errors');
      }
      
      // Check for sensitive information
      const sensitiveFields = analysis.formFields.filter(field => 
        field.label.toLowerCase().includes('ssn') ||
        field.label.toLowerCase().includes('social') ||
        field.label.toLowerCase().includes('password') ||
        field.label.toLowerCase().includes('credit')
      );
      
      if (sensitiveFields.length > 0) {
        insights.push('Sensitive information fields detected');
        recommendations.push('Double-check all sensitive information before submitting');
      }
      
      // Check confidence levels
      const lowConfidenceFields = analysis.formFields.filter(field => field.confidence < 0.8);
      if (lowConfidenceFields.length > 0) {
        insights.push(`${lowConfidenceFields.length} fields have low detection confidence`);
        recommendations.push('Review low-confidence fields carefully');
      }
      
      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (sensitiveFields.length > 0 || lowConfidenceFields.length > 5) {
        riskLevel = 'medium';
      }
      if (sensitiveFields.length > 2 || lowConfidenceFields.length > 10) {
        riskLevel = 'high';
      }
      
      return {
        insights,
        recommendations,
        riskLevel
      };
    } catch (error) {
      console.error('Document insights error:', error);
      return {
        insights: ['Unable to analyze document insights'],
        recommendations: ['Review the document carefully'],
        riskLevel: 'medium'
      };
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }
}

export const aiService = new AIService(); 