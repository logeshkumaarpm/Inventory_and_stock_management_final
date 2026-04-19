import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { InventoryContext } from '../contexts/InventoryContext';
import api from '../utils/api';
import { theme } from '../theme';

export default function ItemDetailScreen({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const { fetchInventory } = useContext(InventoryContext);
  
  const mode = route.params?.mode || 'view'; // 'view', 'create', 'edit'
  const initialItem = route.params?.item || {
    itemId: '', name: '', category: '', quantity: '0', price: '0', assignedTo: 'General', status: 'Available'
  };

  const [item, setItem] = useState({ ...initialItem, quantity: String(initialItem.quantity), price: String(initialItem.price) });
  const [isEditing, setIsEditing] = useState(mode === 'create');
  
  // Action states for Student/Staff
  const [actionType, setActionType] = useState(null); // 'Purchase', 'Borrow', 'Return'
  const [actionData, setActionData] = useState({ quantity: '1', duration: '', reason: '' });

  const isAdmin = user.role === 'Admin';
  const isOutOfStock = item.status === 'Out of Stock' || Number(item.quantity) === 0;

  const handleSave = async () => {
    try {
      if (!item.name || !item.category || !item.itemId) {
        Alert.alert('Missing data', 'Please fill in all required fields.');
        return;
      }

      const payload = {
        ...item,
        quantity: Number(item.quantity),
        price: Number(item.price)
      };

      if (mode === 'create') {
        await api.post('/inventory', payload);
        Alert.alert('Success', 'Item created');
      } else {
        await api.put(`/inventory/${item._id}`, payload);
        Alert.alert('Success', 'Item updated');
      }
      fetchInventory();
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/inventory/${item._id}`);
          fetchInventory();
          navigation.goBack();
        } catch (e) {
          Alert.alert('Error', 'Failed to delete');
        }
      }}
    ]);
  };

  const submitAction = async () => {
    try {
      const qty = Number(actionData.quantity);
      if (!qty || qty <= 0) {
        Alert.alert('Invalid quantity', 'Please enter a quantity greater than zero.');
        return;
      }

      if (actionType === 'Borrow' && (!actionData.duration || Number(actionData.duration) <= 0)) {
        Alert.alert('Missing duration', 'Borrowing requires a valid duration.');
        return;
      }

      if (actionType === 'Return' && !actionData.reason.trim()) {
        Alert.alert('Missing reason', 'Please add a return reason.');
        return;
      }

      let endpoint = `/inventory/${actionType.toLowerCase()}`;
      let payload = { itemId: item._id, quantity: qty };
      
      if (actionType === 'Borrow') payload.duration = Number(actionData.duration);
      if (actionType === 'Return') payload.reason = actionData.reason.trim();

      const res = await api.post(endpoint, payload);
      Alert.alert('Success', res.data.message);
      fetchInventory();
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Action failed');
    }
  };

  const renderInput = (label, field, editable = true, keyboardType = 'default') => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={item[field]}
        onChangeText={(txt) => setItem({...item, [field]: txt})}
        editable={editable}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.page}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.kicker}>{mode === 'create' ? 'Create inventory record' : 'Inventory item'}</Text>
              <Text style={styles.headerTitle}>{mode === 'create' ? 'New Item' : item.name}</Text>
            </View>
            <View style={[styles.statusChip, isOutOfStock ? styles.statusDanger : styles.statusSuccess]}>
              <Text style={styles.statusChipText}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.subheader}>ID {item.itemId || 'Pending'} | {item.category || 'Unassigned'}</Text>
          
          {renderInput('Item ID', 'itemId', isEditing && mode === 'create')}
          {renderInput('Name', 'name', isEditing)}
          {renderInput('Category', 'category', isEditing)}
          {renderInput('Quantity', 'quantity', isEditing, 'numeric')}
          {renderInput('Price ($)', 'price', isEditing, 'numeric')}
          
          {isAdmin && isEditing && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.9}>
              <Text style={styles.btnText}>Save Item</Text>
            </TouchableOpacity>
          )}

          {isAdmin && mode !== 'create' && !isEditing && (
            <View style={styles.adminActions}>
              <TouchableOpacity style={[styles.actionBtn, styles.actionWarning]} onPress={() => setIsEditing(true)} activeOpacity={0.9}>
                <Text style={styles.btnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={handleDelete} activeOpacity={0.9}>
                <Text style={styles.btnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {user?.role === 'Student' && mode !== 'create' && (
          <View style={styles.card}>
            <Text style={styles.headerTitle}>Actions</Text>
            
            <View style={styles.userActions}>
              <TouchableOpacity style={styles.actionTab} onPress={() => setActionType('Purchase')}>
                <Text style={styles.actionTabText}>Purchase</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionTab} onPress={() => setActionType('Borrow')}>
                <Text style={styles.actionTabText}>Borrow</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionTab} onPress={() => setActionType('Return')}>
                <Text style={styles.actionTabText}>Return</Text>
              </TouchableOpacity>
            </View>

            {actionType && (
              <View style={styles.actionForm}>
                <Text style={styles.actionTitle}>{actionType} Item</Text>
                {actionType === 'Borrow' && (
                  <Text style={styles.actionHint}>
                    Choose how many days you need this item. Borrow requests are approved by admin.
                  </Text>
                )}
                {actionType === 'Return' && (
                  <Text style={styles.actionHint}>
                    Returns are only allowed within 7 days for defective items.
                  </Text>
                )}
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Quantity</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={actionData.quantity}
                    onChangeText={(txt) => setActionData({...actionData, quantity: txt})}
                  />
                </View>

                {actionType === 'Borrow' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Duration (Days)</Text>
                    <TextInput 
                      style={styles.input} 
                      keyboardType="numeric" 
                      value={actionData.duration}
                      onChangeText={(txt) => setActionData({...actionData, duration: txt})}
                    />
                  </View>
                )}

                {actionType === 'Return' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Reason</Text>
                    <TextInput 
                      style={styles.input} 
                      value={actionData.reason}
                      onChangeText={(txt) => setActionData({...actionData, reason: txt})}
                    />
                  </View>
                )}

                <TouchableOpacity style={styles.submitActionBtn} onPress={submitAction}>
                  <Text style={styles.btnText}>Request {actionType}</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 24,
  },
  page: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: theme.radius.xl,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kicker: {
    color: theme.colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subheader: {
    marginTop: 8,
    marginBottom: 18,
    color: theme.colors.muted,
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 15
  },
  label: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 5,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.surfaceSoft,
    color: theme.colors.text,
  },
  inputDisabled: {
    backgroundColor: '#EEF2F7',
    color: theme.colors.muted
  },
  saveBtn: {
    backgroundColor: theme.colors.success,
    padding: 15,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16
  },
  adminActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15
  },
  actionBtn: {
    flex: 1,
    padding: 15,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginHorizontal: 5
  },
  actionWarning: {
    backgroundColor: theme.colors.warning,
  },
  actionDanger: {
    backgroundColor: theme.colors.danger,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  actionTab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: theme.colors.primarySoft,
    marginHorizontal: 5,
    borderRadius: theme.radius.md,
    alignItems: 'center'
  },
  actionTabText: {
    color: theme.colors.primary,
    fontWeight: '800'
  },
  actionForm: {
    backgroundColor: theme.colors.surfaceSoft,
    padding: 15,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 15,
    color: theme.colors.text
  },
  actionHint: {
    color: theme.colors.muted,
    lineHeight: 20,
    marginBottom: 12,
    fontSize: 13,
  },
  submitActionBtn: {
    backgroundColor: theme.colors.accent,
    padding: 15,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: 10,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  statusSuccess: {
    backgroundColor: '#E7F8F0',
  },
  statusDanger: {
    backgroundColor: '#FDECEC',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.text,
  }
});
