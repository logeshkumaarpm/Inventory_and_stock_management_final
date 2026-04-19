import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { InventoryContext } from '../contexts/InventoryContext';
import { AuthContext } from '../contexts/AuthContext';
import { theme } from '../theme';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString();
};

export default function ActivityScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const { user } = useContext(AuthContext);
  const { transactions, fetchTransactions } = useContext(InventoryContext);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
      await fetchTransactions();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const enrichedTransactions = useMemo(() => {
    const now = Date.now();

    return transactions.map((transaction) => {
      const dueAt = transaction.dueAt ? new Date(transaction.dueAt).getTime() : null;
      const overdueDays = dueAt && now > dueAt ? Math.ceil((now - dueAt) / (24 * 60 * 60 * 1000)) : 0;
      const overdueFine = transaction.action === 'Borrow' && transaction.status === 'Approved'
        ? overdueDays * 10
        : Number(transaction.fineAmount || 0);

      return {
        ...transaction,
        overdueDays,
        overdueFine,
        isOverdue: overdueDays > 0 && transaction.action === 'Borrow' && transaction.status === 'Approved',
      };
    });
  }, [transactions]);

  const activeBorrows = enrichedTransactions.filter(
    (transaction) => transaction.action === 'Borrow' && transaction.status === 'Approved'
  );
  const overdueBorrows = activeBorrows.filter((transaction) => transaction.isOverdue);
  const approvedPurchases = enrichedTransactions.filter(
    (transaction) => transaction.action === 'Purchase' && transaction.status === 'Approved'
  );

  const renderCard = (transaction) => {
    const itemName = transaction.inventoryId?.name || 'Unknown item';
    const statusText = transaction.status;
    const statusStyle =
      statusText === 'Approved'
        ? styles.badgeSuccess
        : statusText === 'Rejected'
          ? styles.badgeDanger
          : statusText === 'Returned'
            ? styles.badgeMuted
            : styles.badgePending;

    return (
      <View key={transaction._id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>{transaction.action}</Text>
            <Text style={styles.cardMeta}>{itemName} | Qty {transaction.quantity}</Text>
            <Text style={styles.cardSub}>
              {formatDate(transaction.approvedAt || transaction.createdAt)}
            </Text>
          </View>
          <View style={[styles.badge, statusStyle]}>
            <Text style={styles.badgeText}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Due</Text>
          <Text style={styles.detailValue}>{formatDate(transaction.dueAt)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fine</Text>
          <Text style={styles.detailValue}>
            {transaction.isOverdue ? money.format(transaction.overdueFine) : money.format(transaction.fineAmount || 0)}
          </Text>
        </View>

        {transaction.isOverdue && (
          <View style={styles.overdueBox}>
            <Text style={styles.overdueText}>
              Overdue by {transaction.overdueDays} day{transaction.overdueDays > 1 ? 's' : ''}. Please return the item and clear the fine.
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
    >
      <View style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>{user?.role === 'Admin' ? 'All transactions' : 'My activity'}</Text>
          <Text style={styles.title}>Purchase and borrow history</Text>
          <Text style={styles.subtitle}>
            Track what has been requested, approved, returned, and what is still overdue.
          </Text>
        </View>

        <View style={[styles.statsGrid, isWide && styles.statsGridWide]}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{approvedPurchases.length}</Text>
            <Text style={styles.statLabel}>Approved purchases</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeBorrows.length}</Text>
            <Text style={styles.statLabel}>Active borrows</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{overdueBorrows.length}</Text>
            <Text style={styles.statLabel}>Overdue items</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
          {enrichedTransactions.length > 0 ? (
            enrichedTransactions.map(renderCard)
          ) : (
            <Text style={styles.emptyText}>No transactions found yet.</Text>
          )}
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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  page: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
  },
  hero: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    padding: 22,
    marginBottom: 16,
    ...theme.shadow.floating,
  },
  kicker: {
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 21,
    maxWidth: 680,
  },
  statsGrid: {
    flexDirection: 'column',
    marginBottom: 18,
  },
  statsGridWide: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
    marginBottom: 12,
    marginRight: 16,
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
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 12,
    ...theme.shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardCopy: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 2,
  },
  cardMeta: {
    color: theme.colors.muted,
    fontSize: 13,
    marginBottom: 2,
  },
  cardSub: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgePending: {
    backgroundColor: '#FFF4D6',
  },
  badgeSuccess: {
    backgroundColor: '#E7F8F0',
  },
  badgeDanger: {
    backgroundColor: '#FDECEC',
  },
  badgeMuted: {
    backgroundColor: theme.colors.surfaceSoft,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.text,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  detailLabel: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  detailValue: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  overdueBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: '#FDECEC',
  },
  overdueText: {
    color: theme.colors.danger,
    fontWeight: '700',
    lineHeight: 20,
  },
  emptyText: {
    color: theme.colors.muted,
    fontStyle: 'italic',
  },
});
