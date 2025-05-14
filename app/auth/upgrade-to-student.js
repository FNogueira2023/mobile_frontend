import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { colors } from '../theme/colors';

export default function UpgradeToStudent() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    studentId: '',
    paymentMethod: 'credit_card', // Default payment method
    idFront: null,
    idBack: null,
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  const pickImage = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload ID photos.');
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

    if (!formData.studentId) {
      newErrors.studentId = 'Student ID is required';
    }

    if (!formData.idFront) {
      newErrors.idFront = 'Front ID photo is required';
    }

    if (!formData.idBack) {
      newErrors.idBack = 'Back ID photo is required';
    }

    if (formData.paymentMethod === 'credit_card') {
      if (!formData.cardNumber) {
        newErrors.cardNumber = 'Card number is required';
      } else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
        newErrors.cardNumber = 'Invalid card number';
      }

      if (!formData.expiryDate) {
        newErrors.expiryDate = 'Expiry date is required';
      } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate)) {
        newErrors.expiryDate = 'Invalid expiry date (MM/YY)';
      }

      if (!formData.cvv) {
        newErrors.cvv = 'CVV is required';
      } else if (!/^\d{3,4}$/.test(formData.cvv)) {
        newErrors.cvv = 'Invalid CVV';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create FormData for multipart/form-data
      const submitData = new FormData();
      submitData.append('studentId', formData.studentId);
      submitData.append('paymentMethod', formData.paymentMethod);
      
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

      if (formData.paymentMethod === 'credit_card') {
        submitData.append('cardNumber', formData.cardNumber);
        submitData.append('expiryDate', formData.expiryDate);
        submitData.append('cvv', formData.cvv);
      }

      const response = await fetch('http://your-backend-url/api/upgrade-to-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: submitData,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'Your account has been upgraded to Student status!',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/'),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to upgrade account');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Upgrade to Student Account</Text>
      <Text style={styles.subtitle}>
        Please provide your student ID and payment information to access premium features.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Information</Text>
        <TextInput
          style={[styles.input, errors.studentId && styles.inputError]}
          placeholder="Student ID"
          value={formData.studentId}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, studentId: text }));
            setErrors(prev => ({ ...prev, studentId: '' }));
          }}
        />
        {errors.studentId ? <Text style={styles.errorText}>{errors.studentId}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ID Verification</Text>
        <View style={styles.photoContainer}>
          <View style={styles.photoUpload}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => pickImage('idFront')}
            >
              {formData.idFront ? (
                <Image source={{ uri: formData.idFront }} style={styles.photoPreview} />
              ) : (
                <Text style={styles.photoButtonText}>Upload Front ID</Text>
              )}
            </TouchableOpacity>
            {errors.idFront ? <Text style={styles.errorText}>{errors.idFront}</Text> : null}
          </View>

          <View style={styles.photoUpload}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => pickImage('idBack')}
            >
              {formData.idBack ? (
                <Image source={{ uri: formData.idBack }} style={styles.photoPreview} />
              ) : (
                <Text style={styles.photoButtonText}>Upload Back ID</Text>
              )}
            </TouchableOpacity>
            {errors.idBack ? <Text style={styles.errorText}>{errors.idBack}</Text> : null}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Information</Text>
        <View style={styles.paymentMethodContainer}>
          <TouchableOpacity
            style={[
              styles.paymentMethod,
              formData.paymentMethod === 'credit_card' && styles.paymentMethodSelected,
            ]}
            onPress={() => setFormData(prev => ({ ...prev, paymentMethod: 'credit_card' }))}
          >
            <Text style={styles.paymentMethodText}>Credit Card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paymentMethod,
              formData.paymentMethod === 'paypal' && styles.paymentMethodSelected,
            ]}
            onPress={() => setFormData(prev => ({ ...prev, paymentMethod: 'paypal' }))}
          >
            <Text style={styles.paymentMethodText}>PayPal</Text>
          </TouchableOpacity>
        </View>

        {formData.paymentMethod === 'credit_card' && (
          <>
            <TextInput
              style={[styles.input, errors.cardNumber && styles.inputError]}
              placeholder="Card Number"
              value={formData.cardNumber}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, cardNumber: text }));
                setErrors(prev => ({ ...prev, cardNumber: '' }));
              }}
              keyboardType="numeric"
              maxLength={19}
            />
            {errors.cardNumber ? <Text style={styles.errorText}>{errors.cardNumber}</Text> : null}

            <View style={styles.cardDetailsContainer}>
              <View style={styles.cardDetailInput}>
                <TextInput
                  style={[styles.input, errors.expiryDate && styles.inputError]}
                  placeholder="MM/YY"
                  value={formData.expiryDate}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, expiryDate: text }));
                    setErrors(prev => ({ ...prev, expiryDate: '' }));
                  }}
                  keyboardType="numeric"
                  maxLength={5}
                />
                {errors.expiryDate ? <Text style={styles.errorText}>{errors.expiryDate}</Text> : null}
              </View>

              <View style={styles.cardDetailInput}>
                <TextInput
                  style={[styles.input, errors.cvv && styles.inputError]}
                  placeholder="CVV"
                  value={formData.cvv}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, cvv: text }));
                    setErrors(prev => ({ ...prev, cvv: '' }));
                  }}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
                {errors.cvv ? <Text style={styles.errorText}>{errors.cvv}</Text> : null}
              </View>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Processing...' : 'Upgrade Account'}
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
  paymentMethodContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  paymentMethod: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  paymentMethodSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  paymentMethodText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  cardDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardDetailInput: {
    width: '48%',
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