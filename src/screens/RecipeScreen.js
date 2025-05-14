import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';

const RecipeScreen = ({ route, navigation }) => {
  const { recipeId } = route.params;
  const [isFavorite, setIsFavorite] = useState(false);

  // Temporary sample data - replace with actual API call later
  const recipe = {
    id: recipeId,
    title: 'Spaghetti Carbonara',
    time: '30 mins',
    servings: 4,
    ingredients: [
      '400g spaghetti',
      '200g pancetta',
      '4 large eggs',
      '100g parmesan cheese',
      'Black pepper',
      'Salt',
    ],
    instructions: [
      'Cook pasta according to package instructions',
      'Fry pancetta until crispy',
      'Mix eggs and cheese in a bowl',
      'Combine hot pasta with egg mixture',
      'Add pancetta and season with pepper',
    ],
  };

  const toggleFavorite = async () => {
    try {
      const newFavoriteStatus = !isFavorite;
      setIsFavorite(newFavoriteStatus);
      
      // Get existing favorites
      const favorites = await AsyncStorage.getItem('favorites');
      const favoritesArray = favorites ? JSON.parse(favorites) : [];
      
      if (newFavoriteStatus) {
        // Add to favorites
        favoritesArray.push(recipeId);
      } else {
        // Remove from favorites
        const index = favoritesArray.indexOf(recipeId);
        if (index > -1) {
          favoritesArray.splice(index, 1);
        }
      }
      
      await AsyncStorage.setItem('favorites', JSON.stringify(favoritesArray));
    } catch (error) {
      console.error('Error saving favorite:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{recipe.title}</Text>
        <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
          <Text style={styles.favoriteButtonText}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>⏱️ {recipe.time}</Text>
        <Text style={styles.infoText}>👥 {recipe.servings} servings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients.map((ingredient, index) => (
          <Text key={index} style={styles.ingredientText}>• {ingredient}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        {recipe.instructions.map((instruction, index) => (
          <Text key={index} style={styles.instructionText}>
            {index + 1}. {instruction}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.mutedOlive,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    color: colors.navyBlue,
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteButtonText: {
    fontSize: 24,
  },
  infoContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.mutedOlive,
    backgroundColor: colors.white,
  },
  infoText: {
    marginRight: 16,
    color: colors.teal,
  },
  section: {
    padding: 16,
    backgroundColor: colors.white,
    marginTop: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.primary,
  },
  ingredientText: {
    fontSize: 16,
    marginBottom: 8,
    color: colors.navyBlue,
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 12,
    color: colors.navyBlue,
    lineHeight: 24,
  },
});

export default RecipeScreen; 