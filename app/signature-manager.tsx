import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Signature {
  id: string;
  name: string;
  type: 'drawing' | 'typed' | 'image';
  data: string;
  isDefault: boolean;
  createdAt: string;
}

export default function SignatureManagerScreen() {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSignatureName, setNewSignatureName] = useState('');
  const [newSignatureType, setNewSignatureType] = useState<'drawing' | 'typed' | 'image'>('typed');
  const [typedSignature, setTypedSignature] = useState('');

  const loadSignatures = async () => {
    try {
      const storedSignatures = await SecureStore.getItemAsync('user_signatures');
      if (storedSignatures) {
        setSignatures(JSON.parse(storedSignatures));
      }
    } catch (error) {
      console.error('Error loading signatures:', error);
    }
  };

  const saveSignatures = async (updatedSignatures: Signature[]) => {
    try {
      await SecureStore.setItemAsync('user_signatures', JSON.stringify(updatedSignatures));
      setSignatures(updatedSignatures);
    } catch (error) {
      console.error('Error saving signatures:', error);
    }
  };

  const createSignature = async () => {
    if (!newSignatureName.trim()) {
      Alert.alert('Error', 'Please enter a signature name');
      return;
    }

    if (newSignatureType === 'typed' && !typedSignature.trim()) {
      Alert.alert('Error', 'Please enter your signature text');
      return;
    }

    const newSignature: Signature = {
      id: Date.now().toString(),
      name: newSignatureName.trim(),
      type: newSignatureType,
      data: newSignatureType === 'typed' ? typedSignature.trim() : '',
      isDefault: signatures.length === 0,
      createdAt: new Date().toISOString(),
    };

    const updatedSignatures = [...signatures, newSignature];
    await saveSignatures(updatedSignatures);

    setNewSignatureName('');
    setTypedSignature('');
    setIsCreating(false);
    setNewSignatureType('typed');
  };

  const setDefaultSignature = async (signatureId: string) => {
    const updatedSignatures = signatures.map(sig => ({
      ...sig,
      isDefault: sig.id === signatureId
    }));
    await saveSignatures(updatedSignatures);
  };

  const deleteSignature = async (signatureId: string) => {
    Alert.alert(
      'Delete Signature',
      'Are you sure you want to delete this signature?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedSignatures = signatures.filter(sig => sig.id !== signatureId);
            await saveSignatures(updatedSignatures);
          }
        }
      ]
    );
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const newSignature: Signature = {
          id: Date.now().toString(),
          name: newSignatureName.trim() || 'Image Signature',
          type: 'image',
          data: result.assets[0].base64 || '',
          isDefault: signatures.length === 0,
          createdAt: new Date().toISOString(),
        };

        const updatedSignatures = [...signatures, newSignature];
        await saveSignatures(updatedSignatures);
        setNewSignatureName('');
        setIsCreating(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  React.useEffect(() => {
    loadSignatures();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Signature Manager</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Create New Signature */}
        {!isCreating ? (
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setIsCreating(true)}
          >
            <Ionicons name="add-circle" size={24} color="#007AFF" />
            <Text style={styles.createButtonText}>Create New Signature</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.createForm}>
            <Text style={styles.formTitle}>Create New Signature</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Signature Name"
              value={newSignatureName}
              onChangeText={setNewSignatureName}
            />

            <View style={styles.typeSelector}>
              <Text style={styles.typeLabel}>Signature Type:</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newSignatureType === 'typed' && styles.typeButtonActive
                  ]}
                  onPress={() => setNewSignatureType('typed')}
                >
                  <Ionicons 
                    name="text" 
                    size={20} 
                    color={newSignatureType === 'typed' ? '#fff' : '#007AFF'} 
                  />
                  <Text style={[
                    styles.typeButtonText,
                    newSignatureType === 'typed' && styles.typeButtonTextActive
                  ]}>
                    Typed
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newSignatureType === 'image' && styles.typeButtonActive
                  ]}
                  onPress={() => setNewSignatureType('image')}
                >
                  <Ionicons 
                    name="image" 
                    size={20} 
                    color={newSignatureType === 'image' ? '#fff' : '#007AFF'} 
                  />
                  <Text style={[
                    styles.typeButtonText,
                    newSignatureType === 'image' && styles.typeButtonTextActive
                  ]}>
                    Image
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {newSignatureType === 'typed' && (
              <TextInput
                style={styles.signatureInput}
                placeholder="Enter your signature"
                value={typedSignature}
                onChangeText={setTypedSignature}
                multiline
              />
            )}

            {newSignatureType === 'image' && (
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} color="#007AFF" />
                <Text style={styles.imagePickerText}>Select Image</Text>
              </TouchableOpacity>
            )}

            <View style={styles.formButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setIsCreating(false);
                  setNewSignatureName('');
                  setTypedSignature('');
                  setNewSignatureType('typed');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.saveButton}
                onPress={createSignature}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Existing Signatures */}
        <View style={styles.signaturesSection}>
          <Text style={styles.sectionTitle}>Your Signatures</Text>
          
          {signatures.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="create-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No signatures yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Create your first signature to get started
              </Text>
            </View>
          ) : (
            signatures.map((signature) => (
              <View key={signature.id} style={styles.signatureItem}>
                <View style={styles.signatureInfo}>
                                   <View style={styles.signatureHeader}>
                   <Text style={styles.signatureName}>{signature.name}</Text>
                   {signature.isDefault && (
                     <View style={styles.defaultBadge}>
                       <Text style={styles.defaultBadgeText}>Default</Text>
                     </View>
                   )}
                 </View>
                  <Text style={styles.signatureType}>
                    {signature.type.charAt(0).toUpperCase() + signature.type.slice(1)} Signature
                  </Text>
                  <Text style={styles.signatureDate}>
                    Created {new Date(signature.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.signatureActions}>
                  {!signature.isDefault && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => setDefaultSignature(signature.id)}
                    >
                      <Ionicons name="star-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => deleteSignature(signature.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 12,
  },
  createForm: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    flex: 1,
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  signatureInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontStyle: 'italic',
    minHeight: 60,
    marginBottom: 16,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  signaturesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  signatureItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  signatureInfo: {
    flex: 1,
  },
  signatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  defaultBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  signatureType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  signatureDate: {
    fontSize: 12,
    color: '#999',
  },
  signatureActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
}); 