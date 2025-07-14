import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import aiService from '../../services/aiService';

export default function HomeScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [sharedFileInfo, setSharedFileInfo] = useState<any>(null);
  const [recentDocuments] = useState([
    { name: 'Employment Contract.docx', date: '2024-01-15' },
    { name: 'Legal Waiver.pdf', date: '2024-01-10' },
    { name: 'Application Form.docx', date: '2024-01-05' }
  ]);

  useEffect(() => {
    // Check if app was opened with a shared file
    const checkInitialFile = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && (initialUrl.startsWith('file://') || initialUrl.startsWith('content://'))) {
          setSharedFileInfo({
            uri: initialUrl,
            name: initialUrl.split('/').pop() || 'Shared File',
            type: 'shared'
          });
        }
      } catch (error) {
        console.error('Error checking initial file:', error);
      }
    };

    checkInitialFile();
  }, []);

  const pickDocument = async () => {
    try {
      setIsProcessing(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('Document picker canceled');
        return;
      }

      const file = result.assets[0];
      console.log('Selected file:', file);

      // Determine file type
      let fileType: 'pdf' | 'docx' = 'pdf';
      if (file.name?.endsWith('.docx') || file.mimeType?.includes('wordprocessingml')) {
        fileType = 'docx';
      }

      // Navigate to document processor with file info
      router.push({
        pathname: '/document-processor',
        params: {
          uri: file.uri,
          name: file.name,
          size: file.size,
          type: fileType,
          mimeType: file.mimeType
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
      console.error('Document picker error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processSharedFile = () => {
    if (sharedFileInfo) {
      router.push({
        pathname: '/document-processor',
        params: {
          uri: sharedFileInfo.uri,
          name: sharedFileInfo.name,
          type: sharedFileInfo.name.endsWith('.docx') ? 'docx' : 'pdf'
        }
      });
      setSharedFileInfo(null); // Clear the shared file info
    }
  };

  const testAIConnection = async () => {
    try {
      setIsTestingAI(true);
      console.log('Testing AI connection...');
      
      const result = await aiService.testAIConnection();
      
      if (result.success) {
        Alert.alert(
          'AI Test Successful', 
          `AI is working!\n\nFields found: ${result.data?.formFields || 0}\nQuestions: ${result.data?.questions || 0}\nSignatures: ${result.data?.signatures || 0}`
        );
      } else {
        Alert.alert('AI Test Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test AI connection');
      console.error('AI test error:', error);
    } finally {
      setIsTestingAI(false);
    }
  };

  const openRecentDocument = (document: any) => {
    Alert.alert('Recent Document', `Opening ${document.name}`);
    // In a real app, you would open the actual document
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Doc Sign</Text>
          <Text style={styles.subtitle}>Upload and sign documents with AI assistance</Text>
        </View>

        {/* Shared File Notification */}
        {sharedFileInfo && (
          <View style={styles.sharedFileNotification}>
            <Ionicons name="document" size={24} color="#007AFF" />
            <View style={styles.sharedFileInfo}>
              <Text style={styles.sharedFileName}>{sharedFileInfo.name}</Text>
              <Text style={styles.sharedFileText}>File shared to app</Text>
            </View>
            <TouchableOpacity 
              style={styles.processSharedButton}
              onPress={processSharedFile}
            >
              <Text style={styles.processSharedButtonText}>Process</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <TouchableOpacity 
            style={[styles.uploadButton, isProcessing && styles.uploadButtonDisabled]}
            onPress={pickDocument}
            disabled={isProcessing}
          >
            <Ionicons name="cloud-upload" size={48} color={isProcessing ? '#666' : '#007AFF'} />
            <Text style={[styles.uploadText, isProcessing && styles.uploadTextDisabled]}>
              {isProcessing ? 'Processing...' : 'Upload Document'}
            </Text>
            <Text style={styles.uploadSubtext}>
              Select a PDF or DOCX file to analyze and sign
            </Text>
          </TouchableOpacity>

          {/* AI Test Button */}
          <TouchableOpacity 
            style={[styles.testButton, isTestingAI && styles.testButtonDisabled]}
            onPress={testAIConnection}
            disabled={isTestingAI}
          >
            <Ionicons name="bug" size={24} color={isTestingAI ? '#666' : '#FF9500'} />
            <Text style={[styles.testButtonText, isTestingAI && styles.testButtonTextDisabled]}>
              {isTestingAI ? 'Testing...' : 'Test AI Connection'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What AI Can Do</Text>
          
          <View style={styles.featureGrid}>
            <View style={styles.featureCard}>
              <Ionicons name="search" size={24} color="#007AFF" />
              <Text style={styles.featureTitle}>Detect Form Fields</Text>
              <Text style={styles.featureDescription}>
                Automatically identify input fields, checkboxes, and signature areas
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="create" size={24} color="#007AFF" />
              <Text style={styles.featureTitle}>Smart Signing</Text>
              <Text style={styles.featureDescription}>
                Apply your signature to all required locations in the document
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="help-circle" size={24} color="#007AFF" />
              <Text style={styles.featureTitle}>Question Detection</Text>
              <Text style={styles.featureDescription}>
                Highlight and identify questions that need your attention
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
              <Text style={styles.featureTitle}>Auto-Fill</Text>
              <Text style={styles.featureDescription}>
                Intelligently fill common fields based on your profile
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Documents */}
        {recentDocuments.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Documents</Text>
            {recentDocuments.map((doc, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.recentDocument}
                onPress={() => openRecentDocument(doc)}
              >
                <Ionicons name="document-text" size={24} color="#007AFF" />
                <View style={styles.recentDocumentInfo}>
                  <Text style={styles.recentDocumentName}>{doc.name}</Text>
                  <Text style={styles.recentDocumentDate}>{doc.date}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sharedFileNotification: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  sharedFileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sharedFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sharedFileText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  processSharedButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  processSharedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  uploadSection: {
    padding: 20,
  },
  uploadButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  uploadButtonDisabled: {
    borderColor: '#ccc',
    backgroundColor: '#f8f9fa',
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadTextDisabled: {
    color: '#666',
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  testButtonDisabled: {
    borderColor: '#ccc',
    backgroundColor: '#f8f9fa',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
    marginLeft: 8,
  },
  testButtonTextDisabled: {
    color: '#666',
  },
  featuresSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  recentSection: {
    padding: 20,
  },
  recentDocument: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recentDocumentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recentDocumentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  recentDocumentDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
