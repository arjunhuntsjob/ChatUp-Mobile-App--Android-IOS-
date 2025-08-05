import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Svg, Path, Circle } from 'react-native-svg';
import { ChatState } from '../../Context/ChatProvider';
const Login = () => {
  const navigation = useNavigation();
  const { setUser } = ChatState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestCredentials = () => {
    setEmail('guest@example.com');
    setPassword('123456');
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Email and Password are required!');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(
        'https://chat-application-1795.onrender.com/api/user/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Something went wrong');
        setIsLoading(false);
        return;
      }

      // Store user info in AsyncStorage
      await AsyncStorage.setItem('userInfo', JSON.stringify(data));
      await AsyncStorage.setItem('userToken', data.token);

      // **ADD THIS LINE** - Update context immediately
      setUser(data);

      console.log('--------->', data.token);
      setIsLoading(false);
      navigation.navigate('HomeScreen');
    } catch (err) {
      console.error('Auth error', err);
      setError('Failed to authenticate. Try again later.');
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    const url = 'https://arjunkanths-portfolio.netlify.app/'; // Replace with your desired link
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>👻</Text>
            </View>
            <Text style={styles.title}>Welcome to ChatUp</Text>
            <Text style={styles.subtitle}>
              Connect with friends, anytime, anywhere
            </Text>
          </View>

          <View style={styles.formContainer}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <View style={styles.iconContainer}>
                <Svg width={14} height={14} viewBox="0 0 20 20" fill="#D76C82">
                  <Path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <Path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </Svg>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.iconContainer}>
                <Svg width={14} height={14} viewBox="0 0 20 20" fill="#D76C82">
                  <Path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </Svg>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                // placeholderTextColor={}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIconContainer}
                onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <Svg
                    width={14}
                    height={14}
                    viewBox="0 0 20 20"
                    fill="#D76C82">
                    <Path
                      fillRule="evenodd"
                      d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                      clipRule="evenodd"
                    />
                    <Path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </Svg>
                ) : (
                  <Svg
                    width={14}
                    height={14}
                    viewBox="0 0 20 20"
                    fill="#D76C82">
                    <Path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <Path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </Svg>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.buttonText}>Logging in...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestCredentials}>
            <Text style={styles.guestButtonText}>Try with Guest Account</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>New to Chat Up? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Create an account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <View style={styles.footerTextContainer}>
              <Text style={styles.footerText}>Made with ❤️ by</Text>
              <TouchableOpacity onPress={handleClick}>
                <View style={styles.footerLinkContainer}>
                  <Text style={styles.footerLink}>Arjun</Text>
                  <Svg
                    width={10}
                    height={10}
                    viewBox="0 0 24 24"
                    stroke="#8A0032">
                    <Path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      fill="none"
                    />
                  </Svg>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    backgroundColor: '#8A0032',
    borderRadius: 50,
    padding: 6,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoText: {
    fontSize: 55,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8A0032',
  },
  subtitle: {
    fontSize: 14,
    color: '#8A0032',
    marginTop: 2,
  },
  formContainer: {
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 6,
    borderRadius: 4,
    marginBottom: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EBE8DB',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  iconContainer: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 12,
  },
  eyeIconContainer: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#8A0032',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#EBE8DB',
  },
  dividerText: {
    paddingHorizontal: 8,
    color: '#8A0032',
    fontSize: 12,
  },
  guestButton: {
    borderWidth: 2,
    borderColor: '#EBE8DB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestButtonText: {
    color: '#8A0032',
    fontWeight: '500',
    fontSize: 12,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  signupText: {
    fontSize: 12,
    color: '#8A0032',
  },
  signupLink: {
    fontSize: 12,
    color: '#8A0032',
    fontWeight: '500',
  },
  footerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#EBE8DB',
    paddingTop: 8,
    alignItems: 'center',
  },
  footerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#8A0032',
  },
  footerLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  footerLink: {
    fontSize: 10,
    color: '#8A0032',
    fontWeight: '500',
    marginRight: 2,
  },
});

export default Login;
