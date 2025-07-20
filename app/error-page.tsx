import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../components/ThemedText';

export default function ErrorPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const error = params.error as string || 'An unknown error occurred';
  const onRetry = params.onRetry as string;

  const handleBack = () => {
    // Navigate back with a parameter indicating this is a "back" action, not a retry
    router.push({
      pathname: router.canGoBack() ? '..' : '/',
      params: { action: 'back' }
    });
  };

  const handleRetry = () => {
    // Navigate back with a parameter indicating this is a "retry" action
    router.push({
      pathname: router.canGoBack() ? '..' : '/',
      params: { action: 'retry' }
    });
  };

  const getErrorIcon = () => {
    return '⚠️';
  };

  const getErrorTitle = () => {
    if (error.includes('timeout')) {
      return 'Connection Timeout';
    } else if (error.includes('Backend processing failed')) {
      return 'Processing Error';
    } else if (error.includes('network')) {
      return 'Network Error';
    } else {
      return 'Something Went Wrong';
    }
  };

  const getErrorDescription = () => {
    if (error.includes('timeout')) {
      return 'The request took too long to complete. Please check your connection and try again.';
    } else if (error.includes('Backend processing failed')) {
      return 'There was an issue processing your document. Please try again or contact support if the problem persists.';
    } else if (error.includes('network')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    } else {
      return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>{getErrorIcon()}</Text>
          
          <ThemedText style={styles.errorTitle}>
            {getErrorTitle()}
          </ThemedText>
          
          <ThemedText style={styles.errorDescription}>
            {getErrorDescription()}
          </ThemedText>
          
          <View style={styles.errorDetails}>
            <ThemedText style={styles.errorDetailsTitle}>
              Error Details:
            </ThemedText>
            <Text style={styles.errorMessage}>
              {error}
            </Text>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.retryButton]} 
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>
              Try Again
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.backButton]} 
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.helpContainer}>
          <ThemedText style={styles.helpTitle}>
            Need Help?
          </ThemedText>
          <ThemedText style={styles.helpText}>
            If you continue to experience issues, please contact our support team.
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    opacity: 0.8,
  },
  errorDetails: {
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    marginTop: 20,
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#d32f2f',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 40,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#2196F3',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  backButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpContainer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
}); 