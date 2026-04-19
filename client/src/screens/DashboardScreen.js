import React, { useContext, useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { InventoryContext } from '../contexts/InventoryContext';
import { theme } from '../theme';

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const { user, logout } = useContext(AuthContext);
  const { inventory, notifications, queries, fetchInventory, fetchNotifications, fetchQueries } = useContext(InventoryContext);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    try {
      await fetchInventory();
      if (user?.role === 'Admin') {
        await fetchNotifications();
      }
      await fetchQueries();
    } finally {
      setRefreshing(false);
    }
  };

  const lowStockItems = inventory.filter(item => item.quantity < 5);
  const outOfStockItems = inventory.filter(item => item.quantity === 0 || item.status === 'Out of Stock');
  const activeQueries = queries.filter(q => q.status === 'Pending');
  const resolvedQueries = queries.filter(q => q.status === 'Resolved');

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
    >
      <View style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.kicker}>Operations dashboard</Text>
          <Text style={styles.greeting}>Hello, {user?.name}</Text>
          <Text style={styles.subtitle}>Track inventory health, queries, and activity from one clean control center.</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role}</Text>
        </View>
      </View>

      <View style={[styles.statsContainer, isWide && styles.statsContainerWide]}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{inventory.length}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{lowStockItems.length + outOfStockItems.length}</Text>
          <Text style={styles.statLabel}>Alerts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{activeQueries.length}</Text>
          <Text style={styles.statLabel}>Queries</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inventory health</Text>
        <View style={styles.healthRow}>
          <View style={styles.healthCard}>
            <Text style={styles.healthValue}>{lowStockItems.length}</Text>
            <Text style={styles.healthLabel}>Low stock</Text>
          </View>
          <View style={styles.healthCard}>
            <Text style={styles.healthValue}>{outOfStockItems.length}</Text>
            <Text style={styles.healthLabel}>Out of stock</Text>
          </View>
          <View style={styles.healthCard}>
            <Text style={styles.healthValue}>{resolvedQueries.length}</Text>
            <Text style={styles.healthLabel}>Resolved</Text>
          </View>
        </View>
      </View>

      {user?.role === 'Admin' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          {notifications.slice(0, 5).map((notif) => (
            <View key={notif._id} style={styles.notifCard}>
              <View style={styles.notifDot} />
              <View style={styles.notifBody}>
                <Text style={styles.notifText}>{notif.message}</Text>
                <Text style={styles.notifTime}>{new Date(notif.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>
          ))}
          {notifications.length === 0 && <Text style={styles.emptyText}>No recent notifications.</Text>}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Keep the floor moving</Text>
          <Text style={styles.ctaText}>Review inventory, clear queries, and stay ahead of stock issues before they become blockers.</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  page: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingBottom: 8,
  },
  hero: {
    margin: 16,
    marginTop: 18,
    padding: 20,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    ...theme.shadow.floating,
  },
  heroCopy: {
    flex: 1,
    paddingRight: 12,
  },
  kicker: {
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 21,
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    marginTop: 2,
  },
  statsContainerWide: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
    color: theme.colors.text,
  },
  healthRow: {
    flexDirection: 'row',
    marginHorizontal: -5,
  },
  healthCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
    marginHorizontal: 5,
  },
  healthValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  healthLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '700',
  },
  notifCard: {
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: theme.radius.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...theme.shadow.card,
  },
  notifDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
    marginTop: 5,
    marginRight: 10,
  },
  notifBody: {
    flex: 1,
  },
  notifText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  notifTime: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 6,
  },
  emptyText: {
    fontStyle: 'italic',
    color: theme.colors.muted,
  },
  ctaCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    ...theme.shadow.card,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
  },
  ctaText: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.muted,
    marginBottom: 14,
  },
  logoutBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: theme.colors.danger,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '800',
  },
});
