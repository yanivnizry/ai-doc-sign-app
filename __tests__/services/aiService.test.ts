import * as FileSystem from 'expo-file-system';
import { aiService, FormField, Question } from '../../services/aiService';

// Mock mammoth
jest.mock('mammoth', () => ({
  extractRawText: jest.fn(),
}));

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('analyzeDocument', () => {
    it('should analyze PDF document successfully', async () => {
      const mockFileUri = 'file://test.pdf';
      const mockContent = 'Test PDF content';
      
      // Mock FileSystem.readAsStringAsync
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(mockContent);
      
      // Mock fetch for LLM call
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          response: JSON.stringify({
            language: 'en',
            category: 'legal',
            summary: 'Test document',
            keyInsights: ['Test insight'],
            riskAssessment: {
              level: 'low',
              issues: [],
              recommendations: []
            },
            formFields: [
              {
                id: '1',
                type: 'text',
                label: 'Name',
                required: true,
                position: { x: 100, y: 150, width: 200, height: 30 },
                page: 1,
                confidence: 0.95
              }
            ],
            questions: [],
            signatures: [
              {
                id: '1',
                label: 'Signature',
                required: true,
                position: { x: 100, y: 300, width: 150, height: 50 },
                page: 1
              }
            ]
          })
        })
      });

      const result = await aiService.analyzeDocument(mockFileUri, 'pdf');

      expect(result).toBeDefined();
      expect(result.documentInfo.type).toBe('PDF');
      expect(result.formFields).toHaveLength(1);
      expect(result.signatures).toHaveLength(1);
      expect(result.formFields[0]?.label).toBe('Name');
      expect(result.signatures[0]?.label).toBe('Signature');
    });

    it('should handle LLM API errors gracefully', async () => {
      const mockFileUri = 'file://test.pdf';
      const mockContent = 'Test PDF content';
      
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(mockContent);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await aiService.analyzeDocument(mockFileUri, 'pdf');

      expect(result).toBeDefined();
      expect(result.formFields).toBeDefined();
      expect(result.signatures).toBeDefined();
    });
  });

  describe('analyzeDocumentFast', () => {
    it('should perform fast analysis without LLM', async () => {
      const mockFileUri = 'file://test.pdf';
      const mockContent = 'Test PDF content with Name: [___] and Signature: [___]';
      
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(mockContent);

      const result = await aiService.analyzeDocumentFast(mockFileUri, 'pdf');

      expect(result).toBeDefined();
      expect(result.documentInfo.type).toBe('PDF');
      expect(result.formFields.length).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });

  describe('fillFormFields', () => {
    it('should fill form fields with user data', async () => {
      const fields: FormField[] = [
        {
          id: '1',
          type: 'text',
          label: 'Name',
          required: true,
          position: { x: 100, y: 150, width: 200, height: 30 },
          page: 1,
          confidence: 0.95
        },
        {
          id: '2',
          type: 'email',
          label: 'Email',
          required: true,
          position: { x: 100, y: 200, width: 200, height: 30 },
          page: 1,
          confidence: 0.95
        }
      ];

      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const result = await aiService.fillFormFields(fields, userData);

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe('John Doe');
      expect(result[1].value).toBe('john@example.com');
    });

    it('should generate default values for empty fields', async () => {
      const fields: FormField[] = [
        {
          id: '1',
          type: 'text',
          label: 'Name',
          required: true,
          position: { x: 100, y: 150, width: 200, height: 30 },
          page: 1,
          confidence: 0.95
        }
      ];

      const result = await aiService.fillFormFields(fields, {});

      expect(result).toHaveLength(1);
      expect(result[0]?.value).toBeDefined();
      expect(result[0]?.value?.length).toBeGreaterThan(0);
    });
  });

  describe('answerQuestions', () => {
    it('should answer questions with user data', async () => {
      const questions: Question[] = [
        {
          id: '1',
          text: 'Do you agree to the terms?',
          type: 'yes_no',
          position: { x: 100, y: 150, width: 200, height: 30 },
          page: 1,
          confidence: 0.95
        }
      ];

      const userData = {
        question_1: 'yes'
      };

      const result = await aiService.answerQuestions(questions, userData);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('Yes');
    });

    it('should generate default answers for empty questions', async () => {
      const questions: Question[] = [
        {
          id: '1',
          text: 'Do you agree to the terms?',
          type: 'yes_no',
          position: { x: 100, y: 150, width: 200, height: 30 },
          page: 1,
          confidence: 0.95
        }
      ];

      const result = await aiService.answerQuestions(questions, {});

      expect(result).toHaveLength(1);
      expect(result[0].value).toBeDefined();
    });
  });

  describe('validateForm', () => {
    it('should validate form fields correctly', async () => {
      const fields: FormField[] = [
        {
          id: '1',
          type: 'email',
          label: 'Email',
          required: true,
          value: 'invalid-email',
          position: { x: 100, y: 150, width: 200, height: 30 },
          page: 1,
          confidence: 0.95
        },
        {
          id: '2',
          type: 'text',
          label: 'Name',
          required: true,
          value: 'John Doe',
          position: { x: 100, y: 200, width: 200, height: 30 },
          page: 1,
          confidence: 0.95
        }
      ];

      const result = await aiService.validateForm(fields);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('email'))).toBe(true);
    });

    it('should pass validation for valid fields', async () => {
      const fields: FormField[] = [
        {
          id: '1',
          type: 'email',
          label: 'Email',
          required: true,
          value: 'valid@email.com',
          position: { x: 100, y: 150, width: 200, height: 30 },
          page: 1,
          confidence: 0.95
        }
      ];

      const result = await aiService.validateForm(fields);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getDefaultSignatures', () => {
    it('should return default signatures', async () => {
      const result = await aiService.getDefaultSignatures();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('data');
    });
  });

  describe('processDocument', () => {
    it('should process document with signatures successfully', async () => {
      const mockFileUri = 'file://test.pdf';
      const mockContent = 'Test PDF content';
      
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(mockContent);
      
      // Mock LLM analysis
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          response: JSON.stringify({
            language: 'en',
            category: 'legal',
            summary: 'Test document',
            keyInsights: ['Test insight'],
            riskAssessment: {
              level: 'low',
              issues: [],
              recommendations: []
            },
            formFields: [
              {
                id: '1',
                type: 'signature',
                label: 'Signature',
                required: true,
                position: { x: 100, y: 150, width: 200, height: 30 },
                page: 1,
                confidence: 0.95
              }
            ],
            questions: [],
            signatures: [
              {
                id: '1',
                label: 'Signature',
                required: true,
                position: { x: 100, y: 300, width: 150, height: 50 },
                page: 1
              }
            ]
          })
        })
      });

      // Mock backend API
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100))
      });

      const userData = {
        signature_1: 'test-signature-data'
      };

      const result = await aiService.processDocument(mockFileUri, 'pdf', userData);

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.filledFields).toBeDefined();
      expect(result.answeredQuestions).toBeDefined();
    });

    it('should throw error when required signatures are missing', async () => {
      const mockFileUri = 'file://test.pdf';
      const mockContent = 'Test PDF content';
      
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(mockContent);
      
      // Mock LLM analysis with required signature
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          response: JSON.stringify({
            language: 'en',
            category: 'legal',
            summary: 'Test document',
            keyInsights: ['Test insight'],
            riskAssessment: {
              level: 'low',
              issues: [],
              recommendations: []
            },
            formFields: [],
            questions: [],
            signatures: [
              {
                id: '1',
                label: 'Required Signature',
                required: true,
                position: { x: 100, y: 300, width: 150, height: 50 },
                page: 1
              }
            ]
          })
        })
      });

      const userData = {}; // No signatures provided

      await expect(aiService.processDocument(mockFileUri, 'pdf', userData))
        .rejects.toThrow('Missing required signatures');
    });

    it('should handle backend API errors', async () => {
      const mockFileUri = 'file://test.pdf';
      const mockContent = 'Test PDF content';
      
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(mockContent);
      
      // Mock LLM analysis
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          response: JSON.stringify({
            language: 'en',
            category: 'legal',
            summary: 'Test document',
            keyInsights: ['Test insight'],
            riskAssessment: {
              level: 'low',
              issues: [],
              recommendations: []
            },
            formFields: [],
            questions: [],
            signatures: []
          })
        })
      });

      // Mock backend API error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal server error')
      });

      const userData = {};

      await expect(aiService.processDocument(mockFileUri, 'pdf', userData))
        .rejects.toThrow('Backend processing failed');
    });
  });

  describe('processDocumentFast', () => {
    it('should process document in fast mode without backend', async () => {
      const mockFileUri = 'file://test.pdf';
      const mockContent = 'Test PDF content';
      
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(mockContent);

      const result = await aiService.processDocumentFast(mockFileUri, 'pdf', {});

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.filledFields).toBeDefined();
      expect(result.answeredQuestions).toBeDefined();
      expect(result.signedDocumentUri).toBe(mockFileUri);
      expect(result.warnings).toContain('Document processed in fast mode');
    });
  });

  describe('testLLMConnection', () => {
    it('should test LLM connection successfully', async () => {
      // Mock the health check
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200
      });
      
      // Mock the model test
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ response: 'Connection successful' })
      });

      const result = await aiService.testLLMConnection();

      expect(result.success).toBe(true);
      expect(result.message).toContain('successful');
      expect(result.responseTime).toBeDefined();
    });

    it('should handle LLM connection failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await aiService.testLLMConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('error');
    });
  });
}); 