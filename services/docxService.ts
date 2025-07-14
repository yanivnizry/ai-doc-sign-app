import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import mammoth from 'mammoth';

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

class DocxService {
  /**
   * Fill a DOCX document with form fields and signatures
   * Creates a proper DOCX file using JSZip and Office Open XML
   */
  async fillDOCX(
    documentUri: string,
    fields: FieldData[],
    signatures: SignatureData[],
    outputPath: string
  ): Promise<string> {
    try {
      console.log('Starting DOCX processing...');
      console.log('Fields to fill:', fields.length);
      console.log('Signatures to apply:', signatures.length);

      // Extract content from original DOCX
      let originalContent = '';
      try {
        const docxContent = await this.extractDocxContent(documentUri);
        originalContent = docxContent;
        console.log('Original DOCX content extracted:', originalContent.substring(0, 200) + '...');
      } catch (error) {
        console.error('Error extracting original DOCX content:', error);
        originalContent = 'Original document content could not be extracted.';
      }

      // Create a new ZIP file for the DOCX
      const zip = new JSZip();
      
      // Add the required DOCX files with original content and overlaid signatures
      this.addDocxFiles(zip, fields, signatures, originalContent);
      
      // Generate the DOCX file using React Native-compatible format
      const docxBuffer = await zip.generateAsync({ type: 'uint8array' });
      
      // Convert buffer to base64 for React Native
      const base64Data = this.arrayBufferToBase64(docxBuffer);
      
      // Write the DOCX file
      await FileSystem.writeAsStringAsync(outputPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64
      });

      console.log('DOCX file created successfully:', outputPath);
      return outputPath;
    } catch (error) {
      console.error('Error filling DOCX:', error);
      throw error;
    }
  }

  /**
   * Extract content from original DOCX file
   */
  private async extractDocxContent(documentUri: string): Promise<string> {
    try {
      // Read the DOCX file
      const docxBase64 = await FileSystem.readAsStringAsync(documentUri, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      // Convert base64 to ArrayBuffer
      const arrayBuffer = Uint8Array.from(atob(docxBase64), c => c.charCodeAt(0)).buffer;
      
      // Extract text using mammoth
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      return result.value;
    } catch (error) {
      console.error('Error extracting DOCX content:', error);
      throw error;
    }
  }

  /**
   * Add all required files to the DOCX ZIP
   */
  private addDocxFiles(zip: JSZip, fields: FieldData[], signatures: SignatureData[], originalContent: string) {
    // Add content types file
    zip.file('[Content_Types].xml', this.getContentTypesXml());
    
    // Add relationships file
    zip.file('_rels/.rels', this.getRelsXml());
    
    // Add document relationships
    zip.file('word/_rels/document.xml.rels', this.getDocumentRelsXml());
    
    // Add main document with original content and overlaid signatures
    zip.file('word/document.xml', this.getDocumentXml(fields, signatures, originalContent));
    
    // Add settings
    zip.file('word/settings.xml', this.getSettingsXml());
    
    // Add styles
    zip.file('word/styles.xml', this.getStylesXml());
    
    // Add theme
    zip.file('word/theme/theme1.xml', this.getThemeXml());
    
    // Add app properties
    zip.file('docProps/app.xml', this.getAppXml());
    
    // Add core properties
    zip.file('docProps/core.xml', this.getCoreXml());
  }

  /**
   * Get content types XML
   */
  private getContentTypesXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`;
  }

  /**
   * Get relationships XML
   */
  private getRelsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
  }

  /**
   * Get document relationships XML
   */
  private getDocumentRelsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`;
  }

  /**
   * Get main document XML with original content and overlaid signatures
   */
  private getDocumentXml(fields: FieldData[], signatures: SignatureData[], originalContent: string): string {
    let content = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>`;

    // Process original content and overlay signatures at their positions
    const processedContent = this.processContentWithOverlays(originalContent, fields, signatures);
    
    // Add the processed content
    content += processedContent;

    // Add summary section at the end
    content += this.getSummarySection(fields, signatures);

    content += `
  </w:body>
</w:document>`;

    return content;
  }

  /**
   * Process content and overlay signatures at their detected positions
   */
  private processContentWithOverlays(originalContent: string, fields: FieldData[], signatures: SignatureData[]): string {
    if (!originalContent || !originalContent.trim()) {
      return `
    <w:p>
      <w:r>
        <w:t>Original document content could not be extracted.</w:t>
      </w:r>
    </w:p>`;
    }

    let content = '';
    const lines = originalContent.split('\n');
    
    // Create a map of signature positions for quick lookup
    const signaturePositions = new Map<number, SignatureData>();
    signatures.forEach((sig, index) => {
      if (sig.y !== undefined) {
        // Map Y position to line number (approximate)
        const lineNumber = Math.floor(sig.y / 20); // Assuming ~20px per line
        signaturePositions.set(lineNumber, sig);
      }
    });

    // Process each line and overlay signatures
    lines.forEach((line, lineIndex) => {
      const escapedLine = this.escapeXml(line);
      
      // Check if there's a signature for this line
      const signature = signaturePositions.get(lineIndex);
      
      if (signature) {
        // Add the original line
        content += `
    <w:p>
      <w:r>
        <w:t>${escapedLine}</w:t>
      </w:r>
    </w:p>`;
        
        // Add the signature overlay
        content += this.getSignatureOverlay(signature);
      } else {
        // Check if this line contains signature-related text and replace it
        if (this.isSignatureLine(line)) {
          // Find a signature that matches this line
          const matchingSignature = signatures.find(sig => 
            sig.name.toLowerCase().includes('signature') || 
            line.toLowerCase().includes('signature') ||
            line.toLowerCase().includes('חתימה')
          );
          
          if (matchingSignature) {
            // Replace the signature line with the actual signature
            content += this.getSignatureOverlay(matchingSignature);
          } else {
            // Keep the original line
            content += `
    <w:p>
      <w:r>
        <w:t>${escapedLine}</w:t>
      </w:r>
    </w:p>`;
          }
        } else {
          // Regular line, keep as is
          content += `
    <w:p>
      <w:r>
        <w:t>${escapedLine}</w:t>
      </w:r>
    </w:p>`;
        }
      }
    });

    return content;
  }

  /**
   * Check if a line contains signature-related text
   */
  private isSignatureLine(line: string): boolean {
    const signatureKeywords = [
      'signature', 'sign here', 'signature line', 'signature block',
      'חתימה', 'חתום כאן', 'חתימת', 'חתימתי'
    ];
    
    const lowerLine = line.toLowerCase();
    return signatureKeywords.some(keyword => lowerLine.includes(keyword)) ||
           lowerLine.includes('_____') || // Signature line markers
           lowerLine.includes('____') ||
           lowerLine.includes('___');
  }

  /**
   * Get signature overlay XML
   */
  private getSignatureOverlay(signature: SignatureData): string {
    let content = '';
    
    if (signature.type === 'typed') {
      content += `
    <w:p>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Brush Script MT" w:hAnsi="Brush Script MT"/>
          <w:sz w:val="48"/>
          <w:color w:val="000000"/>
        </w:rPr>
        <w:t>${signature.data}</w:t>
      </w:r>
    </w:p>`;
    } else if (signature.type === 'image' || signature.type === 'drawing') {
      content += `
    <w:p>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Brush Script MT" w:hAnsi="Brush Script MT"/>
          <w:sz w:val="48"/>
          <w:color w:val="0066CC"/>
        </w:rPr>
        <w:t>[DRAWN SIGNATURE]</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>   Signature Data: ${signature.data.substring(0, 50)}...</w:t>
      </w:r>
    </w:p>`;
    }
    
    return content;
  }

  /**
   * Get summary section with all filled data
   */
  private getSummarySection(fields: FieldData[], signatures: SignatureData[]): string {
    let content = `
    <w:p>
      <w:r>
        <w:t></w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>--- FILLED DATA SUMMARY ---</w:t>
      </w:r>
    </w:p>`;

    // Add filled fields summary
    if (fields.length > 0) {
      content += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
      </w:pPr>
      <w:r>
        <w:t>FILLED FIELDS</w:t>
      </w:r>
    </w:p>`;
      
      fields.forEach((field, index) => {
        content += `
    <w:p>
      <w:r>
        <w:t>${index + 1}. ${field.name}: ${field.value}</w:t>
      </w:r>
    </w:p>`;
        
        if (field.x !== undefined && field.y !== undefined) {
          content += `
    <w:p>
      <w:r>
        <w:t>   Position: (${field.x}, ${field.y})`;
          if (field.page !== undefined) {
            content += `, Page: ${field.page}`;
          }
          content += `</w:t>
      </w:r>
    </w:p>`;
        }
      });
    }

    // Add signatures summary
    if (signatures.length > 0) {
      content += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
      </w:pPr>
      <w:r>
        <w:t>SIGNATURES APPLIED</w:t>
      </w:r>
    </w:p>`;
      
      signatures.forEach((signature, index) => {
        content += `
    <w:p>
      <w:r>
        <w:t>${index + 1}. ${signature.name} (${signature.type})</w:t>
      </w:r>
    </w:p>`;
        
        if (signature.x !== undefined && signature.y !== undefined) {
          content += `
    <w:p>
      <w:r>
        <w:t>   Position: (${signature.x}, ${signature.y})`;
          if (signature.page !== undefined) {
            content += `, Page: ${signature.page}`;
          }
          content += `</w:t>
      </w:r>
    </w:p>`;
        }
      });
    }

    return content;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Get settings XML
   */
  private getSettingsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:defaultTabStop w:val="720"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
</w:settings>`;
  }

  /**
   * Get styles XML
   */
  private getStylesXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:qFormat/>
    <w:rsid w:val="00B01C87"/>
    <w:pPr>
      <w:spacing w:before="240" w:after="0"/>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
    <w:rPr>
      <w:sz w:val="32"/>
      <w:szCs w:val="32"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:qFormat/>
    <w:rsid w:val="00B01C87"/>
    <w:pPr>
      <w:spacing w:before="240" w:after="0"/>
      <w:outlineLvl w:val="1"/>
    </w:pPr>
    <w:rPr>
      <w:sz w:val="28"/>
      <w:szCs w:val="28"/>
    </w:rPr>
  </w:style>
