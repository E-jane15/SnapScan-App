import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
  Share,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { DocumentStorageService } from '../../utils/datastorage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


const Viewer = () => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [storageService, setStorageService] = useState(null);

  const router = useRouter();
  const { documentId } = useLocalSearchParams();
  const scrollViewRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Initialize storage service
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        const service = new DocumentStorageService();
        await service.initialize();
        setStorageService(service);
      } catch (error) {
        console.error('Failed to initialize storage service:', error);
        Alert.alert('Error', 'Failed to initialize storage service');
      }
    };

    initializeStorage();
  }, []);

  // Load document when storage service is ready
  useEffect(() => {
    if (storageService && documentId) {
      loadDocument();
    }
  }, [storageService, documentId]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  const loadDocument = async () => {
    try {
      if (!storageService) return;
      
      console.log('Loading document with ID:', documentId);
      const doc = await storageService.getDocumentById(documentId);
      
      if (!doc) {
        Alert.alert('Error', 'Document not found');
        router.back();
        return;
      }

      setDocument(doc);
      setEditTitle(doc.title);
      setEditCategory(doc.category || 'general');
    } catch (error) {
      console.error('Error loading document:', error);
      Alert.alert('Error', 'Failed to load document');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleShare = async () => {
    try {
      if (!document) return;

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(document.file_path, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share Document',
      });
    } catch (error) {
      console.error('Error sharing document:', error);
      Alert.alert('Error', 'Failed to share document');
    }
  };

  const handleEdit = () => {
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    try {
      if (!storageService || !document) return;

      await storageService.updateDocument(document.id, {
        title: editTitle,
        category: editCategory,
      });

      setDocument(prev => ({
        ...prev,
        title: editTitle,
        category: editCategory,
      }));

      setEditModalVisible(false);
      Alert.alert('Success', 'Document updated successfully');
    } catch (error) {
      console.error('Error updating document:', error);
      Alert.alert('Error', 'Failed to update document');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document?.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteDocument(document.id);
              Alert.alert('Success', 'Document deleted successfully');
              router.back();
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA629" />
        <Text style={styles.loadingText}>Loading Document...</Text>
      </View>
    );
  }

  if (!document) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-outline" size={80} color="#666" />
        <Text style={styles.errorText}>Document not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Header Controls */}
      {showControls && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.documentTitle} numberOfLines={1}>
              {document.title}
            </Text>
            <Text style={styles.documentDate}>
              {new Date(document.created_at).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleEdit}
            >
              <Ionicons name="create-outline" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Document Image */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.imageContainer}
        contentContainerStyle={styles.imageContentContainer}
        maximumZoomScale={3}
        minimumZoomScale={0.5}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleControls}
          style={styles.imageWrapper}
        >
          <Image
            source={{ uri: document.file_path }}
            style={[
              styles.documentImage,
              {
                transform: [
                  { scale: scale },
                  { rotate: `${rotation}deg` },
                ],
              },
            ]}
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={(error) => {
              console.error('Image load error:', error);
              setImageLoading(false);
              Alert.alert('Error', 'Failed to load document image');
            }}
          />
          
          {imageLoading && (
            <View style={styles.imageLoadingOverlay}>
              <ActivityIndicator size="large" color="#FFA629" />
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Controls */}
      {showControls && (
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleZoomOut}
          >
            <Ionicons name="remove" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleZoomIn}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleRotate}
          >
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.documentInfo}>
            <Text style={styles.infoText}>
              {formatFileSize(document.file_size)} • {document.category}
            </Text>
          </View>
        </View>
      )}

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Edit Document</Text>
            
            <TouchableOpacity onPress={saveEdit}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Document title"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.textInput}
                value={editCategory}
                onChangeText={setEditCategory}
                placeholder="Category"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFA629',
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 15,
  },
  documentTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  documentDate: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  imageContainer: {
    flex: 1,
  },
  imageContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
    resizeMode: 'contain',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  documentInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoText: {
    color: 'white',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCancelButton: {
    color: '#666',
    fontSize: 16,
  },
  modalSaveButton: {
    color: '#FFA629',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
});

export default Viewer;