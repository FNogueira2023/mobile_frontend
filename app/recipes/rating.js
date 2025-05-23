import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { HOST_URL } from '../config/config';
import { colors } from '../theme/colors';

export default function RatingScreen() {
  const { id } = useLocalSearchParams();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingRatings, setExistingRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatings();
  }, [id]);

  const loadRatings = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Cargar calificaciones existentes
      const ratingsResponse = await fetch(`${HOST_URL}/api/recipes/${id}/ratings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (ratingsResponse.ok) {
        const data = await ratingsResponse.json();
        if (data.success) {
          setExistingRatings(data.ratings);
        }
      }

      // Cargar calificación promedio
      const averageResponse = await fetch(`${HOST_URL}/api/recipes/${id}/ratings/average`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (averageResponse.ok) {
        const data = await averageResponse.json();
        console.log('Average rating data:', data);
        if (data.averageRating) {
          setAverageRating(parseFloat(data.averageRating));
        }
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Error', 'Por favor escribe un comentario');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Error', 'El comentario debe tener al menos 10 caracteres');
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      console.log('Submitting rating for recipe:', id);
      console.log('Rating value:', rating);
      console.log('Comment length:', comment.trim().length);

      const response = await fetch(`${HOST_URL}/api/recipes/${id}/ratings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ratingValue: rating,
          commentText: comment.trim()
        })
      });

      console.log('Rating submission response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response data:', errorData);
        throw new Error(errorData?.message || 'Error al enviar la calificación');
      }

      const responseData = await response.json();
      console.log('Rating submission success:', responseData);

      // Recargar las calificaciones y el promedio antes de mostrar el mensaje de éxito
      await loadRatings();

      Alert.alert(
        'Éxito',
        '¡Gracias por tu calificación!',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error completo al enviar calificación:', error);
      Alert.alert(
        'Error',
        'No se pudo enviar la calificación. Por favor, intenta nuevamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (value) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= value ? "star" : "star-outline"}
            size={20}
            color={star <= value ? colors.primary : colors.textSecondary}
          />
        ))}
      </View>
    );
  };

  const renderRatingItem = (rating) => (
    <View key={rating.ratingId} style={styles.ratingItem}>
      <View style={styles.ratingHeader}>
        <Text style={styles.userName}>@{rating.userNickname}</Text>
        {renderStars(rating.rating)}
      </View>
      <Text style={styles.ratingComment}>{rating.comment}</Text>
      <Text style={styles.ratingDate}>
        {new Date(rating.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.averageRatingContainer}>
            <Text style={styles.averageRatingTitle}>Calificación promedio</Text>
            {renderStars(Math.round(averageRating))}
            {/* <Text style={styles.averageRatingValue}>
              {averageRating > 0 ? averageRating.toFixed(1) : 'Sin calificaciones'} / 5
            </Text>
            <Text style={styles.ratingCount}>
              {existingRatings.length} {existingRatings.length === 1 ? 'calificación' : 'calificaciones'}
            </Text> */}
          </View>

          <View style={styles.divider} />

          <Text style={styles.title}>Tu calificación</Text>
          
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={32}
                  color={star <= rating ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Tu comentario</Text>
          <TextInput
            style={styles.input}
            multiline
            numberOfLines={4}
            placeholder="Cuéntanos qué te pareció la receta..."
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>
            {comment.length}/500 caracteres
          </Text>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Enviando...' : 'Enviar calificación'}
            </Text>
          </TouchableOpacity>

          {existingRatings.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Comentarios anteriores</Text>
              {existingRatings.map(renderRatingItem)}
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/')}
        >
          <Ionicons name="home" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/recipes/search-recipes')}
        >
          <Ionicons name="search" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Buscar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/recipes/favorites')}
        >
          <Ionicons name="heart-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Guardados</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="school" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Cursos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/user')}
        >
          <Ionicons name="person" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Usuario</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  averageRatingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  averageRatingTitle: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 8,
  },
  averageRatingValue: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  starButton: {
    padding: 5,
  },
  label: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  ratingItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  ratingComment: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  ratingDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  navText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ratingCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: -15,
    marginBottom: 20,
  },
}); 