import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';

interface SignatureDrawerProps {
  value?: string;
  onSignatureChange: (signatureData: string) => void;
  label: string;
}

export default function SignatureDrawer({ value, onSignatureChange, label }: SignatureDrawerProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const signatureRef = useRef<any>(null);

  const handleSignature = (signature: string) => {
    onSignatureChange(signature);
    setIsModalVisible(false);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleConfirm = () => {
    signatureRef.current?.readSignature();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const hasSignature = value && value.length > 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.signatureButton, hasSignature && styles.signatureButtonFilled]}
        onPress={() => setIsModalVisible(true)}
      >
        <Ionicons name="create" size={24} color={hasSignature ? "#34C759" : "#007AFF"} />
        <Text style={[styles.signatureButtonText, hasSignature && styles.signatureButtonTextFilled]}>
          {hasSignature ? 'Signature Added ✓' : 'Draw Signature'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Draw Your Signature</Text>
            <Text style={styles.modalSubtitle}>{label}</Text>
          </View>

          <View style={styles.signatureContainer}>
            <SignatureCanvas
              ref={signatureRef}
              onOK={handleSignature}
              onEmpty={() => Alert.alert('Error', 'Please draw your signature')}
              descriptionText=""
              clearText="Clear"
              confirmText="Save"
              webStyle={`
                .m-signature-pad--footer {
                  display: none;
                }
                .m-signature-pad--body {
                  border: 1px solid #e1e5e9;
                  border-radius: 8px;
                }
              `}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleClear}>
              <Ionicons name="trash" size={20} color="#FF3B30" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleCancel}>
              <Ionicons name="close" size={20} color="#666" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>Save Signature</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  signatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderStyle: 'dashed',
  },
  signatureButtonFilled: {
    backgroundColor: '#E8F5E8',
    borderColor: '#34C759',
    borderStyle: 'solid',
  },
  signatureButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 12,
    fontWeight: '500',
  },
  signatureButtonTextFilled: {
    color: '#34C759',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    backgroundColor: '#f8f9fa',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  signatureContainer: {
    flex: 1,
    margin: 20,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    backgroundColor: '#f8f9fa',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 6,
    fontWeight: '500',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
}); 