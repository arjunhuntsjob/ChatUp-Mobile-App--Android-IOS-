import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootStackScreen from './src/Navigation/RootStackScreen';
import ChatProvider from './src/Context/ChatProvider';
import { useRef, useEffect } from 'react';
import notificationManager from './src/Notifications/NotificationManager';

const App = () => {

  // Notification Setup 
  const navigationRef = useRef();
  useEffect(() => {
    notificationManager.setNavigationRef(navigationRef.current);
    notificationManager.getInitialNotification();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <ChatProvider>
        <RootStackScreen />
      </ChatProvider>
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({});
