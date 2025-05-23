import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { HOST_URL } from '../config/config';
import { colors } from '../theme/colors';


export default function UpgradeToStudent() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    userId: '',
    cardNumber: '',
    idFront: null,
    idBack: null,
    paymentMethod: 'credit_card',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert(
          'Acceso denegado',
          'Debes iniciar sesión para acceder a esta página',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/auth/login'),
            },
          ]
        );
        return;
      }
      loadUserId();
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      router.replace('/auth/login');
    }
  };

  const loadUserId = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }
      setFormData(prev => ({ ...prev, userId: 'user123' }));
    } catch (error) {
      console.error('Error al cargar ID de Usuario:', error);
      router.replace('/auth/login');
    }
  };

  const pickImage = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Por favor permita utilizar camara para subir fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData(prev => ({
        ...prev,
        [type]: result.assets[0].uri
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.idFront) {
      newErrors.idFront = 'Foto frontal de ID es requerida';
    }

    if (!formData.idBack) {
      newErrors.idBack = 'Foto trasera de ID es requerida';
    }

    if (!formData.cardNumber) {
      newErrors.cardNumber = 'Tarjeta de crédito es requerida';
    } else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Número de tarjeta inválido';
    }

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
      submitData.append('cardNumber', formData.cardNumber.replace(/\s/g, ''));
      
      if (formData.idFront) {
        submitData.append('idFront', {
          uri: formData.idFront,
          type: 'image/jpeg',
          name: 'id_front.jpg',
        });
      }
      
      if (formData.idBack) {
        submitData.append('idBack', {
          uri: formData.idBack,
          type: 'image/jpeg',
          name: 'id_back.jpg',
        });
      }

      const response = await fetch(`${HOST_URL}/api/students/upgrade`, {
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
          'Exito',
          'Tu cuenta ha sido actualizada a Estudiante!',
          [{
            text: 'OK',
            onPress: () => router.replace('/'),
          }]
        );
      } else {
        if (response.status === 401) {
          Alert.alert('Error', 'Sesión expirada. Por favor, inicia sesión nuevamente.');
          router.replace('/auth/login');
        } else {
          Alert.alert('Error', data.message || 'Error al actualizar la cuenta');
        }
      }
    } catch (error) {
      console.error('Error en submit:', error);
      Alert.alert('Error', 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Actualizar a cuenta de Estudiante</Text>
      <Text style={styles.subtitle}>
        Por favor sube una foto de tu ID y la información de pago para completar la actualización.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verificación ID</Text>
        <View style={styles.photoContainer}>
          <View style={styles.photoUpload}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => pickImage('idFront')}
            >
              {formData.idFront ? (
                <Image source={{ uri: formData.idFront }} style={styles.photoPreview} />
              ) : (
                <Text style={styles.photoButtonText}>Cargar Foto Frontal</Text>
              )}
            </TouchableOpacity>
            {errors.idFront && <Text style={styles.errorText}>{errors.idFront}</Text>}
          </View>

          <View style={styles.photoUpload}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => pickImage('idBack')}
            >
              {formData.idBack ? (
                <Image source={{ uri: formData.idBack }} style={styles.photoPreview} />
              ) : (
                <Text style={styles.photoButtonText}>Cargar Foto Trasera</Text>
              )}
            </TouchableOpacity>
            {errors.idBack && <Text style={styles.errorText}>{errors.idBack}</Text>}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>información de Pago</Text>
        <TextInput
          style={[styles.input, errors.cardNumber && styles.inputError]}
          placeholder="Tarjeta de Crédito (16 dígitos)"
          value={formData.cardNumber}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, cardNumber: text }));
            setErrors(prev => ({ ...prev, cardNumber: '' }));
          }}
          keyboardType="numeric"
          maxLength={19}
        />
        {errors.cardNumber && <Text style={styles.errorText}>{errors.cardNumber}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Procesando...' : 'Actualizar Cuenta'}
        </Text>
      </TouchableOpacity>
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
    marginBottom: 10,
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 30,
    lineHeight: 22,
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
  inputError: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 5,
  },
  photoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoUpload: {
    width: '48%',
  },
  photoButton: {
    backgroundColor: colors.inputBackground,
    height: 150,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  photoButtonText: {
    color: colors.textSecondary,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
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
});