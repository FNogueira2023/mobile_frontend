import { Ionicons } from '@expo/vector-icons';
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
            <View style={styles.buttonRow}>
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
            </View>
          ) : (
            <>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => router.push('/recipes/create-recipe')}
                >
                  <Ionicons name="add-circle-outline" size={24} color={colors.white} />
                  <Text style={styles.buttonText}>Crear Receta</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.myRecipesButton]}
                  onPress={() => router.push('/recipes/my-recipes')}
                >
                  <Ionicons name="book-outline" size={24} color={colors.white} />
                  <Text style={styles.buttonText}>Mis Recetas</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.logoutButton]}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={24} color={colors.white} />
                  <Text style={styles.buttonText}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.searchButton]}
                  onPress={() => router.push('/recipes/search-recipes')}
                >
                  <Ionicons name="search-outline" size={24} color={colors.white} />
                  <Text style={styles.buttonText}>Buscar Recetas</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.upgradeButton]}
              onPress={() => router.push('/auth/upgrade-to-student')}
            >
              <Ionicons name="school-outline" size={24} color={colors.white} />
              <Text style={styles.buttonText}>Upgrade to Student</Text>
            </TouchableOpacity>
          </View>
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
    padding: 20,
    gap: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  searchButton: {
    backgroundColor: colors.primary,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: colors.error,
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
  myRecipesButton: {
    backgroundColor: colors.primary,
  },
}); 