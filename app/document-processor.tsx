import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import aiService, { AIProcessingResult, DocumentAnalysis, FormField, Question } from '../services/aiService';

export default function DocumentProcessorScreen() {
  const params = useLocalSearchParams();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentInfo, setDocumentInfo] = useState<any>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState<'analyzing' | 'reviewing' | 'signing' | 'complete'>('analyzing');
  const [documentType, setDocumentType] = useState<'pdf' | 'docx'>('pdf');
  const [documentContent, setDocumentContent] = useState<string>('');
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [processingResult, setProcessingResult] = useState<AIProcessingResult | null>(null);
  const [insights, setInsights] = useState<{ insights: string[]; recommendations: string[]; riskLevel: 'low' | 'medium' | 'high' } | null>(null);

  useEffect(() => {
    if (params.uri) {
      // Determine document type from file extension or mime type
      let detectedType: 'pdf' | 'docx' = 'pdf';
      const uri = params.uri as string;
      const name = params.name as string;
      
      if (uri.includes('.docx') || name?.includes('.docx') || params.mimeType?.includes('wordprocessingml')) {
        detectedType = 'docx';
      } else if (uri.includes('.pdf') || name?.includes('.pdf') || params.mimeType?.includes('pdf')) {
        detectedType = 'pdf';
      }
      
      console.log('Document type detection:', {
        uri,
        name,
        mimeType: params.mimeType,
        detectedType,
        paramType: params.type
      });
      
      setDocumentType(detectedType);
      analyzeDocument();
    }
  }, [params.uri]);

  const analyzeDocument = async () => {
    try {
      setIsAnalyzing(true);
      
      console.log('Starting analysis with document type:', documentType);
      
      // Use the enhanced AI service for document analysis
      const aiAnalysis = await aiService.analyzeDocument(params.uri as string, documentType);
      setAnalysis(aiAnalysis);
      
      // Extract content for DOCX files
      if (documentType === 'docx' && aiAnalysis.content) {
        setDocumentContent(aiAnalysis.content);
        console.log('DOCX Content extracted:', aiAnalysis.content.substring(0, 200) + '...');
      }
      
      setFormFields(aiAnalysis.formFields);
      setQuestions(aiAnalysis.questions);
      setDocumentInfo({
        name: params.name || 'Document',
        size: params.size || 0,
        pages: aiAnalysis.documentInfo.pages,
        type: documentType.toUpperCase(),
        language: aiAnalysis.documentInfo.language,
        category: aiAnalysis.documentInfo.category
      });

      // Get AI insights
      const documentInsights = await aiService.getDocumentInsights(aiAnalysis);
      setInsights(documentInsights);
      
      setCurrentStep('reviewing');
    } catch (error) {
      Alert.alert('Error', `Failed to analyze ${documentType.toUpperCase()} document`);
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processDocument = async () => {
    try {
      setIsProcessing(true);
      setCurrentStep('signing');
      
      // Use the enhanced AI service for complete document processing
      const result = await aiService.processDocument(
        params.uri as string,
        documentType,
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1 (555) 123-4567',
          occupation: 'Software Engineer',
          experience: '5 years',
          preferences: {
            salary_range: '$70,000 - $90,000',
            location_preference: 'Remote',
            source: 'LinkedIn'
          }
        }
      );
      
      setProcessingResult(result);
      setCurrentStep('complete');
    } catch (error) {
      Alert.alert('Error', `Failed to process ${documentType.toUpperCase()} document`);
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadDocument = async () => {
    try {
      const documentUri = processingResult?.signedDocumentUri || params.uri as string;
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(documentUri, {
          mimeType: documentType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          dialogTitle: `Download ${documentInfo?.name}`,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download document');
      console.error('Download error:', error);
    }
  };

  const renderAnalyzingStep = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.stepTitle}>AI Analysis in Progress</Text>
      <Text style={styles.stepDescription}>
        Our AI is intelligently scanning your {documentType.toUpperCase()} document for form fields, signatures, and questions...
      </Text>
      <View style={styles.progressSteps}>
        <Text style={styles.progressStep}>✓ Document uploaded</Text>
        <Text style={styles.progressStep}>🔄 AI field detection</Text>
        <Text style={styles.progressStep}>⏳ Question analysis</Text>
        <Text style={styles.progressStep}>⏳ Signature identification</Text>
      </View>
    </View>
  );

  const renderReviewingStep = () => (
    <ScrollView style={styles.scrollView}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Analysis Complete</Text>
        <Text style={styles.documentInfo}>
          {documentInfo?.name} • {Math.round((documentInfo?.size || 0) / 1024)}KB • {documentInfo?.type} • {documentInfo?.pages} page(s)
        </Text>
        {documentInfo?.language && (
          <Text style={styles.documentInfo}>Language: {documentInfo.language.toUpperCase()}</Text>
        )}
        {documentInfo?.category && (
          <Text style={styles.documentInfo}>Category: {documentInfo.category.replace('_', ' ').toUpperCase()}</Text>
        )}
        {documentType === 'docx' && documentContent && (
          <Text style={styles.contentPreview}>
            Content Preview: {documentContent.substring(0, 100)}...
          </Text>
        )}
      </View>

      {insights && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
          <View style={[styles.riskBadge, insights.riskLevel === 'low' ? styles.riskLow : insights.riskLevel === 'medium' ? styles.riskMedium : styles.riskHigh]}>
            <Text style={styles.riskText}>Risk Level: {insights.riskLevel.toUpperCase()}</Text>
          </View>
          {insights.insights.map((insight, index) => (
            <Text key={index} style={styles.insightText}>• {insight}</Text>
          ))}
          {insights.recommendations.length > 0 && (
            <Text style={styles.recommendationsTitle}>Recommendations:</Text>
          )}
          {insights.recommendations.map((rec, index) => (
            <Text key={index} style={styles.recommendationText}>• {rec}</Text>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Form Fields Found ({formFields.length})</Text>
        {formFields.length === 0 ? (
          <Text style={styles.noFieldsText}>No form fields detected in this document.</Text>
        ) : (
          formFields.map((field) => (
            <View key={field.id} style={styles.fieldItem}>
              <View style={styles.fieldHeader}>
                <Ionicons 
                  name={field.type === 'signature' ? 'create' : field.type === 'checkbox' ? 'checkbox' : 'text'} 
                  size={20} 
                  color="#007AFF" 
                />
                <Text style={styles.fieldLabel}>{field.label}</Text>
                {field.required && <Text style={styles.requiredBadge}>Required</Text>}
                <Text style={styles.confidenceBadge}>{Math.round(field.confidence * 100)}%</Text>
              </View>
              <Text style={styles.fieldType}>{field.type.toUpperCase()}</Text>
              {field.suggestions && field.suggestions.length > 0 && (
                <Text style={styles.suggestionsText}>AI Suggestions: {field.suggestions.slice(0, 2).join(', ')}</Text>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Questions Found ({questions.length})</Text>
        {questions.map((question) => (
          <View key={question.id} style={styles.questionItem}>
            <View style={styles.questionHeader}>
              <Ionicons name="help-circle" size={20} color="#FF9500" />
              <Text style={styles.questionText}>{question.text}</Text>
              <Text style={styles.confidenceBadge}>{Math.round(question.confidence * 100)}%</Text>
            </View>
            <Text style={styles.questionType}>{question.type.replace('_', ' ').toUpperCase()}</Text>
            {question.aiSuggestion && (
              <Text style={styles.aiSuggestionText}>AI Suggestion: {question.aiSuggestion}</Text>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.processButton}
        onPress={processDocument}
        disabled={isProcessing}
      >
        <Text style={styles.processButtonText}>
          {isProcessing ? 'Processing...' : `AI-Powered Sign & Process ${documentType.toUpperCase()} Document`}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSigningStep = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.stepTitle}>AI-Powered Document Processing</Text>
      <Text style={styles.stepDescription}>
        Our AI is intelligently filling forms, answering questions, and applying signatures...
      </Text>
      <View style={styles.progressSteps}>
        <Text style={styles.progressStep}>✓ Document analyzed</Text>
        <Text style={styles.progressStep}>🔄 AI form filling</Text>
        <Text style={styles.progressStep}>🔄 Question answering</Text>
        <Text style={styles.progressStep}>⏳ Signature application</Text>
        <Text style={styles.progressStep}>⏳ Document validation</Text>
      </View>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.centerContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={80} color="#34C759" />
      </View>
      <Text style={styles.stepTitle}>AI Processing Complete!</Text>
      <Text style={styles.stepDescription}>
        Your {documentType.toUpperCase()} document has been intelligently processed with AI assistance.
      </Text>
      
      {processingResult && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Processing Results:</Text>
          <Text style={styles.resultText}>• {processingResult.filledFields.length} fields filled</Text>
          <Text style={styles.resultText}>• {processingResult.answeredQuestions.length} questions answered</Text>
          <Text style={styles.resultText}>• Processing time: {processingResult.processingTime.toFixed(1)}s</Text>
          {processingResult.errors && processingResult.errors.length > 0 && (
            <Text style={styles.errorText}>• {processingResult.errors.length} validation errors</Text>
          )}
          {processingResult.warnings && processingResult.warnings.length > 0 && (
            <Text style={styles.warningText}>• {processingResult.warnings.length} warnings</Text>
          )}
        </View>
      )}
      
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={downloadDocument}>
          <Ionicons name="download" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Download</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={downloadDocument}>
          <Ionicons name="share" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.homeButton}
        onPress={() => router.back()}
      >
        <Text style={styles.homeButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {currentStep === 'analyzing' && renderAnalyzingStep()}
      {currentStep === 'reviewing' && renderReviewingStep()}
      {currentStep === 'signing' && renderSigningStep()}
      {currentStep === 'complete' && renderCompleteStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  progressSteps: {
    marginTop: 20,
    alignItems: 'flex-start',
  },
  progressStep: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  documentInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  contentPreview: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  riskLow: {
    backgroundColor: '#E8F5E8',
  },
  riskMedium: {
    backgroundColor: '#FFF3E0',
  },
  riskHigh: {
    backgroundColor: '#FFEBEE',
  },
  riskText: {
    fontSize: 14,
    fontWeight: '600',
  },
  insightText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  fieldItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginLeft: 8,
    flex: 1,
  },
  requiredBadge: {
    fontSize: 12,
    color: '#FF3B30',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  confidenceBadge: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  fieldType: {
    fontSize: 12,
    color: '#666',
    marginLeft: 28,
  },
  suggestionsText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 28,
    marginTop: 4,
    fontStyle: 'italic',
  },
  questionItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  questionType: {
    fontSize: 12,
    color: '#666',
    marginLeft: 28,
  },
  aiSuggestionText: {
    fontSize: 12,
    color: '#FF9500',
    marginLeft: 28,
    marginTop: 4,
    fontStyle: 'italic',
  },
  processButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    alignItems: 'center',
  },
  processButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  successIcon: {
    marginBottom: 20,
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9500',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 30,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
  homeButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  noFieldsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
}); 