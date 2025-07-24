import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootStackScreen from './src/Navigation/RootStackScreen';
import ChatProvider from './src/Context/ChatProvider';

const App = () => {
  return (
    <NavigationContainer>
      <ChatProvider>
        <RootStackScreen />
      </ChatProvider>
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({});
