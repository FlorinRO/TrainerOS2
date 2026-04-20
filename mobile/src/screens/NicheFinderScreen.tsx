import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/colors';
import Card from '../components/Card';
import Button from '../components/Button';

export default function NicheFinderScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Niche Finder + Niche Builder</Text>
        <Text style={styles.title}>Fără nișă clară, postezi degeaba.</Text>
        <Text style={styles.subtitle}>
          Află exact cui te adresezi, ce problemă rezolvi și cum te poziționezi — în mai puțin
          de 5 minute.
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('NicheQuick')}
      >
        <Card style={styles.modeCard}>
          <Text style={styles.modeEmoji}>⚡</Text>
          <Text style={styles.cardTitle}>"Știu deja nișa mea"</Text>
          <Text style={styles.cardDescription}>
            Răspunde la 10 întrebări despre clientul tău ideal — AI-ul va crea Niche Builder-ul
            detaliat și nișa ta.
          </Text>
          <View style={styles.featuresBox}>
            <Text style={styles.featureText}>✓ Demografic (gen, vârstă)</Text>
            <Text style={styles.featureText}>✓ Rutina zilnică completă</Text>
            <Text style={styles.featureText}>✓ Module condiționale personalizate</Text>
            <Text style={styles.featureText}>✓ Niche Builder ultra-detaliat generat de AI</Text>
          </View>
          <Button
            title="Spune-mi Nișa Ta →"
            onPress={() => navigation.navigate('NicheQuick')}
          />
        </Card>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('NicheDiscover')}
      >
        <Card style={styles.modeCard}>
          <Text style={styles.modeEmoji}>🔍</Text>
          <Text style={styles.cardTitle}>"Descoperă Nișa Ta"</Text>
          <Text style={styles.cardDescription}>
            Ghid complet în 3 faze: AI-ul propune 3 variante de nișă, tu alegi una, apoi
            rafinăm împreună pentru rezultate maxime.
          </Text>
          <View style={styles.featuresBox}>
            <Text style={styles.featureText}>✓ Faza A: 6 întrebări despre experiența ta</Text>
            <Text style={styles.featureText}>✓ Faza B: AI propune 3 variante de nișă</Text>
            <Text style={styles.featureText}>✓ Faza C: Rafinare cu 5 întrebări detaliate</Text>
            <Text style={styles.featureText}>✓ Nișă + Niche Builder personalizat final</Text>
          </View>
          <Button
            title="Află Nișa Ta →"
            onPress={() => navigation.navigate('NicheDiscover')}
            variant="outline"
          />
        </Card>
      </TouchableOpacity>
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
  kicker: {
    fontSize: 12,
    color: colors.brand.primary,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: colors.text.primary,
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresBox: {
    backgroundColor: colors.dark.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: colors.text.muted,
    lineHeight: 18,
  },
  modeCard: {
    marginBottom: 16,
  },
  modeEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
});
