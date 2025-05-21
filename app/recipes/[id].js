import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HOST_URL } from '../config/config';
import { colors } from '../theme/colors';

export default function RecipeDetail() {
  const { id } = useLocalSearchParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${HOST_URL}/api/recipes/${id}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar la receta');
      }

      const data = await response.json();
      if (data.success) {
        setRecipe(data.recipe);
      } else {
        throw new Error(data.message || 'Error al cargar la receta');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = (step, index) => (
    <View key={step.idStep} style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepNumber}>Paso {step.numberStep}</Text>
      </View>
      <Text style={styles.stepText}>{step.text}</Text>
      {step.photoUrl && (
        <Image
          source={{ uri: `${HOST_URL}${step.photoUrl}` }}
          style={styles.stepPhoto}
          resizeMode="cover"
        />
      )}
    </View>
  );

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
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: `${HOST_URL}${recipe.imageUrl}` }}
        style={styles.recipeImage}
        resizeMode="cover"
      />

      <View style={styles.section}>
        <Text style={styles.recipeTitle}>{recipe.title}</Text>
        <Text style={styles.recipeAuthor}>Por: {recipe.authorName}</Text>
        <Text style={styles.recipeDescription}>{recipe.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalles</Text>
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Tiempo de preparación</Text>
            <Text style={styles.detailValue}>{recipe.prepTime} min</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Tiempo de cocción</Text>
            <Text style={styles.detailValue}>{recipe.cookTime} min</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Porciones</Text>
            <Text style={styles.detailValue}>{recipe.servings}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Dificultad</Text>
            <Text style={styles.detailValue}>{recipe.difficulty}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredientes</Text>
        {recipe.ingredients.map((ingredient, index) => (
          <View key={index} style={styles.ingredientItem}>
            <Text style={styles.ingredientText}>
              • {ingredient.amount} {ingredient.unit} de {ingredient.name}
              {ingredient.isOptional && ' (opcional)'}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pasos</Text>
        {recipe.steps.map((step, index) => renderStep(step, index))}
      </View>
    </ScrollView>
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
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  recipeImage: {
    width: '100%',
    height: 250,
  },
  section: {
    padding: 20,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  recipeAuthor: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  recipeDescription: {
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
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.cardBackground,
    padding: 15,
    borderRadius: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: 'bold',
  },
  ingredientItem: {
    marginBottom: 10,
  },
  ingredientText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  stepContainer: {
    marginBottom: 20,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 15,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  stepText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 10,
    lineHeight: 24,
  },
  stepPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
}); 