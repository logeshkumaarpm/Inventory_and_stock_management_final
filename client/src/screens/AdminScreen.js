import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import api from '../utils/api';
import { InventoryContext } from '../contexts/InventoryContext';
import { AuthContext } from '../contexts/AuthContext';
import { theme } from '../theme';

const roleOptions = ['Student', 'Staff'];

export default function AdminScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const { user } = useContext(AuthContext);
  const {
    inventory,
    transactions,
    fetchInventory,
    fetchTransactions,
    approveTransaction,
    rejectTransaction,
  } = useContext(InventoryContext);

  const [refreshing, setRefreshing] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [role, setRole] = useState('Student');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const pendingTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status === 'Pending'),
    [transactions]
  );

  const returnRequests = pendingTransactions.filter((transaction) => transaction.action === 'Return');
  const orderRequests = pendingTransactions.filter((transaction) => transaction.action !== 'Return');
  const lowStockItems = inventory.filter((item) => item.quantity < 5);

  const loadData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchInventory(), fetchTransactions()]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({ name: '', email: '', password: '' });
    setRole('Student');
  };

  const createAccount = async () => {
    if (!form.name || !form.email || !form.password || !role) {
      Alert.alert('Missing data', 'Please fill in every field.');
      return;
    }

    setSavingUser(true);
    try {
      await api.post('/auth/register', { ...form, role });
      Alert.alert('Success', `${role} account created successfully.`);
      resetForm();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not create account');
    } finally {
      setSavingUser(false);
    }
  };

  const onApprove = async (transaction) => {
    try {
      await approveTransaction(transaction._id);
      Alert.alert('Approved', `${transaction.action} request approved.`);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not approve request');
    }
  };

  const onReject = async (transaction) => {
    try {
      await rejectTransaction(transaction._id);
      Alert.alert('Rejected', `${transaction.action} request rejected.`);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not reject request');
    }
  };

  const renderTransactionCard = (transaction) => (
    <View key={transaction._id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View>
          <Text style={styles.requestType}>{transaction.action}</Text>
          <Text style={styles.requestMeta}>
            {transaction.userId?.name || 'Unknown user'} - {transaction.inventoryId?.name || 'Unknown item'}
          </Text>
        </View>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>Pending</Text>
        </View>
      </View>

      <Text style={styles.requestBody}>
        Qty {transaction.quantity}
        {transaction.duration ? ` | ${transaction.duration} days` : ''}
        {transaction.reason ? ` | ${transaction.reason}` : ''}
      </Text>

      <View style={styles.requestActions}>
        <TouchableOpacity style={styles.approveBtn} onPress={() => onApprove(transaction)}>
          <Text style={styles.actionBtnText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject(transaction)}>
          <Text style={styles.actionBtnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
    >
      <View style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.kicker}>Administration</Text>
          <Text style={styles.title}>Control center</Text>
          <Text style={styles.subtitle}>
            Create accounts, review purchase and borrow requests, and approve returns within the policy window.
          </Text>
        </View>
        <View style={styles.heroStats}>
          <Text style={styles.heroStatValue}>{pendingTransactions.length}</Text>
          <Text style={styles.heroStatLabel}>Pending approvals</Text>
        </View>
      </View>

      <View style={[styles.grid, isWide && styles.gridWide]}>
        <View style={[styles.panel, styles.formPanel, isWide && styles.panelHalf]}>
          <Text style={styles.panelKicker}>Create account</Text>
          <Text style={styles.panelTitle}>Student or staff</Text>
          <Text style={styles.panelNote}>
            Add a new account with a temporary password. You can assign the role here and share the login details securely.
          </Text>

          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={theme.colors.muted}
            value={form.name}
            onChangeText={(name) => setForm((prev) => ({ ...prev, name }))}
          />

          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="user@college.edu"
            placeholderTextColor={theme.colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(email) => setForm((prev) => ({ ...prev, email }))}
          />

          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Temporary password"
            placeholderTextColor={theme.colors.muted}
            secureTextEntry={true}
            value={form.password}
            onChangeText={(password) => setForm((prev) => ({ ...prev, password }))}
          />

          <Text style={styles.fieldLabel}>Role</Text>
          <View style={styles.roleRow}>
            {roleOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.roleChip, role === option && styles.roleChipActive]}
                onPress={() => setRole(option)}
              >
                <Text style={[styles.roleChipText, role === option && styles.roleChipTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, savingUser && styles.disabledBtn]}
            onPress={createAccount}
            activeOpacity={0.9}
            disabled={savingUser === true}
          >
            <Text style={styles.primaryBtnText}>{savingUser ? 'Creating...' : 'Create account'}</Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>
            Admin account: {user?.email}
          </Text>
        </View>

        <View style={[styles.panel, isWide && styles.panelHalf]}>
          <Text style={styles.panelKicker}>Stock health</Text>
          <Text style={styles.panelTitle}>Low stock alerts</Text>

          {lowStockItems.slice(0, 5).map((item) => (
            <View key={item._id} style={styles.stockCard}>
              <View>
                <Text style={styles.stockName}>{item.name}</Text>
                <Text style={styles.stockMeta}>ID {item.itemId} | {item.category}</Text>
              </View>
              <View style={styles.stockQty}>
                <Text style={styles.stockQtyText}>{item.quantity}</Text>
              </View>
            </View>
          ))}

          {lowStockItems.length === 0 && (
            <Text style={styles.emptyText}>No low stock items right now.</Text>
          )}
        </View>
      </View>

      <View style={[styles.grid, isWide && styles.gridWide]}>
        <View style={[styles.panel, isWide && styles.panelHalf]}>
          <Text style={styles.panelKicker}>Purchase orders</Text>
          <Text style={styles.panelTitle}>Student requests</Text>
          {orderRequests.length > 0 ? (
            orderRequests.map(renderTransactionCard)
          ) : (
            <Text style={styles.emptyText}>No pending purchase or borrow requests.</Text>
          )}
        </View>

        <View style={[styles.panel, isWide && styles.panelHalf]}>
          <Text style={styles.panelKicker}>Returns</Text>
          <Text style={styles.panelTitle}>Defective item claims</Text>
          {returnRequests.length > 0 ? (
            returnRequests.map(renderTransactionCard)
          ) : (
            <Text style={styles.emptyText}>No pending return requests.</Text>
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 21,
  },
  heroStats: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 120,
  },
  heroStatValue: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  gridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  panelHalf: {
    flex: 1,
  },
  formPanel: {
    minHeight: 420,
  },
  panelKicker: {
    color: theme.colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  panelNote: {
    color: theme.colors.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: 14,
    color: theme.colors.text,
  },
  roleRow: {
    flexDirection: 'row',
    marginTop: 6,
    marginHorizontal: -5,
  },
  roleChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSoft,
    marginHorizontal: 5,
  },
  roleChipActive: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.accent,
  },
  roleChipText: {
    fontWeight: '800',
    color: theme.colors.muted,
  },
  roleChipTextActive: {
    color: theme.colors.accent,
  },
  primaryBtn: {
    marginTop: 18,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    ...theme.shadow.floating,
  },
  disabledBtn: {
    opacity: 0.75,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  helperText: {
    marginTop: 12,
    color: theme.colors.muted,
    fontSize: 13,
  },
  stockCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 14,
    backgroundColor: theme.colors.surfaceSoft,
    marginBottom: 10,
  },
  stockName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 3,
  },
  stockMeta: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  stockQty: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDECEC',
  },
  stockQtyText: {
    fontWeight: '800',
    color: theme.colors.danger,
  },
  requestCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 14,
    backgroundColor: theme.colors.surfaceSoft,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  requestType: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 3,
  },
  requestMeta: {
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  pendingBadge: {
    backgroundColor: '#FFF4D6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.warning,
  },
  requestBody: {
    marginTop: 10,
    color: theme.colors.text,
    lineHeight: 20,
  },
  requestActions: {
    flexDirection: 'row',
    marginTop: 12,
    marginHorizontal: -5,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: theme.colors.success,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: theme.colors.danger,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
  emptyText: {
    color: theme.colors.muted,
    fontStyle: 'italic',
  },
});
