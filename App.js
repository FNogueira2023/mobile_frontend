import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { colors } from './src/theme/colors';

// Import screens (we'll create these next)
import FavoritesScreen from './src/screens/FavoritesScreen';
import HomeScreen from './src/screens/HomeScreen';
import RecipeScreen from './src/screens/RecipeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <View style={styles.container}>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.primary,
            },
            headerTintColor: colors.secondary,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Recipe App' }}
          />
          <Stack.Screen 
            name="Recipe" 
            component={RecipeScreen} 
            options={{ title: 'Recipe Details' }}
          />
          <Stack.Screen 
            name="Favorites" 
            component={FavoritesScreen} 
            options={{ title: 'My Favorites' }}
          />
        </Stack.Navigator>
        <StatusBar style="light" />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
}); 