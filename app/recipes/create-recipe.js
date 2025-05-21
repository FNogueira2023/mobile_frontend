import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
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
  { abbreviation: 'g', name: 'Gramos (g)' },
  { abbreviation: 'kg', name: 'Kilogramos (kg)' },
  { abbreviation: 'ml', name: 'Mililitros (ml)' },
  { abbreviation: 'l', name: 'Litros (l)' },
  { abbreviation: 'tbsp', name: 'Cucharada (tbsp)'},
  { abbreviation: 'cup', name: 'Taza (cup)' },
  { abbreviation: 'unit', name: 'Unidad' }
];

// Agregar después de las constantes existentes
const RECIPE_TYPES = [
  { id: 1, name: 'Desayuno' },
  { id: 2, name: 'Almuerzo' },
  { id: 3, name: 'Cena' },
  { id: 4, name: 'Postre' },
  { id: 5, name: 'Aperitivo' },
  { id: 6, name: 'Vegetariana' },
  { id: 7, name: 'Vegana' },
  { id: 8, name: 'Italiana' },
  { id: 9, name: 'Mexicana' },
  { id: 10, name: 'Asiática' },
  { id: 11, name: 'Ensaladas' },
  { id: 12, name: 'Sopas' }
];

export default function CreateRecipe() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isUnitModalVisible, setIsUnitModalVisible] = useState(false);
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    difficulty: 'medium',
    isPublic: false,
    imageUrl: null,
    ingredients: [{ name: '', amount: '', unit: '' }],
    steps: [{ text: '', photo: null }]
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeUnitIndex, setActiveUnitIndex] = useState(null);
  const [isDifficultyModalVisible, setIsDifficultyModalVisible] = useState(false);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

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
      allowsMultipleSelection: false,
      exif: false,
    });

    if (!result.canceled) {
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      
      if (blob.size > 5 * 1024 * 1024) {
        Alert.alert('Error', 'La imagen es demasiado grande. El tamaño máximo permitido es 5MB.');
        return;
      }

      const fileExtension = result.assets[0].uri.split('.').pop().toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
        Alert.alert('Error', 'Solo se permiten archivos de imagen (jpg, jpeg, png, gif).');
        return;
      }

      setFormData(prev => ({
        ...prev,
        imageUrl: result.assets[0].uri
      }));
    }
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', amount: '', unit: '' }]
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
                  i === index ? { ...ing, unit: unit.abbreviation, unitText: unit.name } : ing
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
    updateIngredient(index, 'unit', unit.abbreviation);
    setShowSuggestions(false);
    setActiveUnitIndex(null);
  };

  const getUnitName = (abbreviation) => {
    const unit = UNITS.find(u => u.abbreviation === abbreviation);
    return unit ? unit.name : '';
  };

  const getUnitDisplay = (index, abbreviation) => {
    if (activeUnitIndex === index) {
      return '';
    }
    return getUnitName(abbreviation);
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
      if (!ing.name) {
        newErrors[`ingredient_${index}`] = 'El ingrediente es requerido';
      }
      if (!ing.amount) {
        newErrors[`quantity_${index}`] = 'La cantidad es requerida';
      } else if (isNaN(ing.amount) || ing.amount <= 0) {
        newErrors[`quantity_${index}`] = 'La cantidad debe ser un número positivo';
      }
      if (!ing.unit) {
        newErrors[`unit_${index}`] = 'La unidad es requerida';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateRecipe = async () => {
    try {
      setHasAttemptedSubmit(true);
      // Validar campos requeridos
      const missingFields = [];
      
      if (!formData.title) missingFields.push('Título');
      if (!formData.description) missingFields.push('Descripción');
      if (!formData.prepTime) missingFields.push('Tiempo de preparación');
      if (!formData.cookTime) missingFields.push('Tiempo de cocción');
      if (!formData.servings) missingFields.push('Porciones');
      if (!formData.difficulty) missingFields.push('Dificultad');
      if (!selectedType) missingFields.push('Tipo de receta');

      if (missingFields.length > 0) {
        Alert.alert(
          'Campos requeridos',
          `Por favor complete los siguientes campos:\n\n${missingFields.join('\n')}`
        );
        return;
      }

      // Validar ingredientes
      if (formData.ingredients.length === 0) {
        Alert.alert('Error', 'Debe agregar al menos un ingrediente');
        return;
      }

      // Validar que todos los ingredientes estén completos
      const incompleteIngredients = formData.ingredients.map((ing, index) => {
        const missing = [];
        if (!ing.name) missing.push('nombre');
        if (!ing.amount) missing.push('cantidad');
        if (!ing.unit) missing.push('unidad');
        return missing.length > 0 ? { index: index + 1, missing } : null;
      }).filter(Boolean);

      if (incompleteIngredients.length > 0) {
        const message = incompleteIngredients.map(ing => 
          `Ingrediente ${ing.index}: falta ${ing.missing.join(', ')}`
        ).join('\n');
        
        Alert.alert(
          'Ingredientes incompletos',
          `Complete los siguientes campos:\n\n${message}`
        );
        return;
      }

      // Validar pasos
      if (formData.steps.length === 0) {
        Alert.alert('Error', 'Debe agregar al menos un paso');
        return;
      }

      // Validar que todos los pasos tengan texto
      const incompleteSteps = formData.steps.map((step, index) => 
        !step.text ? index + 1 : null
      ).filter(Boolean);

      if (incompleteSteps.length > 0) {
        Alert.alert(
          'Pasos incompletos',
          `Complete el texto de los siguientes pasos:\n\n${incompleteSteps.join(', ')}`
        );
        return;
      }

      const recipeData = {
        title: formData.title,
        description: formData.description,
        prepTime: parseInt(formData.prepTime),
        cookTime: parseInt(formData.cookTime),
        servings: parseInt(formData.servings),
        difficulty: formData.difficulty,
        typeId: selectedType,
        ingredients: formData.ingredients.map(ing => ({
          name: ing.name,
          amount: parseFloat(ing.amount),
          unit: ing.unit,
          isOptional: ing.isOptional || false
        })),
        steps: formData.steps.map(step => ({
          text: step.text,
          photo: step.photo
        }))
      };

      // Verificar estado de la red
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected;
      const isCharging = netInfo.details?.isCharging || false;

      if (!isConnected) {
        Alert.alert(
          'Sin conexión',
          'No hay conexión a internet. La receta se guardará localmente y se subirá cuando haya conexión.',
          [{ text: 'OK' }]
        );
        await savePendingRecipe(recipeData);
        router.back();
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
                router.back();
              },
            },
            {
              text: 'Continuar',
              onPress: async () => {
                await uploadRecipe(recipeData);
              },
            },
          ]
        );
        return;
      }

      // Si hay conexión y no está cargando, subir directamente
      await uploadRecipe(recipeData);

    } catch (error) {
      console.error('Error creating recipe:', error);
      Alert.alert('Error', 'No se pudo crear la receta. Por favor intente nuevamente.');
    }
  };

  const uploadRecipe = async (recipeData) => {
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
      router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la receta. Se guardará localmente.');
      await savePendingRecipe(recipeData);
      router.back();
    }
  };

  const savePendingRecipe = async (recipe) => {
    try {
      const storedRecipes = await AsyncStorage.getItem('pendingRecipes');
      const pendingRecipes = storedRecipes ? JSON.parse(storedRecipes) : [];
      pendingRecipes.push(recipe);
      await AsyncStorage.setItem('pendingRecipes', JSON.stringify(pendingRecipes));
    } catch (error) {
      console.error('Error saving pending recipe:', error);
    }
  };

  const showUnitPicker = (index) => {
    setSelectedUnitIndex(index);
    setIsUnitModalVisible(true);
  };

  const handleUnitSelect = (unit) => {
    if (selectedUnitIndex !== null) {
      updateIngredient(selectedUnitIndex, 'unit', unit.abbreviation);
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
          formData.ingredients[selectedUnitIndex]?.unit === item.abbreviation && styles.radioSelected
        ]}>
          {formData.ingredients[selectedUnitIndex]?.unit === item.abbreviation && (
            <View style={styles.radioInner} />
          )}
        </View>
        <Text style={styles.unitItemText}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { text: '', photo: null }]
    }));
  };

  const removeStep = (index) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const updateStep = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const pickStepPhoto = async (index) => {
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
      allowsMultipleSelection: false,
      exif: false,
    });

    if (!result.canceled) {
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      
      if (blob.size > 5 * 1024 * 1024) {
        Alert.alert('Error', 'La imagen es demasiado grande. El tamaño máximo permitido es 5MB.');
        return;
      }

      const fileExtension = result.assets[0].uri.split('.').pop().toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
        Alert.alert('Error', 'Solo se permiten archivos de imagen (jpg, jpeg, png, gif).');
        return;
      }

      updateStep(index, 'photo', {
        extension: fileExtension,
        url: result.assets[0].uri
      });
    }
  };

  const removeStepPhoto = (index) => {
    updateStep(index, 'photo', null);
  };

  const showTypePicker = () => {
    setIsTypeModalVisible(true);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type.id);
    setIsTypeModalVisible(false);
  };

  const getTypeName = (typeId) => {
    const type = RECIPE_TYPES.find(t => t.id === typeId);
    return type ? type.name : 'Seleccionar tipo';
  };

  const renderTypeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.typeItem}
      onPress={() => handleTypeSelect(item)}
    >
      <View style={styles.radioContainer}>
        <View style={[
          styles.radio,
          selectedType === item.id && styles.radioSelected
        ]}>
          {selectedType === item.id && (
            <View style={styles.radioInner} />
          )}
        </View>
        <Text style={styles.typeItemText}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const getInputStyle = (field) => {
    if (!hasAttemptedSubmit) return styles.input;
    return [
      styles.input,
      !formData[field] && styles.inputError
    ];
  };

  const getPickerStyle = (field) => {
    if (!hasAttemptedSubmit) return [styles.input, styles.picker];
    return [
      styles.input,
      styles.picker,
      !formData[field] && styles.inputError
    ];
  };

  const getTypePickerStyle = () => {
    if (!hasAttemptedSubmit) return [styles.input, styles.picker];
    return [
      styles.input,
      styles.picker,
      !selectedType && styles.inputError
    ];
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Crear Nueva Receta</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Básica</Text>
        
        <TextInput
          style={getInputStyle('title')}
          placeholder="Título de la receta"
          value={formData.title}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, title: text }));
            setErrors(prev => ({ ...prev, title: '' }));
          }}
        />
        {hasAttemptedSubmit && !formData.title && <Text style={styles.errorText}>El título es requerido</Text>}

        <TextInput
          style={getInputStyle('description')}
          placeholder="Descripción"
          value={formData.description}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, description: text }));
            setErrors(prev => ({ ...prev, description: '' }));
          }}
          multiline
          numberOfLines={4}
        />
        {hasAttemptedSubmit && !formData.description && <Text style={styles.errorText}>La descripción es requerida</Text>}

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <TextInput
              style={getInputStyle('prepTime')}
              placeholder="Tiempo Prep (min)"
              value={formData.prepTime}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, prepTime: text }));
                setErrors(prev => ({ ...prev, prepTime: '' }));
              }}
              keyboardType="numeric"
            />
            {hasAttemptedSubmit && !formData.prepTime && <Text style={styles.errorText}>El tiempo de preparación es requerido</Text>}
          </View>

          <View style={styles.halfInput}>
            <TextInput
              style={getInputStyle('cookTime')}
              placeholder="Tiempo cocción (min)"
              value={formData.cookTime}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, cookTime: text }));
                setErrors(prev => ({ ...prev, cookTime: '' }));
              }}
              keyboardType="numeric"
            />
            {hasAttemptedSubmit && !formData.cookTime && <Text style={styles.errorText}>El tiempo de cocción es requerido</Text>}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <TextInput
              style={getInputStyle('servings')}
              placeholder="Porciones"
              value={formData.servings}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, servings: text }));
                setErrors(prev => ({ ...prev, servings: '' }));
              }}
              keyboardType="numeric"
            />
            {hasAttemptedSubmit && !formData.servings && <Text style={styles.errorText}>El número de porciones es requerido</Text>}
          </View>

          <View style={styles.halfInput}>
            <TouchableOpacity
              style={getPickerStyle('difficulty')}
              onPress={showDifficultyPicker}
            >
              <Text style={styles.pickerText}>
                {getDifficultyName(formData.difficulty)}
              </Text>
            </TouchableOpacity>
            {hasAttemptedSubmit && !formData.difficulty && <Text style={styles.errorText}>La dificultad es requerida</Text>}
          </View>
        </View>

        <TouchableOpacity
          style={getTypePickerStyle()}
          onPress={showTypePicker}
        >
          <Text style={styles.pickerText}>
            {getTypeName(selectedType)}
          </Text>
        </TouchableOpacity>
        {hasAttemptedSubmit && !selectedType && <Text style={styles.errorText}>El tipo de receta es requerido</Text>}
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
                value={ingredient.name}
                onChangeText={(text) => updateIngredient(index, 'name', text)}
              />
              <TextInput
                style={[styles.input, styles.quantityInput, errors[`quantity_${index}`] && styles.inputError]}
                placeholder="Cantidad"
                value={ingredient.amount}
                onChangeText={(text) => updateIngredient(index, 'amount', text)}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={[styles.input, styles.unitInput, errors[`unit_${index}`] && styles.inputError]}
                onPress={() => showUnitPicker(index)}
              >
                <Text style={styles.unitText}>
                  {getUnitName(ingredient.unit) || 'Unidad'}
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
        <Text style={styles.sectionTitle}>Pasos de la Receta</Text>
        {formData.steps.map((step, index) => (
          <View key={index} style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>Paso {index + 1}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeStep(index)}
              >
                <Text style={styles.removeButtonText}>X</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.input, styles.textArea, errors[`step_${index}`] && styles.inputError]}
              placeholder="Describe este paso..."
              value={step.text}
              onChangeText={(text) => updateStep(index, 'text', text)}
              multiline
              numberOfLines={3}
            />
            {errors[`step_${index}`] && <Text style={styles.errorText}>{errors[`step_${index}`]}</Text>}

            <View style={styles.stepPhotoContainer}>
              {step.photo ? (
                <View style={styles.stepPhotoPreview}>
                  <Image source={{ uri: step.photo.url }} style={styles.stepPhoto} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removeStepPhoto(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={() => pickStepPhoto(index)}
                >
                  <Ionicons name="camera" size={24} color={colors.primary} />
                  <Text style={styles.addPhotoText}>Agregar foto</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        <TouchableOpacity
          style={styles.addButton}
          onPress={addStep}
        >
          <Text style={styles.addButtonText}>+ Agregar Paso</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateRecipe}
      >
        <Text style={styles.createButtonText}>Crear Receta</Text>
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
            keyExtractor={(item) => item.abbreviation}
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

      <Modal
        isVisible={isTypeModalVisible}
        onBackdropPress={() => setIsTypeModalVisible(false)}
        onBackButtonPress={() => setIsTypeModalVisible(false)}
        style={styles.modal}
        backdropOpacity={0.5}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar Tipo de Receta</Text>
          <FlatList
            data={RECIPE_TYPES}
            renderItem={renderTypeItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.typeList}
          />
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setIsTypeModalVisible(false)}
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
    flex: 1.5,
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
  createButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  createButtonText: {
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
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  stepPhotoContainer: {
    marginTop: 10,
  },
  stepPhotoPreview: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
  },
  stepPhoto: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBackground,
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  addPhotoText: {
    color: colors.primary,
    fontSize: 16,
  },
  typeList: {
    maxHeight: 400,
  },
  typeItem: {
    padding: 5,
  },
  typeItemText: {
    fontSize: 16,
    color: colors.text,
  },
}); 