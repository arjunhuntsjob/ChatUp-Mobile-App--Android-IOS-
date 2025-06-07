import {StyleSheet, Text, View} from 'react-native';
import React, {useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    setTimeout(() => {
      const checkToken = async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          console.log('Token found:', token);
          if (token) {
            navigation.navigate('HomeScreen');
          } else {
            console.log('No token, navigating to Login');
            navigation.navigate('Login');
          }
        } catch (error) {
          console.error('Error checking token:', error);
          navigation.navigate('Login');
        }
      };
      checkToken();
    }, 3000);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>👻</Text>
      </View>
      <Text style={styles.title}>ChatUp</Text>
      <Text style={styles.subtitle}>
        Connect with friends, anytime, anywhere
      </Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoContainer: {
    backgroundColor: '#8A0032',
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8A0032',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8A0032',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
