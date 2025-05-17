import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from './theme/colors';

export default function HomeScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  };

  // Temporary sample data - replace with actual API call later
  const recipes = [
    { id: '1', title: 'Spaghetti Carbonara', time: '30 mins', difficulty: 'Medium' },
    { id: '2', title: 'Chicken Curry', time: '45 mins', difficulty: 'Easy' },
    { id: '3', title: 'Vegetable Stir Fry', time: '20 mins', difficulty: 'Easy' },
  ];

  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recipeItem}
      onPress={() => router.push(`/recipe?id=${item.id}`)}
    >
      <View style={styles.recipeContent}>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        <View style={styles.recipeDetails}>
          <Text style={styles.recipeTime}>⏱️ {item.time}</Text>
          <Text style={styles.recipeDifficulty}>📊 {item.difficulty}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appTitle}>Recipe App</Text>
          <Text style={styles.subtitle}>Discover delicious recipes</Text>
        </View>
        <View style={styles.buttonContainer}>
          {!isAuthenticated && (
            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          )}
          {!isAuthenticated && (
            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.push('/register/step1')}
            >
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/auth/upgrade-to-student')}
          >
            <Text style={styles.buttonText}>Upgrade to Student</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={recipes}
        renderItem={renderRecipeItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBackground,
  },
  headerTop: {
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 4,
  },
  buttonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginRight: 8,
  },
  loginButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 8,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  upgradeButton: {
    backgroundColor: colors.secondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 8,
  },
  upgradeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  recipeItem: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recipeContent: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.text,
  },
  recipeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recipeTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  recipeDifficulty: {
    fontSize: 14,
    color: colors.textSecondary,
  },
}); 