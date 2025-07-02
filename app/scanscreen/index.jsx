import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import {DocumentStorageService} from '../../utils/datastorage'


const { width, height } = Dimensions.get('window');


// Initialize storage service
const storageService = new DocumentStorageService();

const ScanScreen = () => {
  const [facing, setFacing] = useState('back');
  const [flashlight, setFlashlight] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [storageInitialized, setStorageInitialized] = useState(false);
  const cameraRef = useRef(null);
  const isFocused = useIsFocused();
  const router = useRouter();

  useEffect(() => {
    initializeStorage();
  }, []);

  const initializeStorage = async () => {
    try {
      await storageService.initialize();
      setStorageInitialized(true);
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      Alert.alert('Error', 'Failed to initialize document storage');
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlashlight = () => {
    setFlashlight(current => !current);
  };
 const scanDocument = async () => {
  if (!cameraRef.current || isProcessing || !storageInitialized) return;

  try {
    setIsProcessing(true);

    // Capture full image
    const photo = await cameraRef.current.takePictureAsync({
      quality: 1,
      base64: false,
      skipProcessing: true,
    });

    if (!photo) throw new Error('No photo captured');

    // Crop to your scan frame area manually
    const cropTop = photo.height * 0.275;
    const cropHeight = photo.height * 0.45;

    const cropped = await manipulateAsync(
      photo.uri,
      [
        {
          crop: {
            originX: 0,
            originY: cropTop,
            width: photo.width,
            height: cropHeight,
          },
        },
        {
          resize: {
            width: 1080,
          },
        },
      ],
      { compress: 0.8, format: SaveFormat.JPEG }
    );

    // Apply brightness & contrast to simulate scan
    const enhanced = await manipulateAsync(
      cropped.uri,
      [
        {
          // simulate grayscale by slightly desaturating
          // fully grayscale requires pixel-by-pixel operation not available in Expo yet
          rotate: 0,
        },
      ],
      { compress: 0.9, format: SaveFormat.JPEG }
    );

    // Save
    const savedDocument = await storageService.saveDocument(enhanced.uri);

    Alert.alert(
      'Scan Complete',
      `Saved as "${savedDocument.title}"`,
      [
        { text: 'Scan Another' },
        { text: 'View Documents', onPress: () => navigateToDocuments() }
      ]
    );
  } catch (e) {
    console.error(e);
    Alert.alert('Scan Failed', 'Unable to process document.');
  } finally {
    setIsProcessing(false);
  }
};



  const navigateToDocuments = () => {
    // Navigate to documents list screen
     router.push('/');
    console.log('Navigate to documents list');
  };

  const showStorageInfo = async () => {
    try {
      const stats = await storageService.getStorageStats();
      Alert.alert(
        'Storage Information',
        `Documents: ${stats.documentCount}\nTotal Size: ${stats.totalSizeMB} MB`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error getting storage stats:', error);
    }
  };

  if (!storageInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA629" />
        <Text style={styles.loadingText}>Initializing Document Storage...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Floating Control Buttons */}
      <View style={styles.topControls}>
        <TouchableOpacity 
          style={styles.floatingButton} 
          onPress={() => router.back()}
          disabled={isProcessing}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.rightControls}>
          {/* Storage info button */}
          <TouchableOpacity 
            style={styles.floatingButton} 
            onPress={showStorageInfo}
            disabled={isProcessing}
          >
            <Ionicons name="folder" size={24} color="white" />
          </TouchableOpacity>

          {/* Flashlight button - only show for back camera */}
          {facing === 'back' && (
            <TouchableOpacity 
              style={[styles.floatingButton, flashlight && styles.activeButton]} 
              onPress={toggleFlashlight}
              disabled={isProcessing}
            >
              <Ionicons 
                name={flashlight ? "flash" : "flash-off"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.floatingButton} 
            onPress={toggleCameraFacing}
            disabled={isProcessing}
          >
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    
      {/* Camera View */}
      <View style={styles.cameraWrapper}>
        {isFocused ? (
          <CameraView 
            style={styles.camera} 
            facing={facing}
            flash={flashlight ? 'on' : 'off'}
            ref={cameraRef}
          >
            {/* Camera overlay for document scanning */}
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                {/* Corner markers for better alignment */}
                <View style={[styles.cornerMarker, styles.topLeft]} />
                <View style={[styles.cornerMarker, styles.topRight]} />
                <View style={[styles.cornerMarker, styles.bottomLeft]} />
                <View style={[styles.cornerMarker, styles.bottomRight]} />
              </View>
              
              <Text style={styles.instructionText}>
                {isProcessing ? 'Processing document...' : 'Align document with the frame'}
              </Text>
              
              {/* Scanning tips */}
              {!isProcessing && (
                <View style={styles.tipsContainer}>
                  <Text style={styles.tipsText}>
                    📄 Keep document flat and straight{'\n'}
                    💡 Ensure good lighting{'\n'}
                    📐 Fill the entire frame{'\n'}
                    📱 Hold device steady
                  </Text>
                </View>
              )}
            </View>

            {/* Processing overlay */}
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.processingText}>
                  Scanning & Processing Document...
                </Text>
                <Text style={styles.processingSubtext}>
                  This may take a few seconds
                </Text>
              </View>
            )}
          </CameraView>
        ) : (
          <View style={styles.placeholderView}>
            <Ionicons name="camera" size={48} color="white" />
            <Text style={styles.placeholderText}>Camera Loading...</Text>
          </View>
        )}
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        <View style={styles.captureButtonContainer}>
          <TouchableOpacity 
            style={[
              styles.captureButton,
              isProcessing && styles.captureButtonDisabled
            ]} 
            onPress={scanDocument}
            disabled={!isFocused || isProcessing || !storageInitialized}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFA629" />
            ) : (
              <Ionicons name="scan" size={32} color="#FFA629" />
            )}
          </TouchableOpacity>
          <Text style={styles.captureButtonText}>
            {isProcessing ? 'Processing...' : 'Scan Document'}
          </Text>
        </View>
      </View>
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
    fontSize: 16,
    marginTop: 20,
  },
  cameraWrapper: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  placeholderView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  placeholderText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  rightControls: {
    flexDirection: 'row',
    gap: 10,
  },
  floatingButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: 'rgba(255,193,7,0.8)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: width * 0.85,
    height: height * 0.45,
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: 12,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  cornerMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFA629',
    borderWidth: 3,
  },
  topLeft: {
    top: -3,
    left: -3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -3,
    right: -3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -3,
    left: -3,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -3,
    right: -3,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionText: {
    color: 'white',
    fontSize: 18,
    marginTop: 25,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    fontWeight: '600',
  },
  tipsContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 18,
    borderRadius: 12,
    maxWidth: width * 0.8,
  },
  tipsText: {
    color: 'white',
    fontSize: 13,
    textAlign: 'left',
    lineHeight: 20,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 20,
    marginTop: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  processingSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
    paddingTop: 30,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#FFA629',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '700',
  },
});

export default ScanScreen;