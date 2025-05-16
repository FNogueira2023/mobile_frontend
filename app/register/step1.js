import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { HOST_URL } from '../config/config';
import { colors } from '../theme/colors';

export default function Step1() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

  // Debounce function to limit API calls
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Real-time email validation
  useEffect(() => {
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Ingrese una dirección de correo electrónico válida');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  }, [email]);

  // Nickname validation and suggestions
  const checkNickname = async (value) => {
    if (!value) {
      setNicknameError('');
      setSuggestions([]);
      return;
    }

    if (value.length < 3) {
      setNicknameError('El nickname debe tener al menos 3 caracteres');
      setSuggestions([]);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setNicknameError('El nickname solo puede contener letras, números y guiones bajos');
      setSuggestions([]);
      return;
    }

    setIsCheckingNickname(true);
    try {
      const response = await fetch(`${HOST_URL}/api/users/check-nickname`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: value }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.available) {
          setNicknameError('');
          setSuggestions([]);
        } else {
          setNicknameError('El nickname ya está en uso');
          setSuggestions(data.suggestions || []);
        }
      } else {
        setNicknameError('Error al verificar el nickname');
      }
    } catch (error) {
      console.error('Error checking nickname:', error);
      setNicknameError('Error de conexión.');
    } finally {
      setIsCheckingNickname(false);
    }
  };

  // Simple debounce implementation without useCallback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nickname) {
        checkNickname(nickname);
      } else {
        setNicknameError('');
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [nickname]);

  const handleNext = async () => {
    if (emailError || nicknameError || !email || !nickname) {
      Alert.alert('Error', 'Por favor, complete todos los campos correctamente');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${HOST_URL}/api/users/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, nickname }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push({
          pathname: '/register/step2',
          params: { email, nickname }
        });
      } else {
        Alert.alert('Error', data.message || 'Algo salió mal');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión. Por favor, inténtelo de nuevo.');
      console.log('Error validating email and nickname:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setNickname(suggestion);
  };

  const isFormValid = !emailError && !nicknameError && email && nickname;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>
      <Text style={styles.subtitle}>Paso 1: Ingrese una dirección	de correo y elija un nickname</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, emailError && styles.inputError]}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.nicknameContainer}>
          <TextInput
            style={[styles.input, nicknameError && styles.inputError]}
            placeholder="Nickname"
            value={nickname}
            onChangeText={setNickname}
            autoCapitalize="none"
          />
          {isCheckingNickname && (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          )}
        </View>
        {nicknameError ? <Text style={styles.errorText}>{nicknameError}</Text> : null}
        
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Available nicknames:</Text>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.button, (!isFormValid || loading) && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!isFormValid || loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Validando...' : 'Siguiente'}
        </Text>
      </TouchableOpacity>
    </View>
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
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.inputBackground,
    padding: 15,
    borderRadius: 10,
    color: colors.text,
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
  nicknameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loader: {
    position: 'absolute',
    right: 15,
  },
  suggestionsContainer: {
    marginTop: 10,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    padding: 10,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  suggestionItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBackground,
  },
  suggestionText: {
    color: colors.primary,
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
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