import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Pdf from 'react-native-pdf';
import { WebView } from 'react-native-webview';

interface AttachmentViewerProps {
  uri: string | null;
  fileName?: string;
  onClose: () => void;
}

function getExtension(fileName: string, uri: string) {
  const source = fileName || uri.split('?')[0].split('#')[0];
  return source.split('.').pop()?.toLowerCase() || '';
}

export function AttachmentViewer({ uri, fileName = 'Attachment', onClose }: AttachmentViewerProps) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const failed = failedUri === uri;
  const extension = useMemo(() => uri ? getExtension(fileName, uri) : '', [fileName, uri]);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(extension);
  const isPdf = extension === 'pdf';
  const isText = ['txt', 'csv', 'html', 'htm', 'json', 'xml', 'md'].includes(extension);

  if (!uri) return null;

  const openExternally = () => {
    void Linking.openURL(uri).catch(() => setFailedUri(uri));
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close attachment" style={styles.iconButton}>
            <MaterialCommunityIcons name="close" size={22} color="#344B62" />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>{fileName}</Text>
          <Pressable onPress={openExternally} accessibilityRole="button" accessibilityLabel="Open attachment in another app" style={styles.iconButton}>
            <MaterialCommunityIcons name="open-in-new" size={20} color="#2D66C8" />
          </Pressable>
        </View>
        <View style={styles.content}>
          {failed ? (
            <View style={styles.messageState}>
              <MaterialCommunityIcons name="file-alert-outline" size={34} color="#8797A6" />
              <Text style={styles.messageTitle}>Could not preview this file</Text>
              <Text style={styles.messageText}>Try opening it with another app.</Text>
              <Pressable onPress={openExternally} style={styles.openButton}>
                <Text style={styles.openButtonText}>Open externally</Text>
              </Pressable>
            </View>
          ) : isImage ? (
            <Image source={{ uri }} resizeMode="contain" style={styles.image} onError={() => setFailedUri(uri)} />
          ) : isPdf ? (
            <Pdf
              source={{ uri, cache: true }}
              style={styles.pdf}
              fitPolicy={0}
              trustAllCerts={false}
              renderActivityIndicator={(progress) => (
                <View style={styles.messageState}>
                  <ActivityIndicator color="#2D66C8" />
                  <Text style={styles.messageText}>Loading PDF {Math.round(progress * 100)}%</Text>
                </View>
              )}
              onError={() => setFailedUri(uri)}
            />
          ) : (
            <WebView
              source={{ uri }}
              style={styles.webView}
              originWhitelist={['https://*', 'http://*', 'file://*', 'data:*']}
              onError={() => setFailedUri(uri)}
              onHttpError={(event) => {
                if (event.nativeEvent.statusCode >= 400) setFailedUri(uri);
              }}
              startInLoadingState
              renderLoading={() => <ActivityIndicator color="#2D66C8" style={styles.webLoading} />}
              allowsBackForwardNavigationGestures
              scalesPageToFit={!isText}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDF8FD' },
  header: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E1EBF2' },
  title: { flex: 1, color: '#26394D', fontSize: 14, fontWeight: '700' },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  pdf: { flex: 1, width: '100%', backgroundColor: '#EDF8FD' },
  image: { flex: 1, width: '100%', height: '100%' },
  webView: { flex: 1, backgroundColor: '#FFFFFF' },
  webLoading: { position: 'absolute', top: '50%', alignSelf: 'center' },
  messageState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  messageTitle: { color: '#344B62', fontSize: 16, fontWeight: '800' },
  messageText: { color: '#8291A0', fontSize: 13, textAlign: 'center' },
  openButton: { backgroundColor: '#2D66C8', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11, marginTop: 6 },
  openButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});