import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { aiService } from '../../services/aiService';

const ExploreScreen = () => {
  const features = [
    {
      id: 'ai-analysis',
      title: '🧠 Real AI Analysis',
      subtitle: 'Local LLM Integration',
      description: 'Advanced document analysis using Local LLM for intelligent form detection and processing.',
      icon: 'brain',
      color: '#6366f1',
      details: [
        'Real-time AI document analysis',
        'Intelligent form field detection',
        'Smart question identification',
        'Context-aware suggestions',
        'Risk assessment and recommendations'
      ]
    },
    {
      id: 'multi-language',
      title: '🌍 Multi-Language Support',
      subtitle: '10+ Languages Supported',
      description: 'Automatically detect and process documents in multiple languages with native form fields and questions.',
      icon: 'globe',
      color: '#10b981',
      details: [
        'Automatic language detection',
        'Hebrew, Arabic, Chinese support',
        'Japanese, Korean, Russian support',
        'Thai, Hindi, and more',
        'Native language form fields'
      ]
    },
    {
      id: 'document-types',
      title: '📄 Multiple Document Types',
      subtitle: 'PDF & DOCX Support',
      description: 'Process both PDF and Word documents with intelligent content extraction and analysis.',
      icon: 'document-text',
      color: '#f59e0b',
      details: [
        'PDF document processing',
        'DOCX Word document support',
        'Content extraction and preview',
        'Form field identification',
        'Signature area detection'
      ]
    },
    {
      id: 'smart-filling',
      title: '🤖 Smart Form Filling',
      subtitle: 'AI-Powered Auto-Fill',
      description: 'Intelligent form filling with context-aware suggestions and user profile integration.',
      icon: 'checkmark-circle',
      color: '#ef4444',
      details: [
        'AI-powered field suggestions',
        'User profile integration',
        'Context-aware filling',
        'Validation and error checking',
        'Smart data extraction'
      ]
    },
    {
      id: 'signature-management',
      title: '✍️ Signature Management',
      subtitle: 'Multiple Signature Types',
      description: 'Create, manage, and apply multiple digital signatures with secure storage.',
      icon: 'create',
      color: '#8b5cf6',
      details: [
        'Typed signature creation',
        'Image signature upload',
        'Drawing signature support',
        'Multiple signature storage',
        'Default signature selection'
      ]
    },
    {
      id: 'security',
      title: '🔒 Security & Privacy',
      subtitle: 'Enterprise-Grade Security',
      description: 'Secure document processing with local storage and encrypted data handling.',
      icon: 'shield-checkmark',
      color: '#06b6d4',
      details: [
        'Local document processing',
        'Secure signature storage',
        'Encrypted data handling',
        'No server data retention',
        'Privacy-first approach'
      ]
    }
  ];

  const aiCapabilities = [
    {
      category: 'Document Analysis',
      capabilities: [
        'Language detection and classification',
        'Document type identification',
        'Form field extraction',
        'Question detection and categorization',
        'Signature area identification',
        'Risk assessment and complexity analysis'
      ]
    },
    {
      category: 'Intelligent Processing',
      capabilities: [
        'Context-aware form filling',
        'Smart field validation',
        'Multi-language content understanding',
        'Cultural context awareness',
        'Legal document analysis',
        'Business document processing'
      ]
    },
    {
      category: 'AI Models',
      capabilities: [
        'Local LLM integration',
        'Configurable AI models (llama3, mistral, etc.)',
        'Customizable processing parameters',
        'Fallback analysis when AI unavailable',
        'Real-time processing optimization',
        'Multi-language AI prompts'
      ]
    }
  ];

  const handleFeaturePress = (feature: any) => {
    Alert.alert(
      feature.title,
      feature.description,
      [
        { text: 'Learn More', onPress: () => console.log('Learn more pressed') },
        { text: 'Try It', onPress: () => router.push('/') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleSetupAI = () => {
    Alert.alert(
      'Setup Real AI',
      'To enable real AI functionality:\n\n1. Install Ollama from ollama.ai\n2. Run: ollama pull llama3\n3. Start Ollama: ollama serve\n4. Create a .env file with:\n   EXPO_PUBLIC_LOCAL_LLM_URL=http://localhost:11434\n5. Restart the app',
      [
        { text: 'Get Ollama', onPress: () => console.log('Get Ollama') },
        { text: 'Test Connection', onPress: testLLMConnection },
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const testLLMConnection = async () => {
    try {
      const result = await aiService.testLLMConnection();
      Alert.alert(
        result.success ? '✅ Connection Successful' : '❌ Connection Failed',
        result.message + (result.responseTime ? `\n\nResponse time: ${result.responseTime}ms` : ''),
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to test LLM connection');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AI Document Signer</Text>
        <Text style={styles.subtitle}>Real AI-powered document processing</Text>
      </View>

      {/* AI Setup Banner */}
      <View style={styles.setupBanner}>
        <Ionicons name="rocket" size={24} color="#fff" />
        <View style={styles.setupContent}>
          <Text style={styles.setupTitle}>Enable Real AI</Text>
          <Text style={styles.setupDescription}>
            Set up Local LLM for advanced document analysis
          </Text>
        </View>
        <TouchableOpacity style={styles.setupButton} onPress={handleSetupAI}>
          <Text style={styles.setupButtonText}>Setup</Text>
        </TouchableOpacity>
      </View>

      {/* Features Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✨ Core Features</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[styles.featureCard, { borderLeftColor: feature.color }]}
              onPress={() => handleFeaturePress(feature)}
            >
              <View style={styles.featureHeader}>
                <View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
                  <Ionicons name={feature.icon as any} size={24} color="#fff" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                </View>
              </View>
              <Text style={styles.featureDescription}>{feature.description}</Text>
              <View style={styles.featureDetails}>
                {feature.details.slice(0, 3).map((detail, index) => (
                  <View key={index} style={styles.detailItem}>
                    <Ionicons name="checkmark" size={16} color={feature.color} />
                    <Text style={styles.detailText}>{detail}</Text>
                  </View>
                ))}
                {feature.details.length > 3 && (
                  <Text style={styles.moreDetails}>+{feature.details.length - 3} more</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* AI Capabilities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🤖 AI Capabilities</Text>
        {aiCapabilities.map((category, index) => (
          <View key={index} style={styles.aiCategory}>
            <Text style={styles.categoryTitle}>{category.category}</Text>
            <View style={styles.capabilitiesList}>
              {category.capabilities.map((capability, capIndex) => (
                <View key={capIndex} style={styles.capabilityItem}>
                  <Ionicons name="sparkles" size={16} color="#6366f1" />
                  <Text style={styles.capabilityText}>{capability}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Language Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌍 Supported Languages</Text>
        <View style={styles.languagesGrid}>
          {[
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
            { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
            { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
            { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
            { code: 'ko', name: 'Korean', flag: '🇰🇷' },
            { code: 'ru', name: 'Russian', flag: '🇷🇺' },
            { code: 'th', name: 'Thai', flag: '🇹🇭' },
            { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
          ].map((lang) => (
            <View key={lang.code} style={styles.languageCard}>
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <Text style={styles.languageName}>{lang.name}</Text>
              <Text style={styles.languageCode}>{lang.code.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Get Started */}
      <View style={styles.section}>
        <View style={styles.getStartedCard}>
          <Ionicons name="play-circle" size={48} color="#6366f1" />
          <Text style={styles.getStartedTitle}>Ready to Get Started?</Text>
          <Text style={styles.getStartedDescription}>
            Upload your first document and experience the power of real AI analysis
          </Text>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.getStartedButtonText}>Upload Document</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  setupContent: {
    flex: 1,
    marginLeft: 12,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  setupDescription: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 2,
  },
  setupButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  setupButtonText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  featureSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  featureDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 8,
  },
  moreDetails: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginLeft: 24,
  },
  aiCategory: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  capabilitiesList: {
    gap: 8,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capabilityText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
  },
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  languageCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  languageFlag: {
    fontSize: 24,
    marginBottom: 4,
  },
  languageName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1e293b',
    textAlign: 'center',
  },
  languageCode: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  getStartedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  getStartedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 8,
  },
  getStartedDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  getStartedButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  getStartedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExploreScreen;
