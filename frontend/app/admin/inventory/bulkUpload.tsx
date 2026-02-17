import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';

const COLORS = {
  primary: '#3C2253',
  background: '#FFFFFF',
  white: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  success: '#10B981',
};

export default function BulkImageUpload() {
  const [csvFile, setCsvFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const pickCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets[0]) {
        setCsvFile(result.assets[0]);
        Alert.alert('Success', 'CSV file selected. Format: item_name,image_url');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick CSV file');
    }
  };

  const uploadImages = async () => {
    if (!csvFile) {
      Alert.alert('Error', 'Please select a CSV file first');
      return;
    }

    try {
      setUploading(true);
      
      // Read CSV file
      const fileContent = await FileSystem.readAsStringAsync(csvFile.uri);
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      setProgress({ current: 0, total: lines.length });

      let updated = 0;
      let failed = 0;

      for (let i = 0; i < lines.length; i++) {
        const [itemName, imageUrl] = lines[i].split(',').map(s => s.trim());
        
        if (!itemName || !imageUrl) continue;

        try {
          const response = await api.post('/api/inventory/update-image', {
            itemName,
            imageUrl
          });

          if (response.status === 200 || response.status === 201) {
            updated++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }

        setProgress({ current: i + 1, total: lines.length });
      }

      setUploading(false);
      Alert.alert(
        'Upload Complete',
        `✅ Updated: ${updated}\n❌ Failed: ${failed}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );

    } catch (error) {
      setUploading(false);
      Alert.alert('Error', 'Failed to process CSV file');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Bulk Image Upload</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📋 Instructions</Text>
        <Text style={styles.instruction}>1. Create a CSV file with format:</Text>
        <View style={styles.codeBox}>
          <Text style={styles.code}>item_name,image_url</Text>
          <Text style={styles.code}>Tomato,https://example.com/tomato.jpg</Text>
          <Text style={styles.code}>Onion,https://example.com/onion.jpg</Text>
        </View>
        <Text style={styles.instruction}>2. Select the CSV file</Text>
        <Text style={styles.instruction}>3. Click Upload to update all items</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📁 Select CSV File</Text>
        
        <TouchableOpacity 
          style={styles.pickButton}
          onPress={pickCSV}
          disabled={uploading}
        >
          <Ionicons name="document-text" size={24} color={COLORS.white} />
          <Text style={styles.pickButtonText}>Choose CSV File</Text>
        </TouchableOpacity>

        {csvFile && (
          <View style={styles.fileInfo}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.fileName}>{csvFile.name}</Text>
          </View>
        )}
      </View>

      {csvFile && (
        <TouchableOpacity 
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={uploadImages}
          disabled={uploading}
        >
          <Ionicons 
            name={uploading ? "hourglass" : "cloud-upload"} 
            size={24} 
            color={COLORS.white} 
          />
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Uploading...' : 'Upload Images'}
          </Text>
        </TouchableOpacity>
      )}

      {uploading && (
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>
            Progress: {progress.current} / {progress.total}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(progress.current / progress.total) * 100}%` }
              ]} 
            />
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>💡 Tips</Text>
        <Text style={styles.tip}>• Use Cloudinary URLs for better performance</Text>
        <Text style={styles.tip}>• Item names must match exactly (case-sensitive)</Text>
        <Text style={styles.tip}>• Process up to 100 items at once</Text>
        <Text style={styles.tip}>• Invalid URLs will be skipped</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  codeBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  pickButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  pickButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    gap: 8,
  },
  fileName: {
    fontSize: 14,
    color: COLORS.success,
    flex: 1,
  },
  uploadButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  tip: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
});
