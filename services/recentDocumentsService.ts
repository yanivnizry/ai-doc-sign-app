import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

export interface RecentDocument {
  id: string;
  name: string;
  originalUri: string;
  processedUri?: string;
  type: 'pdf' | 'docx';
  size: number;
  processedAt: string;
  formFieldsCount: number;
  signaturesCount: number;
  language?: string;
  category?: string;
}

class RecentDocumentsService {
  private readonly STORAGE_KEY = 'recent_documents';
  private readonly MAX_RECENT_DOCUMENTS = 10;

  /**
   * Add a document to recent documents
   */
  async addRecentDocument(document: Omit<RecentDocument, 'id' | 'processedAt'>): Promise<void> {
    try {
      const recentDocs = await this.getRecentDocuments();
      
      // Check if document already exists (by name and size)
      const existingIndex = recentDocs.findIndex(doc => 
        doc.name === document.name && doc.size === document.size
      );
      
      const newDocument: RecentDocument = {
        ...document,
        id: Date.now().toString(),
        processedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        // Update existing document
        recentDocs[existingIndex] = newDocument;
      } else {
        // Add new document at the beginning
        recentDocs.unshift(newDocument);
      }

      // Keep only the most recent documents
      const limitedDocs = recentDocs.slice(0, this.MAX_RECENT_DOCUMENTS);
      
      await SecureStore.setItemAsync(this.STORAGE_KEY, JSON.stringify(limitedDocs));
      console.log('Recent document saved:', newDocument.name);
    } catch (error) {
      console.error('Error saving recent document:', error);
    }
  }

  /**
   * Get all recent documents
   */
  async getRecentDocuments(): Promise<RecentDocument[]> {
    try {
      const stored = await SecureStore.getItemAsync(this.STORAGE_KEY);
      if (stored) {
        const documents = JSON.parse(stored) as RecentDocument[];
        
        // Filter out documents that no longer exist
        const validDocuments = await this.filterValidDocuments(documents);
        
        // Update storage with only valid documents
        if (validDocuments.length !== documents.length) {
          await SecureStore.setItemAsync(this.STORAGE_KEY, JSON.stringify(validDocuments));
        }
        
        return validDocuments;
      }
      return [];
    } catch (error) {
      console.error('Error loading recent documents:', error);
      return [];
    }
  }

  /**
   * Filter out documents that no longer exist on the file system
   */
  private async filterValidDocuments(documents: RecentDocument[]): Promise<RecentDocument[]> {
    const validDocuments: RecentDocument[] = [];
    
    for (const doc of documents) {
      try {
        // Check if the original file still exists
        const originalExists = await FileSystem.getInfoAsync(doc.originalUri);
        
        // Check if the processed file exists (if it was processed)
        let processedExists = false;
        if (doc.processedUri) {
          const processedInfo = await FileSystem.getInfoAsync(doc.processedUri);
          processedExists = processedInfo.exists;
        }
        
        // Keep document if original exists or if it was processed and processed file exists
        if (originalExists.exists || (doc.processedUri && processedExists)) {
          validDocuments.push(doc);
        } else {
          console.log('Removing invalid recent document:', doc.name);
        }
      } catch (error) {
        console.log('Error checking document validity:', doc.name, error);
        // Remove document if we can't verify its existence
      }
    }
    
    return validDocuments;
  }

  /**
   * Remove a document from recent documents
   */
  async removeRecentDocument(documentId: string): Promise<void> {
    try {
      const recentDocs = await this.getRecentDocuments();
      const filteredDocs = recentDocs.filter(doc => doc.id !== documentId);
      await SecureStore.setItemAsync(this.STORAGE_KEY, JSON.stringify(filteredDocs));
      console.log('Recent document removed:', documentId);
    } catch (error) {
      console.error('Error removing recent document:', error);
    }
  }

  /**
   * Clear all recent documents
   */
  async clearRecentDocuments(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.STORAGE_KEY);
      console.log('All recent documents cleared');
    } catch (error) {
      console.error('Error clearing recent documents:', error);
    }
  }

  /**
   * Update a document's processed URI
   */
  async updateProcessedUri(documentId: string, processedUri: string): Promise<void> {
    try {
      const recentDocs = await this.getRecentDocuments();
      const docIndex = recentDocs.findIndex(doc => doc.id === documentId);
      
      if (docIndex >= 0) {
        recentDocs[docIndex].processedUri = processedUri;
        recentDocs[docIndex].processedAt = new Date().toISOString();
        await SecureStore.setItemAsync(this.STORAGE_KEY, JSON.stringify(recentDocs));
        console.log('Updated processed URI for document:', recentDocs[docIndex].name);
      }
    } catch (error) {
      console.error('Error updating processed URI:', error);
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(): Promise<{
    totalDocuments: number;
    pdfCount: number;
    docxCount: number;
    totalSize: number;
    averageFields: number;
    averageSignatures: number;
  }> {
    try {
      const documents = await this.getRecentDocuments();
      
      const stats = {
        totalDocuments: documents.length,
        pdfCount: documents.filter(doc => doc.type === 'pdf').length,
        docxCount: documents.filter(doc => doc.type === 'docx').length,
        totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
        averageFields: documents.length > 0 
          ? Math.round(documents.reduce((sum, doc) => sum + doc.formFieldsCount, 0) / documents.length)
          : 0,
        averageSignatures: documents.length > 0
          ? Math.round(documents.reduce((sum, doc) => sum + doc.signaturesCount, 0) / documents.length)
          : 0
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting document stats:', error);
      return {
        totalDocuments: 0,
        pdfCount: 0,
        docxCount: 0,
        totalSize: 0,
        averageFields: 0,
        averageSignatures: 0
      };
    }
  }
}

// Export singleton instance
export const recentDocumentsService = new RecentDocumentsService(); 