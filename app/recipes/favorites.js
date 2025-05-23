import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { HOST_URL } from '../config/config';
import { colors } from '../theme/colors';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userDataString = await AsyncStorage.getItem('userData');
      
      if (!token || !userDataString) {
        router.replace('/auth/login');
        return;
      }

      const userData = JSON.parse(userDataString);
      const response = await fetch(`${HOST_URL}/api/users/${userData.userId}/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar favoritos');
      }

      const data = await response.json();
      if (data.success) {
        setFavorites(data.favorites);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Error', 'No se pudieron cargar las recetas favoritas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRemoveFavorite = async (recipeId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userDataString = await AsyncStorage.getItem('userData');
      
      if (!token || !userDataString) {
        router.replace('/auth/login');
        return;
      }

      const userData = JSON.parse(userDataString);
      const response = await fetch(`${HOST_URL}/api/users/${userData.userId}/favorites/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar de favoritos');
      }

      // Actualizar la lista local
      setFavorites(favorites.filter(recipe => recipe.recipeId !== recipeId));
      Alert.alert('Éxito', 'Receta eliminada de favoritos');
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Error', 'No se pudo eliminar la receta de favoritos');
    }
  };

  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.recipeCard}
      onPress={() => router.push(`/recipes/${item.recipeId}`)}
    >
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} 
        style={styles.recipeImage}
      />
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        <Text style={styles.recipeDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.recipeMeta}>
          <Text style={styles.recipeAuthor}>Por: @{item.authorName}</Text>
          <Text style={styles.recipeType}>{item.typeDescription}</Text>
        </View>
        <View style={styles.recipeFooter}>
          <View style={styles.difficultyContainer}>
            <Ionicons 
              name="speedometer-outline" 
              size={16} 
              color={colors.primary} 
            />
            <Text style={styles.difficultyText}>
              {item.difficulty === 1 ? 'Fácil' : 
               item.difficulty === 2 ? 'Media' : 'Difícil'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => handleRemoveFavorite(item.recipeId)}
          >
            <Ionicons name="heart" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        renderItem={renderRecipeItem}
        keyExtractor={item => item.recipeId.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadFavorites();
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No tienes recetas favoritas</Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => router.push('/recipes/search-recipes')}
            >
              <Text style={styles.exploreButtonText}>Explorar recetas</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  recipeCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recipeImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  recipeInfo: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  recipeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recipeAuthor: {
    fontSize: 12,
    color: colors.primary,
  },
  recipeType: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  recipeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyText: {
    marginLeft: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  exploreButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 