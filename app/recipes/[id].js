import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { HOST_URL } from '../config/config';
import { colors } from '../theme/colors';

export default function RecipeDetails() {
  const { id: recipeId } = useLocalSearchParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (recipeId) {
      fetchRecipe();
      checkIfFavorite();
      fetchAverageRating();
    }
  }, [recipeId]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      console.log('Fetching recipe with ID:', recipeId);
      console.log('Using token:', token.substring(0, 20) + '...');

      const response = await fetch(`${HOST_URL}/api/recipes/${recipeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', errorData);
        throw new Error(errorData?.message || 'No se pudo cargar la receta');
      }

      const data = await response.json();
      console.log('Recipe data received:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Error al cargar la receta');
      }

      setRecipe(data.recipe);

      // Verificar si el usuario actual es el dueño de la receta
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const userId = decodedToken.userId || decodedToken.id || decodedToken.sub;
        setIsOwner(userId === data.recipe.userId);
      } catch (tokenError) {
        console.error('Error decoding token:', tokenError);
      }

    } catch (error) {
      console.error('Error completo al cargar la receta:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const userDataString = await AsyncStorage.getItem('userData');
    
    if (!token || !userDataString) {
      setIsFavorite(false);
      return;
    }

    const userData = JSON.parse(userDataString);
    const response = await fetch(`${HOST_URL}/api/users/${userData.userId}/favorites`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).catch(() => null);

    if (!response?.ok) {
      setIsFavorite(false);
      return;
    }

    const data = await response.json().catch(() => null);
    if (!data?.success) {
      setIsFavorite(false);
      return;
    }

    const favorites = data.favorites || [];
    const isFav = favorites.some(fav => fav.recipeId === parseInt(recipeId));
    setIsFavorite(isFav);
  };

  const fetchAverageRating = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No token available for fetching average rating');
        return;
      }

      console.log('Fetching average rating for recipe:', recipeId);
      const response = await fetch(`${HOST_URL}/api/recipes/${recipeId}/ratings/average`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Average rating response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Average rating data:', data);
        if (data.averageRating) {
          console.log('Setting average rating to:', parseFloat(data.averageRating));
          setAverageRating(parseFloat(data.averageRating));
        }
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('Error fetching average rating:', errorData);
      }
    } catch (error) {
      console.error('Error in fetchAverageRating:', error);
    }
  };

  const renderStars = (value) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= value ? "star" : "star-outline"}
            size={16}
            color={star <= value ? colors.primary : colors.textSecondary}
          />
        ))}
      </View>
    );
  };

  const toggleFavorite = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userDataString = await AsyncStorage.getItem('userData');
      
      if (!token || !userDataString) {
        router.push('/auth/login');
        return;
      }

      const userData = JSON.parse(userDataString);
      const method = isFavorite ? 'DELETE' : 'POST';
      const url = isFavorite 
        ? `${HOST_URL}/api/users/${userData.userId}/favorites/${recipeId}`
        : `${HOST_URL}/api/users/${userData.userId}/favorites`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        ...(method === 'POST' && { body: JSON.stringify({ recipeId: parseInt(recipeId) }) })
      });

      if (!response.ok) {
        return;
      }

      const responseData = await response.json();
      setIsFavorite(!isFavorite);
      Alert.alert(
        'Éxito',
        isFavorite ? 'Receta quitada de favoritos' : 'Receta agregada a favoritos'
      );
    } catch {
      // No hacer nada en caso de error
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Eliminar Receta',
      '¿Estás seguro de que deseas eliminar esta receta? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              const response = await fetch(`${HOST_URL}/api/recipes/${recipeId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (!response.ok) {
                throw new Error('No se pudo eliminar la receta');
              }

              Alert.alert('Éxito', 'Receta eliminada correctamente');
              router.back();
            } catch (error) {
              console.error('Error al eliminar la receta:', error);
              Alert.alert('Error', 'No se pudo eliminar la receta');
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/recipes/edit/${recipeId}`);
  };

  const handleRatingPress = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userDataString = await AsyncStorage.getItem('userData');
      
      if (!token || !userDataString) {
        router.push('/auth/login');
        return;
      }

      const userData = JSON.parse(userDataString);
      
      // Verificar si el usuario ya calificó usando el endpoint específico
      const response = await fetch(`${HOST_URL}/api/users/${userData.userId}/recipes/${recipeId}/rated`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hasRated) {
          Alert.alert(
            'Ya has calificado esta receta',
            'No puedes calificar la misma receta más de una vez.'
          );
          return;
        }
      }

      // Si no ha calificado, navegar a la vista de rating
      router.push(`/recipes/rating?id=${recipeId}`);
    } catch (error) {
      console.error('Error checking user rating:', error);
      Alert.alert('Error', 'No se pudo verificar si ya has calificado esta receta');
    }
  };

  if (loading) {
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
          onPress={fetchRecipe}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se encontró la receta</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: recipe?.title || 'Detalles de la receta',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.white,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={toggleFavorite}
              style={styles.favoriteButton}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? colors.error : colors.white}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Imagen principal */}
          {recipe.imageUrl && (
            <Image
              source={{ uri: `${HOST_URL}${recipe.imageUrl}` }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          )}

          {/* Botones de acción */}
          {isOwner && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={handleEdit}
              >
                <Ionicons name="pencil" size={24} color={colors.white} />
                <Text style={styles.actionButtonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Ionicons name="trash" size={24} color={colors.white} />
                <Text style={styles.actionButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Información básica */}
          <View style={styles.section}>
            <Text style={styles.title}>{recipe?.title}</Text>
            <View style={styles.authorContainer}>
              <Text style={styles.author}>Por: {recipe?.authorName}</Text>
              <View style={styles.ratingContainer}>
                {renderStars(Math.round(averageRating))}
                <Text style={styles.ratingText}>
                  {averageRating > 0 ? averageRating.toFixed(1) : 'Sin calificaciones'}
                </Text>
              </View>
            </View>
            
            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.metaText}>{recipe?.prepTime + recipe?.cookTime} min</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.metaText}>{recipe?.servings} porciones</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="speedometer-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.metaText}>{recipe?.difficulty}</Text>
              </View>
            </View>

            <Text style={styles.description}>{recipe?.description}</Text>
          </View>

          {/* Ingredientes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredientes</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.ingredientText}>
                  • {ingredient.amount} {ingredient.unitAbbreviation} de {ingredient.ingredientName}
                  {ingredient.isOptional && ' (opcional)'}
                </Text>
              </View>
            ))}
          </View>

          {/* Pasos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pasos</Text>
            {recipe.steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <Text style={styles.stepNumber}>Paso {index + 1}</Text>
                <Text style={styles.stepText}>{step.text}</Text>
                {step.photo && (
                  <Image
                    source={{ uri: `${HOST_URL}${step.photo.url}` }}
                    style={styles.stepImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.commentButtonContainer}>
          <TouchableOpacity
            style={styles.commentButton}
            onPress={handleRatingPress}
          >
            <Ionicons name="chatbubble-outline" size={24} color={colors.white} />
            <Text style={styles.commentButtonText}>Dejar comentario</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/')}
          >
            <Ionicons name="home" size={24} color={colors.textSecondary} />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/recipes/search-recipes')}
          >
            <Ionicons name="search" size={24} color={colors.textSecondary} />
            <Text style={styles.navText}>Buscar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/recipes/favorites')}
          >
            <Ionicons name="heart-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.navText}>Guardados</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="school" size={24} color={colors.textSecondary} />
            <Text style={styles.navText}>Cursos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/user')}
          >
            <Ionicons name="person" size={24} color={colors.textSecondary} />
            <Text style={styles.navText}>Usuario</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
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
  mainImage: {
    width: '100%',
    height: 250,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    gap: 5,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
  },
  section: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  author: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  ingredientItem: {
    marginBottom: 10,
  },
  ingredientText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  stepItem: {
    marginBottom: 20,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  stepText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 10,
  },
  stepImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  favoriteButton: {
    marginRight: 16,
    padding: 4,
  },
  scrollView: {
    flex: 1,
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
  commentButtonContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    alignItems: 'center',
  },
  commentButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 8,
    width: '70%',
  },
  commentButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
}); 