import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import CallScreen from './screens/CallScreen';
import ChatScreen from './screens/ChatScreen';
import NewChatScreen from './screens/NewChat';
import LogScreen from './screens/LogScreen';
import UserList from './screens/UserScreen';
import CommunityChatScreen from './screens/CommunityChat'

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Login Screen"
          component={LogScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Users Screen"
          component={UserList}
        />
        <Stack.Screen
          name="Community Chat"
          component={CommunityChatScreen}
        />
        {/* <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Call" component={CallScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} /> */}
        <Stack.Screen name="NewChat" component={NewChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
