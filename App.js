import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PhotoPicker } from './src/components/PhotoPicker';
import { Slideshowplayer } from './src/Screens/Slideshowplayer';

const Stack = createNativeStackNavigator();
console.log('Enginedddddd:', global.HermesInternal ? 'Hermes' : 'JSC');
function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="#fff" />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="PhotoPicker">
          <Stack.Screen name="PhotoPicker" component={PhotoPicker} options={{ title: 'Select Photos' }} />
          <Stack.Screen name="Slideshowplayer" component={Slideshowplayer} options={{ title: 'Slideshow' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;