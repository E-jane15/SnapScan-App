import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Alert,
  StatusBar,
  Dimensions 
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
//rimport * as MediaLibrary from 'expo-media-library';

const { width, height } = Dimensions.get('window');

const CameraScreen = () => {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  //const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef(null);
  const router = useRouter();

  // Request media library permission on component mount
  //useEffect(() => {
    //if (!mediaLibraryPermission?.granted) {
      //requestMediaLibraryPermission();
   // }
  //}, []);

  if (!permission) {
    // Camera permissions are still loading
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: false,
        });
        
        // Save to device gallery (optional)
        //if (mediaLibraryPermission?.granted) {
         // await MediaLibrary.saveToLibraryAsync(photo.uri);
        //}
        
        // You can handle the photo here - save to app storage, preview, etc.
        console.log('Photo captured:', photo.uri);
        
        Alert.alert(
          'Photo Captured!', 
          'Document has been scanned successfully.',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
        
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      <CameraView 
        style={styles.camera} 
        facing={facing}
        ref={cameraRef}
      >
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Document</Text>
          <TouchableOpacity 
            style={styles.flipButton} 
            onPress={toggleCameraFacing}
          >
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Camera overlay for document scanning */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.instructionText}>
            Position document within the frame
          </Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          <View style={styles.captureButtonContainer}>
            <TouchableOpacity 
              style={styles.captureButton} 
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: width * 0.8,
    height: height * 0.5,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bottomControls: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ccc',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
  },
});

export default CameraScreen;