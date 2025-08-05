import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../Screens/Auth/Login';
import SplashScreen from '../Screens/SplashScreen/SplashScreen';
import HomeScreen from '../Screens/Home/HomeScreen';
import Register from '../Screens/Auth/Register';
import Messages from '../Screens/Messages/Message';
import ProfileScreen from '../Screens/Home/ProfileScreen';

const RootStack = createNativeStackNavigator();

const RootStackScreen = () => {
  return (
    <RootStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="SplashScreen">
      <RootStack.Screen name="SplashScreen" component={SplashScreen} />
      <RootStack.Screen name="Login" component={Login} />
      <RootStack.Screen name="HomeScreen" component={HomeScreen} />
      <RootStack.Screen name="Signup" component={Register} />
      <RootStack.Screen name="Messages" component={Messages} />
      <RootStack.Screen name="ProfileScreen" component={ProfileScreen} />
    </RootStack.Navigator>
  );
};

export default RootStackScreen;

const styles = StyleSheet.create({});
