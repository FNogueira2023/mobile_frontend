import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userId');
      setIsAuthenticated(false);
      Alert.alert(
        'Sesión cerrada',
        'Has cerrado sesión exitosamente',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/'),
          },
        ]
      );
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar la sesión');
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
          <Text style={styles.welcomeText}>Bienvenido a</Text>
          <Text style={styles.appTitle}>Recipe App</Text>
          <Text style={styles.subtitle}>Descubre y comparte tus recetas favoritas</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          {!isAuthenticated ? (
            <>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => router.push('/auth/login')}
              >
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => router.push('/register/step1')}
              >
                <Text style={styles.buttonText}>Create Account</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.button, styles.createButton]}
                onPress={() => router.push('/recipes/create-recipe')}
              >
                <Text style={[styles.buttonText, styles.createButtonText]}>Crear Receta</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.myRecipesButton]}
                onPress={() => router.push('/recipes/my-recipes')}
              >
                <Text style={[styles.buttonText, styles.myRecipesButtonText]}>Mis Recetas</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.logoutButton]}
                onPress={handleLogout}
              >
                <Text style={[styles.buttonText, styles.logoutButtonText]}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </>
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
  logoutButton: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  logoutButtonText: {
    color: colors.white,
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
  createButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  createButtonText: {
    color: colors.white,
  },
  myRecipesButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  myRecipesButtonText: {
    color: colors.white,
  },
}); 