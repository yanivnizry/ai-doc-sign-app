import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);

  const pickDocument = async () => {
    try {
      setIsProcessing(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsProcessing(false);
        return;
      }

      const file = result.assets[0];
      console.log('Selected file:', file);

      // Check file type
      const fileExtension = file.name?.toLowerCase().split('.').pop();
      const isPdf = fileExtension === 'pdf';
      const isDocx = fileExtension === 'docx';

      if (!isPdf && !isDocx) {
        Alert.alert('Unsupported Format', 'Please select a PDF or DOCX file');
        setIsProcessing(false);
        return;
      }

      // Navigate to document processing screen
      router.push({
        pathname: '/document-processor',
        params: { 
          uri: file.uri,
          name: file.name,
          size: file.size,
          type: isPdf ? 'pdf' : 'docx'
        }
      });

    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
      console.error('Document picker error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openRecentDocument = (document: any) => {
    router.push({
      pathname: '/document-processor',
      params: { 
        uri: document.uri,
        name: document.name,
        size: document.size 
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Document Signer</Text>
          <Text style={styles.subtitle}>Upload PDFs and DOCX files for AI-powered signing</Text>
        </View>

        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <TouchableOpacity 
            style={[styles.uploadButton, isProcessing && styles.uploadButtonDisabled]}
            onPress={pickDocument}
            disabled={isProcessing}
          >
            <Ionicons 
              name={isProcessing ? "cloud-upload" : "cloud-upload-outline"} 
              size={48} 
              color={isProcessing ? "#666" : "#007AFF"} 
            />
            <Text style={[styles.uploadText, isProcessing && styles.uploadTextDisabled]}>
              {isProcessing ? 'Processing...' : 'Upload Document'}
            </Text>
            <Text style={styles.uploadSubtext}>
              Select a PDF or DOCX file to analyze and sign
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
