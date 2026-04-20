import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/colors';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { nicheAPI, subscriptionAPI } from '../services/api';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { user, logout, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [editing, setEditing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const isExpoGo =
    Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
  const iosExternalCheckoutEnabled =
    Platform.OS === 'ios' && process.env.EXPO_PUBLIC_ENABLE_IOS_EXTERNAL_CHECKOUT === 'true';

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user?.name, user?.email]);

  const { data: subscription } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const { data } = await subscriptionAPI.status();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (!url.startsWith('traineros://subscription')) {
        return;
      }

      if (url.includes('payment=success')) {
        queryClient.invalidateQueries({ queryKey: ['subscription-status'] }).catch(() => undefined);
        Alert.alert('Success', 'Subscription payment completed. Your plan is updating now.');
        return;
      }

      if (url.includes('payment=cancelled')) {
        Alert.alert('Checkout cancelled', 'The subscription checkout was cancelled.');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [queryClient]);

  const updateMutation = useMutation({
    mutationFn: async () => updateProfile({ name, email }),
    onSuccess: () => {
      Alert.alert('Saved', 'Profile updated successfully.');
      setEditing(false);
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to update profile');
    },
  });

  const resetNicheMutation = useMutation({
    mutationFn: async () => {
      const { data } = await nicheAPI.reset();
      return data;
    },
    onSuccess: () => {
      Alert.alert('Succes', 'Nișa a fost resetată cu succes! Poți seta o nișă nouă.');
    },
    onError: (error: any) => {
      Alert.alert('Eroare', error?.response?.data?.error || 'A apărut o eroare la resetare.');
    },
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleSubscription = async () => {
    if (Platform.OS === 'ios') {
      const shouldUseWebCheckout = isExpoGo || iosExternalCheckoutEnabled;

      if (shouldUseWebCheckout) {
        await handleApplePayCheckout();
        return;
      }

      Alert.alert(
        'Unavailable in this build',
        'Use a development build or App Store build to preview native in-app purchases.'
      );
      return;
    }

    await handleApplePayCheckout();
  };

  const handleApplePayCheckout = async () => {
    try {
      setCheckoutLoading(true);

      const successUrl = 'traineros://subscription?payment=success';
      const cancelUrl = 'traineros://subscription?payment=cancelled';
      const { data } = await subscriptionAPI.createCheckoutSession({
        billingCycle: 'monthly',
        plan: 'PRO',
        successUrl,
        cancelUrl,
      });

      const checkoutUrl = data?.url as string | undefined;
      if (!checkoutUrl) {
        throw new Error('Checkout URL was not returned by the server.');
      }

      const canOpen = await Linking.canOpenURL(checkoutUrl);
      if (!canOpen) {
        throw new Error('Cannot open Stripe Checkout.');
      }

      await Linking.openURL(checkoutUrl);
    } catch (error: any) {
      Alert.alert(
        'Checkout failed',
        error?.response?.data?.error ||
          error?.message ||
          'Could not start the subscription checkout.'
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSaveProfile = () => {
    if (!email.trim()) {
      Alert.alert('Validation', 'Email is required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Validation', 'Invalid email format.');
      return;
    }
    updateMutation.mutate();
  };

  const handleResetNiche = () => {
    Alert.alert(
      'Reset Niche',
      'Ești sigur că vrei să resetezi nișa? Toate setările de nișă și Niche Builder vor fi șterse.',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Resetează',
          style: 'destructive',
          onPress: () => resetNicheMutation.mutate(),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
      </View>

      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </Card>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => setEditing((v) => !v)}>
          <Text style={styles.menuText}>Edit Profile</Text>
          <Text style={styles.menuIcon}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleSubscription}>
          <Text style={styles.menuText}>Subscription</Text>
          <Text style={styles.menuIcon}>›</Text>
        </TouchableOpacity>
      </View>

      {editing && (
        <Card style={styles.editCard}>
          <Text style={styles.editTitle}>Edit Profile</Text>
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="your@email.com"
          />
          <Button
            title="Save Profile"
            onPress={handleSaveProfile}
            loading={updateMutation.isPending}
          />
        </Card>
      )}

      <Card style={styles.planCard}>
        <Text style={styles.planTitle}>Current Plan</Text>
        <Text style={styles.planValue}>{subscription?.plan || 'FREE_TRIAL'}</Text>
        {Platform.OS === 'ios' && isExpoGo ? (
          <Text style={styles.planHint}>
            Expo Go preview uses the hosted checkout flow instead of native App Store purchases.
          </Text>
        ) : null}
        {checkoutLoading ? (
          <Text style={styles.planHint}>Opening Stripe Checkout...</Text>
        ) : null}
      </Card>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ContentPreferences')}
        >
          <Text style={styles.menuText}>Content Preferences</Text>
          <Text style={styles.menuIcon}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ContentCreationPreferences')}
        >
          <Text style={styles.menuText}>Content Creation Preferences</Text>
          <Text style={styles.menuIcon}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Chat')}
        >
          <Text style={styles.menuText}>TrainerOS Chat</Text>
          <Text style={styles.menuIcon}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('EmailMarketing')}
        >
          <Text style={styles.menuText}>Email Marketing AI</Text>
          <Text style={styles.menuIcon}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ClientNutrition')}
        >
          <Text style={styles.menuText}>Generare Nutriție Client</Text>
          <Text style={styles.menuIcon}>›</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.resetCard}>
        <Text style={styles.resetTitle}>Reset Niche</Text>
        <Text style={styles.resetText}>
          Șterge nișa curentă și Niche Builder. Vei putea să le setezi din nou folosind Niche Finder.
        </Text>
        <Button
          title={resetNicheMutation.isPending ? 'Se resetează...' : 'Reset Niche'}
          onPress={handleResetNiche}
          variant="outline"
          disabled={resetNicheMutation.isPending}
          style={styles.resetButton}
          textStyle={styles.resetButtonText}
        />
      </Card>

      <Button
        title="Logout"
        onPress={handleLogout}
        variant="outline"
        style={styles.logoutButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bg,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: colors.text.primary,
  },
  profileCard: {
    alignItems: 'center' as const,
    padding: 24,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: colors.text.primary,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  editCard: {
    marginBottom: 24,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text.primary,
    marginBottom: 12,
  },
  planCard: {
    marginBottom: 24,
  },
  planTitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  planValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.brand.primary,
  },
  planHint: {
    marginTop: 8,
    fontSize: 13,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.secondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center' as const,
    backgroundColor: colors.dark.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  menuText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  menuIcon: {
    fontSize: 24,
    color: colors.text.secondary,
  },
  logoutButton: {
    marginTop: 16,
  },
  resetCard: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f59e0b66',
  },
  resetTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#f59e0b',
    marginBottom: 8,
  },
  resetText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  resetButton: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  resetButtonText: {
    color: '#f59e0b',
  },
});
