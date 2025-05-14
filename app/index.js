import { router } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from './theme/colors';

export default function HomeScreen() {
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
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.appTitle}>Recipe App</Text>
        <Text style={styles.subtitle}>Discover delicious recipes</Text>
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
    backgroundColor: colors.cream,
  },
  header: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.mutedOlive,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.teal,
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
    color: colors.navyBlue,
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
    borderLeftWidth: 4,
    borderLeftColor: colors.mustard,
  },
  recipeContent: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.navyBlue,
  },
  recipeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recipeTime: {
    fontSize: 14,
    color: colors.teal,
  },
  recipeDifficulty: {
    fontSize: 14,
    color: colors.mustard,
  },
}); 