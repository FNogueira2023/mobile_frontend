import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { HOST_URL } from '../config/config';
import { colors } from '../theme/colors';

export default function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        console.log('No hay token de autenticación');
        router.replace('/auth/login');
        return;
      }

      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        console.log('No hay datos de usuario en AsyncStorage');
        router.replace('/auth/login');
        return;
      }

      const userData = JSON.parse(userDataString);
      console.log('Datos de usuario encontrados:', userData);

      const url = `${HOST_URL}/api/users/${userData.userId}?exclude=followers&favorites_table=user_favorites`;
      console.log('Realizando petición a:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error en la respuesta del servidor:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          url: url
        });
        if (response.status === 401 || response.status === 404) {
          router.replace('/auth/login');
          return;
        }
        throw new Error(`Error al cargar el perfil: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      if (data.success) {
        console.log('Datos de usuario actualizados:', data.user);
        setUserData(data.user);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      } else {
        console.log('Error en la respuesta del servidor:', data);
        throw new Error(data.message || 'Error al cargar el perfil');
      }
    } catch (error) {
      console.error('Error loading user data:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      Alert.alert('Error', 'No se pudo cargar la información del usuario');
      if (error.message.includes('401') || error.message.includes('404')) {
        router.replace('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'No se pudo cerrar la sesión');
    }
  };

  const handleUpdateProfile = () => {
    router.push('/user/update-profile');
  };

  const handleBecomeStudent = () => {
    router.push('/auth/upgrade-to-student');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Sección Superior - Información del Usuario */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: userData?.profileImage || 'https://via.placeholder.com/100' }}
            style={styles.profileImage}
          />
        </View>
        <Text style={styles.nickname}>@{userData?.nickname || 'Usuario'}</Text>
        <Text style={styles.fullName}>{userData?.fullName || 'Nombre Completo'}</Text>
      </View>

      {/* Sección de Datos */}
      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={24} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Correo electrónico</Text>
            <Text style={styles.infoValue}>{userData?.email || 'email@ejemplo.com'}</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="person-outline" size={24} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Tipo de cuenta</Text>
            <Text style={styles.infoValue}>{userData?.userType === 'student' ? 'Alumno' : 'Usuario normal'}</Text>
          </View>
        </View>
      </View>

      {/* Botones Principales */}
      <View style={styles.mainActionsContainer}>
        <TouchableOpacity 
          style={styles.mainActionButton}
          onPress={() => router.push('/recipes/my-recipes')}
        >
          <Ionicons name="book-outline" size={32} color={colors.primary} />
          <Text style={styles.mainActionText}>Mis recetas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.mainActionButton}
          onPress={() => router.push('/recipes/favorites')}
        >
          <Ionicons name="heart-outline" size={32} color={colors.primary} />
          <Text style={styles.mainActionText}>Mis favoritos</Text>
        </TouchableOpacity>

        {userData?.userType !== 'student' && (
          <TouchableOpacity 
            style={styles.mainActionButton}
            onPress={() => router.push('/auth/upgrade-to-student')}
          >
            <Ionicons name="school-outline" size={32} color={colors.primary} />
            <Text style={styles.mainActionText}>Convertirse en alumno</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Botones Secundarios */}
      <View style={styles.secondaryActionsContainer}>
        <TouchableOpacity 
          style={styles.secondaryActionButton}
          onPress={handleUpdateProfile}
        >
          <Ionicons name="create-outline" size={24} color={colors.white} />
          <Text style={styles.secondaryActionText}>Actualizar datos</Text>
        </TouchableOpacity>
      </View>

      {/* Botón de Cerrar Sesión */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color={colors.error} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  nickname: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  fullName: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  infoSection: {
    backgroundColor: colors.white,
    padding: 20,
    marginTop: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoTextContainer: {
    marginLeft: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    marginTop: 2,
  },
  mainActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    backgroundColor: colors.white,
    marginTop: 10,
  },
  mainActionButton: {
    width: '50%',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainActionText: {
    marginTop: 8,
    color: colors.text,
    fontSize: 14,
  },
  secondaryActionsContainer: {
    padding: 20,
    backgroundColor: colors.white,
    marginTop: 10,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  secondaryActionText: {
    color: colors.white,
    fontSize: 16,
    marginLeft: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    marginLeft: 10,
  },
}); 