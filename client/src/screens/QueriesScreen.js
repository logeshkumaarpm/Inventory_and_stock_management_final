import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { InventoryContext } from '../contexts/InventoryContext';
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';
import { theme } from '../theme';

const STUDENT_TYPES = ['Purchased Item Feedback', 'Replacement Feedback'];
const STAFF_TYPES = ['Lab Item Issue', 'Repair Request', 'Replacement Request'];

export default function QueriesScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const { queries, fetchQueries } = useContext(InventoryContext);
  const { user } = useContext(AuthContext);
  const [refreshing, setRefreshing] = useState(false);
  const [type, setType] = useState(STAFF_TYPES[0]);
  const [itemName, setItemName] = useState('');
  const [message, setMessage] = useState('');

  const isAdmin = user?.role === 'Admin';
  const isStudent = user?.role === 'Student';
  const isStaff = user?.role === 'Staff';
  const canSubmit = isStudent || isStaff;
  const types = isStaff ? STAFF_TYPES : STUDENT_TYPES;

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  useEffect(() => {
    setType(types[0]);
    setItemName('');
    setMessage('');
  }, [types]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchQueries();
    } finally {
      setRefreshing(false);
    }
  };

  const submitQuery = async () => {
    if (!itemName.trim() || !message.trim()) {
      Alert.alert('Missing data', 'Please enter the item name and details.');
      return;
    }

    try {
      await api.post('/queries', { type, itemName: itemName.trim(), message: message.trim() });
      Alert.alert('Success', isStaff ? 'Query submitted successfully.' : 'Feedback submitted successfully.');
      setItemName('');
      setMessage('');
      await fetchQueries();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit');
    }
  };

  const markResolved = async (id) => {
    try {
      await api.put(`/queries/${id}/status`, { status: 'Resolved' });
      await fetchQueries();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to resolve query');
    }
  };

  const renderForm = () => (
    <View style={styles.formCard}>
      <Text style={styles.kicker}>{isStaff ? 'Staff queries' : 'Student feedback'}</Text>
      <Text style={styles.sectionTitle}>{isStaff ? 'Raise a query' : 'Share item feedback'}</Text>
      <Text style={styles.formHelp}>
        {isStaff
          ? 'Use this area to report a defective item, request a repair, or ask for replacement support.'
          : 'Share what happened after purchase or replacement so admin can review it.'}
      </Text>

      <View style={[styles.typeSelector, isWide && styles.typeSelectorWide]}>
        {types.map((entry) => (
          <TouchableOpacity
            key={entry}
            style={[styles.typeBtn, type === entry && styles.typeBtnActive]}
            onPress={() => setType(entry)}
          >
            <Text style={[styles.typeBtnText, type === entry && styles.typeBtnTextActive]}>{entry}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Item name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter item name"
          placeholderTextColor={theme.colors.muted}
          value={itemName}
          onChangeText={setItemName}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{isStaff ? 'Query details' : 'Feedback details'}</Text>
        <TextInput
          style={styles.textArea}
          placeholder={isStaff ? 'Describe the defect or repair needed...' : 'Write your feedback...'}
          placeholderTextColor={theme.colors.muted}
          multiline
          numberOfLines={4}
          value={message}
          onChangeText={setMessage}
        />
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={submitQuery}>
        <Text style={styles.submitBtnText}>{isStaff ? 'Submit query' : 'Submit feedback'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQueryCard = (item) => {
    const ownerName = item.userId?.name || 'You';
    const ownerRole = item.userId?.role;

    return (
      <View key={item._id} style={styles.queryCard}>
        <View style={styles.queryHeader}>
          <View style={styles.queryCopy}>
            <Text style={styles.queryType}>{item.type}</Text>
            <Text style={styles.queryItem}>Item: {item.itemName}</Text>
            {isAdmin && (
              <Text style={styles.queryMeta}>
                Raised by {ownerName}
                {ownerRole ? ` (${ownerRole})` : ''}
              </Text>
            )}
          </View>
          <View style={[styles.statusBadge, item.status === 'Resolved' ? styles.statusRes : styles.statusPen]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.queryMessage}>{item.message}</Text>

        <View style={styles.queryFooter}>
          <Text style={styles.queryDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          {isAdmin && item.status === 'Pending' && (
            <TouchableOpacity style={styles.resolveBtn} onPress={() => markResolved(item._id)}>
              <Text style={styles.resolveBtnText}>Mark resolved</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.pageContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>{isAdmin ? 'Admin inbox' : isStaff ? 'Staff queries' : 'Student feedback'}</Text>
          <Text style={styles.heroTitle}>
            {isAdmin ? 'Resolve queries' : isStaff ? 'Raise query' : 'Feedback center'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {isAdmin
              ? 'Review incoming staff and student requests, then mark each issue resolved once it is fixed.'
              : isStaff
                ? 'Report defects, repairs, and replacement needs for lab items.'
                : 'Tell admin about item quality, defects, or replacement experiences after purchase.'}
          </Text>
        </View>

        {canSubmit && renderForm()}

        <View style={styles.listContent}>
          {queries.length > 0 ? (
            queries.map(renderQueryCard)
          ) : (
            <Text style={styles.emptyText}>No queries found.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  page: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  pageContent: {
    paddingBottom: 28,
  },
  hero: {
    marginBottom: 16,
    padding: 22,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  kicker: {
    color: theme.colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: theme.colors.muted,
    lineHeight: 21,
    maxWidth: 760,
  },
  listContent: {
    paddingBottom: 28,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: theme.radius.xl,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
    color: theme.colors.text,
  },
  formHelp: {
    color: theme.colors.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  typeSelectorWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  typeBtn: {
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSoft,
    marginBottom: 10,
  },
  typeBtnActive: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.accent,
  },
  typeBtnText: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '700',
    textAlign: 'center',
  },
  typeBtnTextActive: {
    color: theme.colors.accent,
    fontWeight: '800',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text,
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
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    textAlignVertical: 'top',
    backgroundColor: theme.colors.surfaceSoft,
    color: theme.colors.text,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: 4,
    ...theme.shadow.floating,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  queryCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.radius.lg,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  queryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  queryCopy: {
    flex: 1,
    paddingRight: 4,
  },
  queryType: {
    fontWeight: '800',
    fontSize: 15,
    color: theme.colors.text,
  },
  queryItem: {
    marginTop: 2,
    color: theme.colors.muted,
    fontSize: 12,
  },
  queryMeta: {
    marginTop: 2,
    color: theme.colors.muted,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPen: {
    backgroundColor: '#FFF4D6',
  },
  statusRes: {
    backgroundColor: '#E7F8F0',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text,
  },
  queryMessage: {
    fontSize: 14,
    color: theme.colors.muted,
    lineHeight: 20,
    marginBottom: 10,
  },
  queryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
  },
  queryDate: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  resolveBtn: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  resolveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 28,
    color: theme.colors.muted,
    fontStyle: 'italic',
  },
});
