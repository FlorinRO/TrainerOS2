import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/colors';
import Button from '../components/Button';
import ScreenShell from '../components/ScreenShell';
import { statsAPI } from '../services/api';

const logoSource = require('../../assets/icon-from-frontend.png');

interface ToolCardProps {
  title: string;
  description: string;
  emoji: string;
  onPress: () => void;
  ctaLabel: string;
  meta?: string;
  accent?: 'default' | 'mint' | 'cyan' | 'blue' | 'green';
}

function ToolCard({
  title,
  description,
  emoji,
  onPress,
  ctaLabel,
  meta,
  accent = 'default',
}: ToolCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolCard,
        accent === 'mint' && styles.toolCardMint,
        accent === 'cyan' && styles.toolCardCyan,
        accent === 'blue' && styles.toolCardBlue,
        accent === 'green' && styles.toolCardGreen,
        pressed && styles.toolCardPressed,
      ]}
    >
      <View style={styles.toolCardHeader}>
        <View style={styles.iconWrap}>
          <Text style={styles.cardEmoji}>{emoji}</Text>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardDescription}>{description}</Text>
      {meta ? <Text style={styles.cardMeta}>{meta}</Text> : null}
      <Button title={ctaLabel} onPress={onPress} style={styles.cardButton} />
    </Pressable>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await statsAPI.dashboard();
      return data;
    },
    enabled: !!user,
  });

  const profile = dashboardData?.profile;
  const stats = dashboardData?.stats;
  const hasNicheSetup = !!profile?.niche;
  const hasContentPreferences = !!profile?.hasContentPreferences;
  const hasContentCreationPreferences = !!profile?.hasContentCreationPreferences;

  if (isLoading) {
    return (
      <ScreenShell contentStyle={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScrollView
        style={styles.container}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        automaticallyAdjustKeyboardInsets={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: 0,
            paddingBottom: tabBarHeight + 48,
          },
        ]}
      >
        <View style={[styles.headerCard, { marginTop: -insets.top }]}>
          <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
            <View style={styles.topBarBrand}>
              <View style={styles.topBarLogoGlow}>
                <Image source={logoSource} style={styles.topBarLogo} resizeMode="cover" />
              </View>
              <Text style={styles.topBarTitle}>TrainerOS</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('Settings' as never)}
              style={({ pressed }) => [styles.topBarButton, pressed && styles.topBarButtonPressed]}
            >
              <Text style={styles.topBarButtonText}>Setări</Text>
            </Pressable>
          </View>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerBadgeText}>Workspace Overview</Text>
              <Text style={styles.welcomeText}>Bine ai venit, {user?.name || 'Antrenor'}</Text>
              <Text style={styles.subtitle}>
                {profile?.niche
                  ? 'Toate uneltele tale sunt pregătite pentru un workflow clar și rapid.'
                  : 'Organizează fluxul tău zilnic de content ca un sistem premium.'}
              </Text>
            </View>
          </View>
          {profile?.niche ? (
            <View style={styles.nicheChip}>
              <Text style={styles.nicheLabel}>Nișa ta</Text>
              <View style={styles.nicheRow}>
                <Text style={styles.nicheValue}>{profile.niche}</Text>
                <Pressable
                  onPress={() => navigation.navigate('NicheFinder' as never)}
                  style={({ pressed }) => [
                    styles.nicheEditButton,
                    pressed && styles.nicheEditButtonPressed,
                  ]}
                >
                  <Text style={styles.nicheEditText}>Editează</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statKicker}>Idei generate</Text>
            <Text style={styles.statValue}>{stats?.totalIdeas || 0}</Text>
            <Text style={styles.statMeta}>{`${stats?.ideasThisMonth || 0} luna aceasta`}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statKicker}>Content analizat</Text>
            <Text style={styles.statValue}>{stats?.totalFeedbacks || 0}</Text>
            <Text style={styles.statMeta}>{`${stats?.feedbacksThisMonth || 0} luna aceasta`}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statKicker}>Streak zilnic</Text>
            <Text style={styles.statValue}>{`${stats?.streak || 0} 🔥`}</Text>
            <Text style={styles.statMeta}>zile consecutive active</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Workflow</Text>
          <ToolCard
            title="Daily Idea"
            description="Generează ideea zilnică de content."
            emoji="💡"
            meta={
              stats?.ideasThisWeek && stats.ideasThisWeek > 0
                ? `${stats.ideasThisWeek} generate săptămâna aceasta`
                : undefined
            }
            ctaLabel="Deschide Daily Idea"
            onPress={() => navigation.navigate('DailyIdea' as never)}
            accent="mint"
          />
          <ToolCard
            title="Content Review"
            description="Analizează postările tale."
            emoji="📊"
            meta={
              stats?.avgOverallScore && stats.avgOverallScore > 0
                ? `Scor mediu: ${stats.avgOverallScore}/100`
                : undefined
            }
            ctaLabel="Deschide Content Review"
            onPress={() => navigation.navigate('ContentReview' as never)}
          />
          <ToolCard
            title="Structurează Ideea"
            description="Pui ideea brută, iar AI-ul o transformă în Hook → Script → CTA."
            emoji="🧠"
            meta="Nou"
            ctaLabel="Deschide Structurer"
            onPress={() => navigation.navigate('IdeaStructurer' as never)}
            accent="blue"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strategie</Text>
          <ToolCard
            title="Niche Finder"
            description="Clarifică-ți nișa și, opțional, clientul ideal."
            emoji="🎯"
            meta={hasNicheSetup ? '✓ Profil completat' : '⚠️ Profil nesetat'}
            ctaLabel="Deschide Niche Finder"
            onPress={() => navigation.navigate('NicheFinder' as never)}
            accent="cyan"
          />
          <ToolCard
            title="Brand Voice"
            description="Setează tonul tău, stilul și CTA-ul pe care le folosești constant."
            emoji="🗣️"
            meta={hasContentPreferences ? '✓ Brand Voice setat' : '⚠️ Brand Voice nesetat'}
            ctaLabel="Deschide Brand Voice"
            onPress={() => navigation.navigate('ContentPreferences' as never)}
          />
          <ToolCard
            title="Cum vrei să creezi content?"
            description="Setează stilul tău de filmare și formatul natural de livrare."
            emoji="🎬"
            meta={
              hasContentCreationPreferences
                ? '✓ Preferințe de creare setate'
                : '⚠️ Preferințe nesetate'
            }
            ctaLabel="Deschide Preferințele"
            onPress={() => navigation.navigate('ContentCreationPreferences' as never)}
            accent="cyan"
          />
          <ToolCard
            title="Spune-mi Nișa Ta"
            description="Răspunde rapid la întrebări și salvează context util direct în profil."
            emoji="🧭"
            ctaLabel="Deschide Niche Quick"
            onPress={() => navigation.navigate('NicheQuick' as never)}
          />
          <ToolCard
            title="Descoperă Nișa Ta"
            description="Parcurgi ghidul complet în 3 faze pentru a rafina nișa împreună cu AI-ul."
            emoji="🔎"
            ctaLabel="Deschide Niche Discover"
            onPress={() => navigation.navigate('NicheDiscover' as never)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comunicare & Livrare</Text>
          <ToolCard
            title="TrainerOS Chat"
            description="Expertul tău de marketing pentru antrenori. Primești răspunsuri și strategie pentru content, ofertă și marketing."
            emoji="🤖"
            onPress={() => navigation.navigate('Chat' as never)}
            ctaLabel="Deschide Chat"
            meta="Live Streaming"
          />
          <ToolCard
            title="Email Marketing AI"
            description="Generezi emailuri de nurture și sales pe baza contextului tău global (nișă, ICP, poziționare și ofertă)."
            emoji="📧"
            onPress={() => navigation.navigate('EmailMarketing' as never)}
            ctaLabel="Deschide Email AI"
            meta="Nou"
            accent="blue"
          />
          <ToolCard
            title="Generare Nutriție Client"
            description="Creează planuri nutriționale personalizate pe baza macro-urilor, programului și restricțiilor clientului."
            emoji="🥗"
            onPress={() => navigation.navigate('ClientNutrition' as never)}
            ctaLabel="Deschide Nutriție"
            meta="Nou"
            accent="green"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          <ToolCard
            title="Istoric Idei"
            description="Revizuiește toate ideile generate anterior."
            emoji="📚"
            ctaLabel="Vezi Istoric Idei"
            onPress={() => navigation.navigate('IdeaHistory' as never)}
          />
          <ToolCard
            title="Review History"
            description="Accesează feedback-ul din analizele video anterioare."
            emoji="📝"
            ctaLabel="Vezi Review History"
            onPress={() => navigation.navigate('FeedbackHistory' as never)}
          />
          <ToolCard
            title="Setări"
            description="Gestionează contul și preferințele aplicației."
            emoji="⚙️"
            ctaLabel="Deschide Setările"
            onPress={() => navigation.navigate('Settings' as never)}
          />
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  content: {
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
    marginBottom: 14,
    paddingTop: 0,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  topBarBrand: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    flex: 1,
  },
  topBarLogoGlow: {
    borderRadius: 12,
    shadowColor: 'rgba(114, 202, 255, 0.28)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  topBarLogo: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(114, 202, 255, 0.22)',
  },
  topBarTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  topBarButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  topBarButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(114, 202, 255, 0.24)',
  },
  topBarButtonText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  headerCard: {
    marginTop: 0,
    marginBottom: 16,
    borderRadius: 34,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 24,
    backgroundColor: colors.dark.panelStrong,
    borderWidth: 1,
    borderColor: colors.dark.borderStrong,
    shadowColor: colors.brand.secondary,
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 8,
  },
  headerBadgeText: {
    color: colors.brand.primary,
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
  headerTopRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
  },
  headerTextWrap: {
    flex: 1,
  },
  welcomeText: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 6,
    letterSpacing: -0.8,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  nicheChip: {
    marginTop: 16,
    alignSelf: 'stretch' as const,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(114, 202, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  nicheLabel: {
    color: colors.text.muted,
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.3,
    marginBottom: 4,
  },
  nicheValue: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
    flexShrink: 1,
  },
  nicheRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  nicheEditButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  nicheEditButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(114, 202, 255, 0.28)',
  },
  nicheEditText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '31%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 16,
  },
  statKicker: {
    color: colors.brand.primary,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
  statValue: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '700' as const,
  },
  statMeta: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginBottom: 14,
  },
  toolCard: {
    backgroundColor: colors.dark.panelStrong,
    borderWidth: 1,
    borderColor: colors.dark.borderStrong,
    borderRadius: 24,
    padding: 24,
    marginBottom: 12,
    shadowColor: colors.brand.secondary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 26,
    elevation: 7,
  },
  toolCardMint: {
    borderColor: 'rgba(134, 239, 172, 0.18)',
  },
  toolCardCyan: {
    borderColor: 'rgba(114, 202, 255, 0.24)',
  },
  toolCardBlue: {
    borderColor: 'rgba(96, 165, 250, 0.24)',
  },
  toolCardGreen: {
    borderColor: 'rgba(74, 222, 128, 0.24)',
  },
  toolCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(140, 248, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(114, 202, 255, 0.24)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  cardEmoji: {
    fontSize: 20,
  },
  toolCardPressed: {
    transform: [{ translateY: -2 }],
    shadowOpacity: 0.2,
    borderColor: colors.dark.borderStrong,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text.primary,
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.brand.primary,
    marginTop: 10,
    fontWeight: '600' as const,
  },
  cardButton: {
    marginTop: 16,
    borderRadius: 12,
  },
});
