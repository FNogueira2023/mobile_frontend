import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import { HOST_URL } from '../config/config';
import { colors } from '../theme/colors';

// Lista de unidades comunes para recetas
const UNITS = [
  { id: 'g', name: 'Gramos (g)' },
  { id: 'kg', name: 'Kilogramos (kg)' },
  { id: 'ml', name: 'Mililitros (ml)' },
  { id: 'l', name: 'Litros (l)' },
  { id: 'tbsp', name: 'Cucharada (tbsp)'},
  { id: 'cup', name: 'Taza (cup)' },
  { id: 'unit', name: 'Unidad' }
];

export default function CreateRecipe() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isUnitModalVisible, setIsUnitModalVisible] = useState(false);
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    difficulty: 'medium',
    isPublic: false,
    imageUrl: null,
    ingredients: [{ ingredientId: '', quantity: '', unitId: '' }]
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeUnitIndex, setActiveUnitIndex] = useState(null);
  const [isDifficultyModalVisible, setIsDifficultyModalVisible] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(
          'Acceso denegado',
          'Debes iniciar sesión para crear una receta',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/auth/login'),
            },
          ]
        );
        return;
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      router.replace('/auth/login');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Por favor permita acceder a la galería para subir fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData(prev => ({
        ...prev,
        imageUrl: result.assets[0].uri
      }));
    }
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredientId: '', quantity: '', unitId: '' }]
    }));
  };

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  const handleUnitChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, unitText: value } : ing
      )
    }));
    
    if (value.trim() === '') {
      return;
    }

    const filteredUnits = UNITS.filter(unit =>
      unit.name.toLowerCase().includes(value.toLowerCase())
    );

    if (filteredUnits.length > 0) {
      Alert.alert(
        'Unidades similares',
        'Selecciona una unidad:',
        [
          ...filteredUnits.map(unit => ({
            text: unit.name,
            onPress: () => {
              setFormData(prev => ({
                ...prev,
                ingredients: prev.ingredients.map((ing, i) => 
                  i === index ? { ...ing, unitId: unit.id, unitText: unit.name } : ing
                )
              }));
            }
          })),
          {
            text: 'Cancelar',
            style: 'cancel'
          }
        ]
      );
    }
  };

  const handleSuggestionPress = (index, unit) => {
    updateIngredient(index, 'unitId', unit.id);
    setShowSuggestions(false);
    setActiveUnitIndex(null);
  };

  const getUnitName = (unitId) => {
    const unit = UNITS.find(u => u.id === unitId);
    return unit ? unit.name : '';
  };

  const getUnitDisplay = (index, unitId) => {
    if (activeUnitIndex === index) {
      return '';
    }
    return getUnitName(unitId);
  };

  const DIFFICULTY_OPTIONS = [
    { id: 'easy', name: 'Fácil' },
    { id: 'medium', name: 'Media' },
    { id: 'hard', name: 'Difícil' }
  ];

  const showDifficultyPicker = () => {
    setIsDifficultyModalVisible(true);
  };

  const handleDifficultySelect = (difficulty) => {
    setFormData(prev => ({ ...prev, difficulty: difficulty.id }));
    setIsDifficultyModalVisible(false);
  };

  const getDifficultyName = (difficultyId) => {
    const difficulty = DIFFICULTY_OPTIONS.find(d => d.id === difficultyId);
    return difficulty ? difficulty.name : 'Seleccionar dificultad';
  };

  const renderDifficultyItem = ({ item }) => (
    <TouchableOpacity
      style={styles.difficultyItem}
      onPress={() => handleDifficultySelect(item)}
    >
      <View style={styles.radioContainer}>
        <View style={[
          styles.radio,
          formData.difficulty === item.id && styles.radioSelected
        ]}>
          {formData.difficulty === item.id && (
            <View style={styles.radioInner} />
          )}
        </View>
        <Text style={styles.difficultyItemText}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.description) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.instructions) {
      newErrors.instructions = 'Las instrucciones son requeridas';
    }

    if (!formData.prepTime) {
      newErrors.prepTime = 'El tiempo de preparación es requerido';
    } else if (isNaN(formData.prepTime) || formData.prepTime <= 0) {
      newErrors.prepTime = 'El tiempo de preparación debe ser un número positivo';
    }

    if (!formData.cookTime) {
      newErrors.cookTime = 'El tiempo de cocción es requerido';
    } else if (isNaN(formData.cookTime) || formData.cookTime <= 0) {
      newErrors.cookTime = 'El tiempo de cocción debe ser un número positivo';
    }

    if (!formData.servings) {
      newErrors.servings = 'El número de porciones es requerido';
    } else if (isNaN(formData.servings) || formData.servings <= 0) {
      newErrors.servings = 'El número de porciones debe ser un número positivo';
    }

    if (!formData.imageUrl) {
      newErrors.imageUrl = 'La imagen es requerida';
    }

    // Validate ingredients
    formData.ingredients.forEach((ing, index) => {
      if (!ing.ingredientId) {
        newErrors[`ingredient_${index}`] = 'El ingrediente es requerido';
      }
      if (!ing.quantity) {
        newErrors[`quantity_${index}`] = 'La cantidad es requerida';
      }
      if (!ing.unitId) {
        newErrors[`unit_${index}`] = 'La unidad es requerida';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');

      if (!token || !userId) {
        Alert.alert('Error', 'Sesión expirada. Por favor, inicia sesión nuevamente.');
        router.replace('/auth/login');
        return;
      }

      const submitData = new FormData();
      submitData.append('userId', userId);
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('instructions', formData.instructions);
      submitData.append('prepTime', formData.prepTime);
      submitData.append('cookTime', formData.cookTime);
      submitData.append('servings', formData.servings);
      submitData.append('difficulty', formData.difficulty);
      submitData.append('isPublic', formData.isPublic.toString());
      submitData.append('ingredients', JSON.stringify(formData.ingredients));
      
      if (formData.imageUrl) {
        submitData.append('imageUrl', {
          uri: formData.imageUrl,
          type: 'image/jpeg',
          name: 'recipe.jpg',
        });
      }

      const response = await fetch(`${HOST_URL}/api/recipes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: submitData,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Éxito',
          'Receta creada exitosamente',
          [{
            text: 'OK',
            onPress: () => router.replace('/recipes'),
          }]
        );
      } else {
        if (response.status === 401) {
          Alert.alert('Error', 'Sesión expirada. Por favor, inicia sesión nuevamente.');
          router.replace('/auth/login');
        } else {
          Alert.alert('Error', data.message || 'Error al crear la receta');
        }
      }
    } catch (error) {
      console.error('Error en submit:', error);
      Alert.alert('Error', 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const showUnitPicker = (index) => {
    setSelectedUnitIndex(index);
    setIsUnitModalVisible(true);
  };

  const handleUnitSelect = (unit) => {
    if (selectedUnitIndex !== null) {
      updateIngredient(selectedUnitIndex, 'unitId', unit.id);
      setIsUnitModalVisible(false);
    }
  };

  const renderUnitItem = ({ item }) => (
    <TouchableOpacity
      style={styles.unitItem}
      onPress={() => handleUnitSelect(item)}
    >
      <View style={styles.radioContainer}>
        <View style={[
          styles.radio,
          formData.ingredients[selectedUnitIndex]?.unitId === item.id && styles.radioSelected
        ]}>
          {formData.ingredients[selectedUnitIndex]?.unitId === item.id && (
            <View style={styles.radioInner} />
          )}
        </View>
        <Text style={styles.unitItemText}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Crear Nueva Receta</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Básica</Text>
        
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          placeholder="Título de la receta"
          value={formData.title}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, title: text }));
            setErrors(prev => ({ ...prev, title: '' }));
          }}
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

        <TextInput
          style={[styles.input, styles.textArea, errors.description && styles.inputError]}
          placeholder="Descripción"
          value={formData.description}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, description: text }));
            setErrors(prev => ({ ...prev, description: '' }));
          }}
          multiline
          numberOfLines={4}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <TextInput
              style={[styles.input, errors.prepTime && styles.inputError]}
              placeholder="Tiempo de preparación (min)"
              value={formData.prepTime}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, prepTime: text }));
                setErrors(prev => ({ ...prev, prepTime: '' }));
              }}
              keyboardType="numeric"
            />
            {errors.prepTime && <Text style={styles.errorText}>{errors.prepTime}</Text>}
          </View>

          <View style={styles.halfInput}>
            <TextInput
              style={[styles.input, errors.cookTime && styles.inputError]}
              placeholder="Tiempo de cocción (min)"
              value={formData.cookTime}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, cookTime: text }));
                setErrors(prev => ({ ...prev, cookTime: '' }));
              }}
              keyboardType="numeric"
            />
            {errors.cookTime && <Text style={styles.errorText}>{errors.cookTime}</Text>}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <TextInput
              style={[styles.input, errors.servings && styles.inputError]}
              placeholder="Porciones"
              value={formData.servings}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, servings: text }));
                setErrors(prev => ({ ...prev, servings: '' }));
              }}
              keyboardType="numeric"
            />
            {errors.servings && <Text style={styles.errorText}>{errors.servings}</Text>}
          </View>

          <View style={styles.halfInput}>
            <TouchableOpacity
              style={[styles.input, styles.picker, errors.difficulty && styles.inputError]}
              onPress={showDifficultyPicker}
            >
              <Text style={styles.pickerText}>
                {getDifficultyName(formData.difficulty)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Imagen de la Receta</Text>
        <TouchableOpacity
          style={[styles.imageButton, errors.imageUrl && styles.inputError]}
          onPress={pickImage}
        >
          {formData.imageUrl ? (
            <Image source={{ uri: formData.imageUrl }} style={styles.imagePreview} />
          ) : (
            <Text style={styles.imageButtonText}>Seleccionar Imagen</Text>
          )}
        </TouchableOpacity>
        {errors.imageUrl && <Text style={styles.errorText}>{errors.imageUrl}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredientes</Text>
        {formData.ingredients.map((ingredient, index) => (
          <View key={index} style={styles.ingredientRow}>
            <View style={styles.ingredientInputs}>
              <TextInput
                style={[styles.input, styles.ingredientInput, errors[`ingredient_${index}`] && styles.inputError]}
                placeholder="Ingrediente"
                value={ingredient.ingredientId}
                onChangeText={(text) => updateIngredient(index, 'ingredientId', text)}
              />
              <TextInput
                style={[styles.input, styles.quantityInput, errors[`quantity_${index}`] && styles.inputError]}
                placeholder="Cantidad"
                value={ingredient.quantity}
                onChangeText={(text) => updateIngredient(index, 'quantity', text)}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={[styles.input, styles.unitInput, errors[`unit_${index}`] && styles.inputError]}
                onPress={() => showUnitPicker(index)}
              >
                <Text style={styles.unitText}>
                  {getUnitName(ingredient.unitId) || 'Seleccionar unidad'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeIngredient(index)}
            >
              <Text style={styles.removeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={styles.addButton}
          onPress={addIngredient}
        >
          <Text style={styles.addButtonText}>+ Agregar Ingrediente</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instrucciones</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.instructions && styles.inputError]}
          placeholder="Describe los pasos a seguir..."
          value={formData.instructions}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, instructions: text }));
            setErrors(prev => ({ ...prev, instructions: '' }));
          }}
          multiline
          numberOfLines={6}
        />
        {errors.instructions && <Text style={styles.errorText}>{errors.instructions}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creando...' : 'Crear Receta'}
        </Text>
      </TouchableOpacity>

      <Modal
        isVisible={isUnitModalVisible}
        onBackdropPress={() => setIsUnitModalVisible(false)}
        onBackButtonPress={() => setIsUnitModalVisible(false)}
        style={styles.modal}
        backdropOpacity={0.5}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar Unidad</Text>
          <FlatList
            data={UNITS}
            renderItem={renderUnitItem}
            keyExtractor={(item) => item.id}
            style={styles.unitList}
          />
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setIsUnitModalVisible(false)}
          >
            <Text style={styles.modalCloseButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        isVisible={isDifficultyModalVisible}
        onBackdropPress={() => setIsDifficultyModalVisible(false)}
        onBackButtonPress={() => setIsDifficultyModalVisible(false)}
        style={styles.modal}
        backdropOpacity={0.5}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar Dificultad</Text>
          <FlatList
            data={DIFFICULTY_OPTIONS}
            renderItem={renderDifficultyItem}
            keyExtractor={(item) => item.id}
            style={styles.difficultyList}
          />
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setIsDifficultyModalVisible(false)}
          >
            <Text style={styles.modalCloseButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.inputBackground,
    padding: 15,
    borderRadius: 10,
    color: colors.text,
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -5,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  picker: {
    justifyContent: 'center',
  },
  pickerText: {
    color: colors.text,
  },
  imageButton: {
    backgroundColor: colors.inputBackground,
    height: 200,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imageButtonText: {
    color: colors.textSecondary,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ingredientInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  ingredientInput: {
    flex: 2,
  },
  quantityInput: {
    flex: 1,
  },
  unitContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  unitInput: {
    flex: 1,
  },
  removeButton: {
    padding: 10,
    marginLeft: 10,
  },
  removeButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: colors.inputBackground,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    zIndex: 1000,
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionsScroll: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    color: colors.text,
    fontSize: 14,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
    textAlign: 'center',
  },
  unitList: {
    maxHeight: 400,
  },
  unitItem: {
    padding: 5,
  },
  unitItemText: {
    fontSize: 16,
    color: colors.text,
  },
  modalCloseButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  unitText: {
    color: colors.text,
    fontSize: 16,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  radio: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  difficultyItem: {
    padding: 5,
  },
  difficultyItemText: {
    fontSize: 16,
    color: colors.text,
  },
  difficultyList: {
    maxHeight: 200,
  },
}); 