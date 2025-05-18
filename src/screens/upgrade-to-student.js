import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../config';
import { UNITS } from '../constants/units';
import { useAuth } from '../context/AuthContext';

const UpgradeToStudent = () => {
  const navigation = useNavigation();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    unit: '',
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!token) {
      Alert.alert('Error', 'Debes iniciar sesión para acceder a esta página');
      navigation.navigate('Login');
    }
  }, [token, navigation]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'unit') {
      if (value.trim() === '') {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const filteredSuggestions = UNITS.filter(unit =>
        unit.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      unit: suggestion
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    if (!formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.unit) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/upgrade-to-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cardNumber: formData.cardNumber,
          expiryDate: formData.expiryDate,
          cvv: formData.cvv,
          unit: formData.unit
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Éxito', 'Tu cuenta ha sido actualizada a estudiante');
        navigation.navigate('Profile');
      } else {
        Alert.alert('Error', data.message || 'Error al actualizar la cuenta');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Actualizar a Estudiante</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Número de Tarjeta</Text>
        <TextInput
          style={styles.input}
          placeholder="1234 5678 9012 3456"
          value={formData.cardNumber}
          onChangeText={(value) => handleInputChange('cardNumber', value)}
          keyboardType="numeric"
          maxLength={19}
        />

        <Text style={styles.label}>Fecha de Vencimiento</Text>
        <TextInput
          style={styles.input}
          placeholder="MM/AA"
          value={formData.expiryDate}
          onChangeText={(value) => handleInputChange('expiryDate', value)}
          keyboardType="numeric"
          maxLength={5}
        />

        <Text style={styles.label}>CVV</Text>
        <TextInput
          style={styles.input}
          placeholder="123"
          value={formData.cvv}
          onChangeText={(value) => handleInputChange('cvv', value)}
          keyboardType="numeric"
          maxLength={3}
          secureTextEntry
        />

        <Text style={styles.label}>Unidad Académica</Text>
        <View style={styles.unitContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ingrese su unidad académica"
            value={formData.unit}
            onChangeText={(value) => handleInputChange('unit', value)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <Text>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Actualizar a Estudiante</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  unitContainer: {
    position: 'relative',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 1000,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default UpgradeToStudent; 