</w:styles>`;
  }

  /**
   * Get theme XML
   */
  private getThemeXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1>
        <a:srgbClr val="000000"/>
      </a:dk1>
      <a:lt1>
        <a:srgbClr val="FFFFFF"/>
      </a:lt1>
      <a:dk2>
        <a:srgbClr val="1F497D"/>
      </a:dk2>
      <a:lt2>
        <a:srgbClr val="EEECE1"/>
      </a:lt2>
      <a:accent1>
        <a:srgbClr val="4F81BD"/>
      </a:accent1>
      <a:accent2>
        <a:srgbClr val="C0504D"/>
      </a:accent2>
      <a:accent3>
        <a:srgbClr val="9BBB59"/>
      </a:accent3>
      <a:accent4>
        <a:srgbClr val="8064A2"/>
      </a:accent4>
      <a:accent5>
        <a:srgbClr val="4BACC6"/>
      </a:accent5>
      <a:accent6>
        <a:srgbClr val="F79646"/>
      </a:accent6>
      <a:hlink>
        <a:srgbClr val="0000FF"/>
      </a:hlink>
      <a:folHlink>
        <a:srgbClr val="800080"/>
      </a:folHlink>
    </a:clrScheme>
  </a:themeElements>
</a:theme>`;
  }

  /**
   * Get app XML
   */
  private getAppXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>AI Doc Sign</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes" size="2" baseType="variant">
      <vt:variant>
        <vt:lpstr>Title</vt:lpstr>
      </vt:variant>
      <vt:variant>
        <vt:i4>1</vt:i4>
      </vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes" size="1" baseType="lpstr">
      <vt:lpstr>Filled Document</vt:lpstr>
    </vt:vector>
  </TitlesOfParts>
  <Company>AI Doc Sign</Company>
  <LinksUpToDate>false</LinksUpToDate>
  <CharactersWithSpaces>0</CharactersWithSpaces>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>1.0</AppVersion>
</Properties>`;
  }

  /**
   * Get core XML
   */
  private getCoreXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Filled Document</dc:title>
  <dc:subject>Document processed by AI Doc Sign</dc:subject>
  <dc:creator>AI Doc Sign</dc:creator>
  <cp:keywords>AI, Document, Signature</cp:keywords>
  <dc:description>Document filled with form fields and signatures</dc:description>
  <cp:lastModifiedBy>AI Doc Sign</cp:lastModifiedBy>
  <cp:revision>1</cp:revision>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`;
  }

  /**
   * Convert Uint8Array to base64 string
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.byteLength; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }
}

export default new DocxService(); 