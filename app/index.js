import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HOST_URL } from './config/config';
import { colors } from './theme/colors';

export default function HomePage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLatestRecipes();
  }, []);

  const fetchLatestRecipes = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Haciendo petición a:', `${HOST_URL}/api/recipes`);
      const response = await fetch(`${HOST_URL}/api/recipes`, {
        headers
      });

      console.log('Respuesta recibida, status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error al cargar las recetas:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          url: `${HOST_URL}/api/recipes`,
          headers: headers
        });
        throw new Error('No se pudieron cargar las recetas');
      }

      const data = await response.json();
      console.log('Datos recibidos:', JSON.stringify(data, null, 2));
      
      if (!data.success) {
        console.error('Error en data.success:', data);
        throw new Error(data.message || 'Error al cargar las recetas');
      }

      if (!data.recipes || !Array.isArray(data.recipes)) {
        console.error('Formato de datos inválido:', data);
        throw new Error('Formato de respuesta inválido');
      }

      // Tomar solo las últimas 3 recetas del array ordenado
      const latestRecipes = data.recipes.slice(0, 3);
      console.log('Recetas procesadas:', JSON.stringify(latestRecipes, null, 2));
      
      setRecipes(latestRecipes);
      console.log('Estado actualizado con', latestRecipes.length, 'recetas');
    } catch (error) {
      console.error('Error detallado al cargar las recetas:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLatestRecipes();
  };

  const handleRecipePress = (recipeId) => {
    router.push(`/recipes/${recipeId}`);
  };

  const handleCreateRecipe = () => {
    router.push('/recipes/create-recipe');
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchLatestRecipes}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Últimas Recetas</Text>
        </View>

        {recipes.map((recipe) => (
          <TouchableOpacity
            key={recipe.recipeId}
            style={styles.recipeCard}
            onPress={() => handleRecipePress(recipe.recipeId)}
          >
            {recipe.imageUrl && (
              <Image
                source={{ uri: `${HOST_URL}${recipe.imageUrl}` }}
                style={styles.recipeImage}
                resizeMode="cover"
              />
            )}
            
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeTitle}>{recipe.title}</Text>
              <Text style={styles.recipeAuthor}>Por: {recipe.authorName}</Text>
              
              <View style={styles.recipeMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{recipe.prepTime + recipe.cookTime} min</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{recipe.servings} porciones</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="speedometer-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{recipe.difficulty}</Text>
                </View>
              </View>

              <Text style={styles.recipeDescription} numberOfLines={2}>
                {recipe.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {recipes.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay recetas disponibles</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color={colors.primary} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Buscar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bookmark" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Guardados</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="school" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Cursos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Usuario</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  recipeCard: {
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingVertical: 8,
    marginHorizontal: 8,
    width: '90%',
    alignSelf: 'center',
  },
  recipeImage: {
    width: '100%',
    height: 120,
    borderRadius: 4,
  },
  recipeInfo: {
    padding: 8,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  recipeAuthor: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  recipeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  recipeDescription: {
    fontSize: 11,
    color: colors.text,
    lineHeight: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  navText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
}); 