import React from 'react';
import { Modal, View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

interface AttachmentViewerProps {
  uri: string | null;
  fileName?: string;
  onClose: () => void;
}

export function AttachmentViewer({ uri, fileName, onClose }: AttachmentViewerProps) {
  if (!uri) return null;

  const isImage = /\.(png|jpg|jpeg|webp|heic)$/i.test(uri);

  const handleOpenPdf = async () => {
    try {
      // If it's a remote URL, download it locally first for smooth sharing/viewing
      if (uri.startsWith('http')) {
        const localUri = `${FileSystem.cacheDirectory}${fileName || 'document.pdf'}`;
        const downloadResult = await FileSystem.downloadAsync(uri, localUri);
        if (downloadResult.status === 200) {
          await Sharing.shareAsync(downloadResult.uri);
        }
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.error('Failed to open PDF:', error);
    }
  };

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalHeader}>
          <Text style={styles.fileNameText} numberOfLines={1}>{fileName || 'Attachment'}</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={20} color="#0F172A" />
          </Pressable>
        </View>

        <View style={styles.contentContainer}>
          {isImage ? (
            <Image source={{ uri }} style={styles.fullImage} resizeMode="contain" />
          ) : (
            <View style={styles.pdfFallbackContainer}>
              <MaterialCommunityIcons name="file-pdf-box" size={64} color="#2563EB" />
              <Text style={styles.pdfTitle}>PDF Document</Text>
              <Text style={styles.pdfSubtitle}>Tap below to open or view this document</Text>
              <Pressable onPress={handleOpenPdf} style={styles.openPdfButton}>
                <MaterialCommunityIcons name="share-outline" size={18} color="#FFFFFF" />
                <Text style={styles.openPdfButtonText}>Open / Share PDF</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.9)', justifyContent: 'center', padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  fileNameText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', flex: 1, marginRight: 12 },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 16, overflow: 'hidden' },
  fullImage: { width: '100%', height: '80%' },
  pdfFallbackContainer: { alignItems: 'center', backgroundColor: '#FFFFFF', padding: 24, borderRadius: 20, width: '90%', gap: 10 },
  pdfTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  pdfSubtitle: { fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 10 },
  openPdfButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  openPdfButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});