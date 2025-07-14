import * as FileSystem from 'expo-file-system';
import aiService from './aiService';
import docxService from './docxService';
import pdfService from './pdfService';

export interface FieldData {
  name: string;
  value: string;
  type: 'text' | 'signature';
  x?: number;
  y?: number;
  page?: number;
}

export interface SignatureData {
  id: string;
  name: string;
  type: 'typed' | 'image' | 'drawing';
  data: string; // This will be base64 data for images or text for typed signatures
  isDefault: boolean;
  x?: number;
  y?: number;
  page?: number;
}

export interface ProcessedDocument {
  originalUri: string;
  filledUri: string;
  fields: FieldData[];
  signatures: SignatureData[];
  documentType: 'pdf' | 'docx';
  processingDate: string;
}

class DocumentProcessor {
  /**
   * Process a document (PDF or DOCX) with AI analysis and signature application
   */
  async processDocument(
    documentUri: string,
    documentType: 'pdf' | 'docx',
    signatures: SignatureData[]
  ): Promise<ProcessedDocument> {
    try {
      console.log('Starting document processing...');
      console.log('Document URI:', documentUri);
      console.log('Document type:', documentType);
      console.log('Signatures:', signatures.length);

      // Analyze document with AI
      const analysis = await this.analyzeDocument(documentUri, documentType);
      console.log('AI analysis completed:', analysis.fields.length, 'fields found');

      // Fill document with detected fields and signatures
      const filledDocumentUri = await this.fillDocument(
        documentUri,
        analysis.fields,
        signatures,
        documentType
      );

      console.log('Document processed successfully:', filledDocumentUri);

      return {
        originalUri: documentUri,
        filledUri: filledDocumentUri,
        fields: analysis.fields,
        signatures: signatures,
        documentType: documentType,
        processingDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  /**
   * Analyze document with AI to detect form fields
   */
  private async analyzeDocument(
    documentUri: string,
    documentType: 'pdf' | 'docx'
  ): Promise<{ fields: FieldData[] }> {
    try {
      console.log('Analyzing document with AI...');
      
      // Use the AI service to analyze the document
      const analysis = await aiService.analyzeDocument(documentUri, documentType);
      
      // Convert AI analysis to FieldData format
      const fields: FieldData[] = analysis.formFields.map((field: any, index: number) => ({
        name: field.label,
        value: field.value || '',
        type: field.type === 'signature' ? 'signature' : 'text',
        x: field.position?.x,
        y: field.position?.y,
        page: field.position?.page || 1
      }));

      return { fields };
    } catch (error) {
      console.error('Error analyzing document:', error);
      // Return empty fields if analysis fails
      return { fields: [] };
    }
  }

  private async fillDocument(
    documentUri: string,
    fields: FieldData[],
    signatures: SignatureData[],
    documentType: 'pdf' | 'docx'
  ): Promise<string> {
    try {
      if (documentType === 'pdf') {
        const fileName = documentUri.split('/').pop() || 'document.pdf';
        const outputPath = `${FileSystem.documentDirectory}${fileName}`;
        
        return await pdfService.fillPDF(documentUri, fields, signatures, outputPath);
      } else {
        // For DOCX, create a proper DOCX file
        const fileName = documentUri.split('/').pop() || 'document.docx';
        const outputPath = `${FileSystem.documentDirectory}${fileName.replace('.docx', '_filled.docx')}`;
        
        return await docxService.fillDOCX(documentUri, fields, signatures, outputPath);
      }
    } catch (error) {
      console.error('Error filling document:', error);
      throw error;
    }
  }
}

export default new DocumentProcessor(); 