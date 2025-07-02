import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import WelcomeScreen from './welcomescreen';


const SplashScreen = () => {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.replace('./welcomescreen');
    }, 3000);
  }, []);

  return (
    <View style={styles.container}>
      <Image 
     source={require('../assets/images/logo.png')} 
      style={{ width: 170, height: 170 }}
      />
      <Text style={styles.title}>SnapScan</Text>
      <Text style={styles.slogan}>Scan, Save, Share</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  slogan: {
    color: '#ffffff',
    fontSize: 24,
    fontStyle: 'italic',
  },
});

export default SplashScreen;
