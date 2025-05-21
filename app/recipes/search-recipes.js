import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { HOST_URL } from '../config/config';
import { colors } from '../theme/colors';

const RECIPE_TYPES = [
  { typeId: 1, name: 'Desayuno' },
  { typeId: 2, name: 'Almuerzo' },
  { typeId: 3, name: 'Cena' },
  { typeId: 4, name: 'Postre' },
  { typeId: 5, name: 'Aperitivo' },
  { typeId: 6, name: 'Vegetariana' },
  { typeId: 7, name: 'Vegana' },
  { typeId: 8, name: 'Italiana' },
  { typeId: 9, name: 'Mexicana' },
  { typeId: 10, name: 'Asiática' },
  { typeId: 11, name: 'Ensaladas' },
  { typeId: 12, name: 'Sopas' }
];

export default function SearchRecipes() {
  const [searchQuery, setSearchQuery] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [includeIngredients, setIncludeIngredients] = useState([]);
  const [excludeIngredients, setExcludeIngredients] = useState([]);
  const [includeInput, setIncludeInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [pendingRecipes, setPendingRecipes] = useState([]);

  useEffect(() => {
    // Verificar estado de la red y carga
    const checkNetworkAndCharging = async () => {
      try {
        const netInfo = await NetInfo.fetch();
        setIsConnected(netInfo.isConnected);
        setIsCharging(netInfo.details?.isCharging || false);

        // Si hay conexión y no está cargando, intentar subir recetas pendientes
        if (netInfo.isConnected && !netInfo.details?.isCharging) {
          await uploadPendingRecipes();
        }
      } catch (error) {
        console.error('Error checking network status:', error);
      }
    };

    // Verificar estado inicial
    checkNetworkAndCharging();

    // Suscribirse a cambios en la red
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setIsCharging(state.details?.isCharging || false);
      
      // Si hay conexión y no está cargando, intentar subir recetas pendientes
      if (state.isConnected && !state.details?.isCharging) {
        uploadPendingRecipes();
      }
    });

    // Cargar recetas pendientes al iniciar
    loadPendingRecipes();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadPendingRecipes = async () => {
    try {
      const storedRecipes = await AsyncStorage.getItem('pendingRecipes');
      if (storedRecipes) {
        setPendingRecipes(JSON.parse(storedRecipes));
      }
    } catch (error) {
      console.error('Error loading pending recipes:', error);
    }
  };

  const savePendingRecipe = async (recipe) => {
    try {
      const updatedPendingRecipes = [...pendingRecipes, recipe];
      await AsyncStorage.setItem('pendingRecipes', JSON.stringify(updatedPendingRecipes));
      setPendingRecipes(updatedPendingRecipes);
    } catch (error) {
      console.error('Error saving pending recipe:', error);
    }
  };

  const uploadPendingRecipes = async () => {
    if (pendingRecipes.length === 0) return;

    try {
      for (const recipe of pendingRecipes) {
        const response = await fetch(`${HOST_URL}/api/recipes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recipe),
        });

        if (response.ok) {
          // Eliminar la receta pendiente después de subirla exitosamente
          const updatedPendingRecipes = pendingRecipes.filter(r => r !== recipe);
          await AsyncStorage.setItem('pendingRecipes', JSON.stringify(updatedPendingRecipes));
          setPendingRecipes(updatedPendingRecipes);
        }
      }
    } catch (error) {
      console.error('Error uploading pending recipes:', error);
    }
  };

  const handleCreateRecipe = async (recipeData) => {
    if (!isConnected) {
      Alert.alert(
        'Sin conexión',
        'No hay conexión a internet. La receta se guardará localmente y se subirá cuando haya conexión.',
        [{ text: 'OK' }]
      );
      await savePendingRecipe(recipeData);
      return;
    }

    if (isCharging) {
      Alert.alert(
        'Conexión con cargo',
        'Estás usando una red con cargo. ¿Deseas continuar con la carga de la receta?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Guardar localmente',
            onPress: async () => {
              await savePendingRecipe(recipeData);
              Alert.alert(
                'Receta guardada',
                'La receta se guardará localmente y se subirá cuando haya una conexión sin cargo.'
              );
            },
          },
          {
            text: 'Continuar',
            onPress: async () => {
              try {
                const response = await fetch(`${HOST_URL}/api/recipes`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(recipeData),
                });

                if (!response.ok) {
                  throw new Error('Error al crear la receta');
                }

                Alert.alert('Éxito', 'Receta creada correctamente');
              } catch (error) {
                Alert.alert('Error', 'No se pudo crear la receta. Se guardará localmente.');
                await savePendingRecipe(recipeData);
              }
            },
          },
        ]
      );
      return;
    }

    // Si hay conexión y no está cargando, subir directamente
    try {
      const response = await fetch(`${HOST_URL}/api/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) {
        throw new Error('Error al crear la receta');
      }

      Alert.alert('Éxito', 'Receta creada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la receta. Se guardará localmente.');
      await savePendingRecipe(recipeData);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery) params.append('name', searchQuery);
      if (authorName) params.append('authorName', authorName);
      if (selectedType) params.append('typeId', selectedType);
      
      if (includeIngredients.length > 0) {
        params.append('includeIngredients', includeIngredients.join(','));
      }
      if (excludeIngredients.length > 0) {
        params.append('excludeIngredients', excludeIngredients.join(','));
      }
      params.append('sort', sortOption);
      params.append('page', currentPage);
      params.append('limit', 10); // Número de recetas por página

      const response = await fetch(`${HOST_URL}/api/recipes/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Error al buscar recetas');
      }

      const data = await response.json();
      if (data.success) {
        setRecipes(data.recipes);
        setTotalPages(Math.ceil(data.pagination.total / data.pagination.limit));
      } else {
        throw new Error(data.message || 'Error al buscar recetas');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = (type) => {
    const input = type === 'include' ? includeInput : excludeInput;
    if (input.trim()) {
      const normalizedName = input.trim().toLowerCase();
      if (type === 'include') {
        if (!includeIngredients.includes(normalizedName)) {
          setIncludeIngredients([...includeIngredients, normalizedName]);
        }
        setIncludeInput('');
      } else {
        if (!excludeIngredients.includes(normalizedName)) {
          setExcludeIngredients([...excludeIngredients, normalizedName]);
        }
        setExcludeInput('');
      }
    }
  };

  const handleRemoveIngredient = (ingredient, type) => {
    if (type === 'include') {
      setIncludeIngredients(includeIngredients.filter(i => i !== ingredient));
    } else {
      setExcludeIngredients(excludeIngredients.filter(i => i !== ingredient));
    }
  };

  const handleSearchAndClose = async () => {
    await handleSearch();
    setShowFilters(false);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    handleSearch();
  };

  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => router.push(`/recipes/${item.recipeId}`)}
    >
      <View style={styles.recipeHeader}>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        <Text style={styles.recipeAuthor}>Por: {item.authorName}</Text>
      </View>
      <Text style={styles.recipeDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.recipeDetails}>
        <Text style={styles.recipeDetail}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} /> {item.prepTime + item.cookTime} min
        </Text>
        <Text style={styles.recipeDetail}>
          <Ionicons name="restaurant-outline" size={16} color={colors.textSecondary} /> {item.servings} porciones
        </Text>
        <Text style={styles.recipeDetail}>
          <Ionicons name="speedometer-outline" size={16} color={colors.textSecondary} /> {item.difficulty}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Ionicons name="search" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersOverlay}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Filtros de Búsqueda</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFilters(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.filtersContainer}>
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Autor</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Nombre del autor..."
                value={authorName}
                onChangeText={setAuthorName}
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Tipo de Receta</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {RECIPE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.typeId}
                    style={[
                      styles.typeButton,
                      selectedType === type.typeId && styles.typeButtonSelected
                    ]}
                    onPress={() => setSelectedType(
                      selectedType === type.typeId ? null : type.typeId
                    )}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      selectedType === type.typeId && styles.typeButtonTextSelected
                    ]}>
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Ingredientes a Incluir</Text>
              <View style={styles.ingredientInputContainer}>
                <TextInput
                  style={styles.ingredientInput}
                  placeholder="Ingrese un ingrediente..."
                  value={includeInput}
                  onChangeText={setIncludeInput}
                  onSubmitEditing={() => handleAddIngredient('include')}
                />
                <TouchableOpacity
                  style={styles.addIngredientButton}
                  onPress={() => handleAddIngredient('include')}
                >
                  <Ionicons name="add-circle" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.ingredientsContainer}>
                {includeIngredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientTag}>
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveIngredient(ingredient, 'include')}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Ingredientes a Excluir</Text>
              <View style={styles.ingredientInputContainer}>
                <TextInput
                  style={styles.ingredientInput}
                  placeholder="Ingrese un ingrediente..."
                  value={excludeInput}
                  onChangeText={setExcludeInput}
                  onSubmitEditing={() => handleAddIngredient('exclude')}
                />
                <TouchableOpacity
                  style={styles.addIngredientButton}
                  onPress={() => handleAddIngredient('exclude')}
                >
                  <Ionicons name="add-circle" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.ingredientsContainer}>
                {excludeIngredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientTag}>
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveIngredient(ingredient, 'exclude')}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Ordenar por</Text>
              <View style={styles.sortOptionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortOption === 'newest' && styles.sortOptionSelected
                  ]}
                  onPress={() => setSortOption('newest')}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortOption === 'newest' && styles.sortOptionTextSelected
                  ]}>Más recientes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortOption === 'oldest' && styles.sortOptionSelected
                  ]}
                  onPress={() => setSortOption('oldest')}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortOption === 'oldest' && styles.sortOptionTextSelected
                  ]}>Más antiguos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortOption === 'name_asc' && styles.sortOptionSelected
                  ]}
                  onPress={() => setSortOption('name_asc')}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortOption === 'name_asc' && styles.sortOptionTextSelected
                  ]}>A-Z</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortOption === 'name_desc' && styles.sortOptionSelected
                  ]}
                  onPress={() => setSortOption('name_desc')}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortOption === 'name_desc' && styles.sortOptionTextSelected
                  ]}>Z-A</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          <View style={styles.searchButtonContainer}>
            <TouchableOpacity
              style={styles.searchButtonLarge}
              onPress={handleSearchAndClose}
            >
              <Ionicons name="search" size={24} color={colors.white} />
              <Text style={styles.searchButtonText}>Buscar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          <FlatList
            data={recipes}
            renderItem={renderRecipeItem}
            keyExtractor={(item) => item.recipeId.toString()}
            contentContainerStyle={styles.recipesList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No se encontraron recetas que coincidan con los criterios de búsqueda
              </Text>
            }
          />
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Ionicons name="chevron-back" size={24} color={currentPage === 1 ? colors.textSecondary : colors.primary} />
              </TouchableOpacity>
              <Text style={styles.paginationText}>
                Página {currentPage} de {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Ionicons name="chevron-forward" size={24} color={currentPage === totalPages ? colors.textSecondary : colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    padding: 10,
    color: colors.text,
  },
  filterButton: {
    padding: 10,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: {
    padding: 10,
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 1000,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 5,
  },
  filtersContainer: {
    flex: 1,
    padding: 15,
  },
  filterSection: {
    marginBottom: 15,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  filterInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    padding: 10,
    color: colors.text,
  },
  typeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: colors.inputBackground,
    borderRadius: 20,
    marginRight: 10,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    color: colors.text,
  },
  typeButtonTextSelected: {
    color: colors.white,
  },
  ingredientInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  ingredientInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    padding: 10,
    color: colors.text,
  },
  ingredientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ingredientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 5,
  },
  ingredientText: {
    color: colors.text,
  },
  addIngredientButton: {
    padding: 10,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipesList: {
    padding: 10,
  },
  recipeCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  recipeAuthor: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  recipeDescription: {
    color: colors.textSecondary,
    marginBottom: 10,
  },
  recipeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recipeDetail: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    margin: 20,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    margin: 20,
  },
  searchButtonContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  searchButtonLarge: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sortOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: colors.inputBackground,
    borderRadius: 20,
  },
  sortOptionSelected: {
    backgroundColor: colors.primary,
  },
  sortOptionText: {
    color: colors.text,
  },
  sortOptionTextSelected: {
    color: colors.white,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paginationButton: {
    padding: 10,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    marginHorizontal: 15,
    color: colors.text,
  },
}); 