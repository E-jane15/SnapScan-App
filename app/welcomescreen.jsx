import React from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar,
  Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="scan" size={60} color="#2563eb" />
        </View>

      </View>

      {/* Main Content */}
      <View style={styles.content}>
        
        <Text style={styles.subtitle}>
          Transform your phone into a powerful document scanner. Capture, organize, and secure your important documents with professional-grade quality.
        </Text>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="document-text" size={24} color="#10b981" />
            <Text style={styles.featureText}>High-quality scanning</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="folder" size={24} color="#10b981" />
            <Text style={styles.featureText}>Smart organization</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="lock-closed" size={24} color="#10b981" />
            <Text style={styles.featureText}>Secure encryption</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="search" size={24} color="#10b981" />
            <Text style={styles.featureText}>Powerful search</Text>
          </View>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
        </TouchableOpacity>
        
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: height * 0.04,
  },
  iconContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#eff6ff',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 17,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  featuresContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 24,
    marginTop: 8,
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginLeft: 16,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 15,
    paddingTop: 20,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginBottom: 15,
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  
 
});

export default WelcomeScreen;