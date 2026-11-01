import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabScreenProps } from '../navigation/types';

interface ProjectItem {
  id: string;
  title: string;
  category: string;
  status: 'In Progress' | 'Completed' | 'Review';
  progress: number;
}

const MOCK_PROJECTS: ProjectItem[] = [
  { id: '1', title: 'Authentication Service Refactor', category: 'Security', status: 'Completed', progress: 100 },
  { id: '2', title: 'Payment Gateway Integration', category: 'Backend', status: 'In Progress', progress: 65 },
  { id: '3', title: 'Push Notification Dispatcher', category: 'Mobile', status: 'Review', progress: 90 },
  { id: '4', title: 'Real-time WebSocket Feed', category: 'Infrastructure', status: 'In Progress', progress: 40 },
  { id: '5', title: 'Analytics & Crash Telemetry', category: 'Monitoring', status: 'In Progress', progress: 25 },
];

export default function ExploreScreen({ navigation }: MainTabScreenProps<'ExploreTab'>) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'In Progress' | 'Completed'>('All');

  const filteredProjects = MOCK_PROJECTS.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' ? true : p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.mainContainer}>
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 16) }]}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Explore Modules</Text>
            <Text style={styles.subtitle}>Browse active projects and template modules</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search components, modules..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {(['All', 'In Progress', 'Completed'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, filter === tab && styles.filterPillActive]}
                onPress={() => setFilter(tab)}
              >
                <Text style={[styles.filterPillText, filter === tab && styles.filterPillTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Project List */}
          <View style={styles.listContainer}>
            {filteredProjects.map((project) => (
              <View key={project.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardCategory}>{project.category.toUpperCase()}</Text>
                  <View style={[
                    styles.statusBadge, 
                    project.status === 'Completed' ? styles.statusCompleted : styles.statusProgress
                  ]}>
                    <Text style={[
                      styles.statusText,
                      project.status === 'Completed' ? styles.statusTextCompleted : styles.statusTextProgress
                    ]}>{project.status}</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{project.title}</Text>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{project.progress}%</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    letterSpacing: 0.6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusCompleted: {
    backgroundColor: '#DEF7EC',
  },
  statusProgress: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextCompleted: {
    color: '#03543F',
  },
  statusTextProgress: {
    color: '#92400E',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 14,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
});
