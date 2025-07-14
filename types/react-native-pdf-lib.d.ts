declare module 'react-native-pdf-lib' {
  export interface PDFDocument {
    create(uri?: string): Promise<PDFDocument>;
    getForm(): Promise<PDFForm>;
    addPage(): Promise<PDFPage>;
    save(uri: string): Promise<void>;
    close(): Promise<void>;
    getPageCount(): Promise<number>;
  }

  export interface PDFForm {
    getTextField(name: string): Promise<PDFTextField | null>;
    createTextField(name: string): Promise<PDFTextField>;
    getCheckBox(name: string): Promise<PDFCheckBox | null>;
    createCheckBox(name: string): Promise<PDFCheckBox>;
    createSignature(name: string): Promise<PDFSignature>;
  }

  export interface PDFTextField {
    setText(text: string): Promise<void>;
    setRect(x: number, y: number, width: number, height: number): Promise<void>;
  }

  export interface PDFCheckBox {
    check(checked: boolean): Promise<void>;
    setRect(x: number, y: number, width: number, height: number): Promise<void>;
  }

  export interface PDFSignature {
    setImage(imageData: string): Promise<void>;
  }

  export interface PDFPage {
    drawText(text: string, options: {
      x: number;
      y: number;
      size: number;
      color: { r: number; g: number; b: number };
    }): Promise<void>;
  }

  export const PDFDocument: {
    create(uri?: string): Promise<PDFDocument>;
  };

  export default {
    PDFDocument
  };
} 