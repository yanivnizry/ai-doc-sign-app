import * as SecureStore from 'expo-secure-store';
import { recentDocumentsService } from '../../services/recentDocumentsService';

describe('RecentDocumentsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  describe('addRecentDocument', () => {
    it('should add a new document to recent documents', async () => {
      const mockDocument = {
        name: 'Test Document.pdf',
        originalUri: 'file://test.pdf',
        processedUri: 'file://processed.pdf',
        type: 'pdf' as const,
        size: 1024,
        formFieldsCount: 5,
        signaturesCount: 2,
        language: 'en',
        category: 'legal'
      };

      await recentDocumentsService.addRecentDocument(mockDocument);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'recent_documents',
        expect.stringContaining('Test Document.pdf')
      );
    });

    it('should limit recent documents to maximum count', async () => {
      // Mock existing documents
      const existingDocuments = Array.from({ length: 20 }, (_, i) => ({
        name: `Document ${i}.pdf`,
        originalUri: `file://doc${i}.pdf`,
        processedUri: `file://processed${i}.pdf`,
        type: 'pdf' as const,
        size: 1024,
        formFieldsCount: 5,
        signaturesCount: 2,
        language: 'en',
        category: 'legal',
        timestamp: Date.now() - i * 1000
      }));

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(existingDocuments));

      const newDocument = {
        name: 'New Document.pdf',
        originalUri: 'file://new.pdf',
        processedUri: 'file://new-processed.pdf',
        type: 'pdf' as const,
        size: 1024,
        formFieldsCount: 5,
        signaturesCount: 2,
        language: 'en',
        category: 'legal'
      };

      await recentDocumentsService.addRecentDocument(newDocument);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'recent_documents',
        expect.stringMatching(/New Document\.pdf/)
      );
    });
  });

  describe('getRecentDocuments', () => {
    it('should return empty array when no documents exist', async () => {
      const documents = await recentDocumentsService.getRecentDocuments();

      expect(documents).toEqual([]);
    });

    it('should return existing documents', async () => {
      const mockDocuments = [
        {
          name: 'Document 1.pdf',
          originalUri: 'file://doc1.pdf',
          processedUri: 'file://processed1.pdf',
          type: 'pdf' as const,
          size: 1024,
          formFieldsCount: 5,
          signaturesCount: 2,
          language: 'en',
          category: 'legal',
          timestamp: Date.now()
        },
        {
          name: 'Document 2.pdf',
          originalUri: 'file://doc2.pdf',
          processedUri: 'file://processed2.pdf',
          type: 'pdf' as const,
          size: 2048,
          formFieldsCount: 3,
          signaturesCount: 1,
          language: 'en',
          category: 'financial',
          timestamp: Date.now() - 1000
        }
      ];

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockDocuments));

      const documents = await recentDocumentsService.getRecentDocuments();

      expect(documents).toHaveLength(2);
      expect(documents[0].name).toBe('Document 1.pdf');
      expect(documents[1].name).toBe('Document 2.pdf');
    });

    it('should handle invalid stored data', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('invalid json');

      const documents = await recentDocumentsService.getRecentDocuments();

      expect(documents).toEqual([]);
    });
  });

  describe('clearRecentDocuments', () => {
    it('should clear all recent documents', async () => {
      await recentDocumentsService.clearRecentDocuments();

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('recent_documents', '[]');
    });
  });

  describe('removeRecentDocument', () => {
    it('should remove specific document', async () => {
      const mockDocuments = [
        {
          name: 'Document 1.pdf',
          originalUri: 'file://doc1.pdf',
          processedUri: 'file://processed1.pdf',
          type: 'pdf' as const,
          size: 1024,
          formFieldsCount: 5,
          signaturesCount: 2,
          language: 'en',
          category: 'legal',
          timestamp: Date.now()
        },
        {
          name: 'Document 2.pdf',
          originalUri: 'file://doc2.pdf',
          processedUri: 'file://processed2.pdf',
          type: 'pdf' as const,
          size: 2048,
          formFieldsCount: 3,
          signaturesCount: 1,
          language: 'en',
          category: 'financial',
          timestamp: Date.now() - 1000
        }
      ];

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockDocuments));

      await recentDocumentsService.removeRecentDocument('file://doc1.pdf');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'recent_documents',
        expect.not.stringContaining('Document 1.pdf')
      );
    });

    it('should handle document not found', async () => {
      const mockDocuments = [
        {
          name: 'Document 1.pdf',
          originalUri: 'file://doc1.pdf',
          processedUri: 'file://processed1.pdf',
          type: 'pdf' as const,
          size: 1024,
          formFieldsCount: 5,
          signaturesCount: 2,
          language: 'en',
          category: 'legal',
          timestamp: Date.now()
        }
      ];

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockDocuments));

      await recentDocumentsService.removeRecentDocument('file://nonexistent.pdf');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'recent_documents',
        JSON.stringify(mockDocuments)
      );
    });
  });

  describe('getDocumentStats', () => {
    it('should return correct statistics', async () => {
      const mockDocuments = [
        {
          name: 'Document 1.pdf',
          originalUri: 'file://doc1.pdf',
          processedUri: 'file://processed1.pdf',
          type: 'pdf' as const,
          size: 1024,
          formFieldsCount: 5,
          signaturesCount: 2,
          language: 'en',
          category: 'legal',
          timestamp: Date.now()
        },
        {
          name: 'Document 2.docx',
          originalUri: 'file://doc2.docx',
          processedUri: 'file://processed2.docx',
          type: 'docx' as const,
          size: 2048,
          formFieldsCount: 3,
          signaturesCount: 1,
          language: 'en',
          category: 'financial',
          timestamp: Date.now() - 1000
        }
      ];

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockDocuments));

      const stats = await recentDocumentsService.getDocumentStats();

      expect(stats.totalDocuments).toBe(2);
      expect(stats.pdfCount).toBe(1);
      expect(stats.docxCount).toBe(1);
      expect(stats.totalSize).toBe(3072);
      expect(stats.averageFields).toBe(4);
      expect(stats.averageSignatures).toBe(2);
    });

    it('should handle empty documents', async () => {
      const stats = await recentDocumentsService.getDocumentStats();

      expect(stats.totalDocuments).toBe(0);
      expect(stats.pdfCount).toBe(0);
      expect(stats.docxCount).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.averageFields).toBe(0);
      expect(stats.averageSignatures).toBe(0);
    });
  });
}); 