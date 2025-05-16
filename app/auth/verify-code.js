import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { HOST_URL } from '../config/config';

export default function VerifyCode() {
  const { email } = useLocalSearchParams();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleVerifyAndReset = async () => {
    if (!code) {
      setCodeError('Por favor ingrese el código de verificación');
      return;
    }

    if (!validatePassword(newPassword)) {
      setPasswordError(
        'La contraseña debe tener al menos 8 caracteres y contener al menos una letra mayúscula, una minúscula y un número'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    if (timeLeft <= 0) {
      Alert.alert(
        'Código expirado',	
        'Tu código de verificación ha expirado. Por favor solicita uno nuevo.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/forgot-password'),
          },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${HOST_URL}/api/users/reset-password/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          resetCode: code,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(          
          'Tu contraseña ha sido cambiada exitosamente.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/auth/login'),
            },
          ]
        );
      } else {
        if (data.code === 'EXPIRED') {
          Alert.alert(
            'Código expirado',
            'Tu código ha expirado.Por favor solicitar uno nuevo.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/auth/forgot-password'),
              },
            ]
          );
        } else if (data.code === 'INVALID') {
          setCodeError('Código inválido');
        } else {
          Alert.alert('Error', data.message || 'Algo salió mal');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${HOST_URL}/api/users/reset-password/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Código reenviado',
          'Un nuevo código de verificación ha sido enviado a tu correo electrónico.',
          [
            {
              text: 'OK',
              onPress: () => {
                setTimeLeft(30 * 60);
                setCode('');
                setCodeError('');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Error al reenviar el código');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión. Por favor, inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificar Código</Text>
      <Text style={styles.subtitle}>
        Ingrese el código de verificación enviado a {email}. Asegúrese de que su bandeja de entrada no esté llena y revise la carpeta de spam.
      </Text>

      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          Código expira en: {formatTime(timeLeft)}
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, codeError && styles.inputError]}
          placeholder="Código de verificación"
          value={code}
          onChangeText={(text) => {
            setCode(text);
            setCodeError('');
          }}         
        />
        {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, passwordError && styles.inputError]}
          placeholder="Nueva Contraseña"
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            setPasswordError('');
          }}
          secureTextEntry
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, passwordError && styles.inputError]}
          placeholder="Confirmar Contraseña"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setPasswordError('');
          }}
          secureTextEntry
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerifyAndReset}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Verificando...' : 'Resetear Contraseña'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResendCode}
        disabled={loading}
      >
        <Text style={styles.resendButtonText}>Reenviar Código</Text>
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
    lineHeight: 22,
  },
  timerContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
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
  resendButton: {
    marginTop: 15,
    padding: 15,
    alignItems: 'center',
  },
  resendButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
}); 