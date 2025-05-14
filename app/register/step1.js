import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';

export default function Step1() {
  const [email, setEmail] = useState('');
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [aliasError, setAliasError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isCheckingAlias, setIsCheckingAlias] = useState(false);

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
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  }, [email]);

  // Real-time alias validation and suggestions
  const checkAlias = async (value) => {
    if (!value) {
      setAliasError('');
      setSuggestions([]);
      return;
    }

    if (value.length < 3) {
      setAliasError('Alias must be at least 3 characters');
      setSuggestions([]);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setAliasError('Alias can only contain letters, numbers, and underscores');
      setSuggestions([]);
      return;
    }

    setIsCheckingAlias(true);
    try {
      const response = await fetch('http://your-backend-url/api/check-alias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alias: value }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.available) {
          setAliasError('');
          setSuggestions([]);
        } else {
          setAliasError('This alias is already taken');
          setSuggestions(data.suggestions || []);
        }
      } else {
        setAliasError('Error checking alias availability');
      }
    } catch (error) {
      setAliasError('Network error. Please try again.');
    } finally {
      setIsCheckingAlias(false);
    }
  };

  // Debounced alias check
  const debouncedCheckAlias = debounce(checkAlias, 500);

  useEffect(() => {
    debouncedCheckAlias(alias);
  }, [alias]);

  const handleNext = async () => {
    if (emailError || aliasError || !email || !alias) {
      Alert.alert('Error', 'Please fix the errors before continuing');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://your-backend-url/api/validate-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, alias }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push({
          pathname: '/register/step2',
          params: { email, alias }
        });
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setAlias(suggestion);
  };

  const isFormValid = !emailError && !aliasError && email && alias;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Step 1: Enter your email and choose an alias</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, emailError && styles.inputError]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.aliasContainer}>
          <TextInput
            style={[styles.input, aliasError && styles.inputError]}
            placeholder="Alias"
            value={alias}
            onChangeText={setAlias}
            autoCapitalize="none"
          />
          {isCheckingAlias && (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          )}
        </View>
        {aliasError ? <Text style={styles.errorText}>{aliasError}</Text> : null}
        
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Available aliases:</Text>
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
          {loading ? 'Validating...' : 'Next'}
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
  aliasContainer: {
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