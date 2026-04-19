import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { InventoryContext } from '../contexts/InventoryContext';
import { AuthContext } from '../contexts/AuthContext';
import { theme } from '../theme';

export default function InventoryListScreen({ navigation }) {
  const { inventory, fetchInventory, loading } = useContext(InventoryContext);
  const { user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInventory();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchInventory();
    });
    return unsubscribe;
  }, [navigation, fetchInventory]);

  const filteredInventory = inventory.filter(item => 
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.itemId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = inventory.filter(item => item.quantity < 5 && item.quantity > 0).length;
  const outOfStockCount = inventory.filter(item => item.quantity === 0 || item.status === 'Out of Stock').length;

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ItemDetail', { item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={[
          styles.statusBadge, 
          item.status === 'Available' ? styles.statusAvail : styles.statusOut
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.itemId}>ID: {item.itemId}</Text>
      <View style={styles.cardInfo}>
        <Text style={styles.infoText}>Qty: <Text style={{fontWeight: '800', color: item.quantity < 5 ? theme.colors.danger : theme.colors.text}}>{item.quantity}</Text></Text>
        <Text style={styles.infoText}>Price: ${item.price}</Text>
      </View>
      <Text style={styles.categoryBadge}>{item.category}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Catalog overview</Text>
        <Text style={styles.heroTitle}>Inventory</Text>
        <Text style={styles.heroSubtitle}>{inventory.length} items total. {lowStockCount} low stock and {outOfStockCount} out of stock.</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor={theme.colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={filteredInventory}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No items found. Try a different search term.</Text>}
        />
      )}

      {user?.role === 'Admin' && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('ItemDetail', { mode: 'create' })}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      )}
      </View>
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
    maxWidth: 1180,
    alignSelf: 'center',
    flex: 1,
  },
  hero: {
    margin: 16,
    marginBottom: 10,
    padding: 18,
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
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: theme.colors.muted,
    lineHeight: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    height: 50,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    ...theme.shadow.card,
  },
  card: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginTop: 15,
    padding: 15,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  itemName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    flex: 1
  },
  itemId: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 10
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusAvail: {
    backgroundColor: '#E7F8F0',
  },
  statusOut: {
    backgroundColor: '#FDECEC',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.muted
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 12,
    marginTop: 10,
    color: theme.colors.primary,
    overflow: 'hidden'
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.floating,
  },
  addIcon: {
    fontSize: 32,
    color: '#fff',
    lineHeight: 34
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: theme.colors.muted,
    fontSize: 16
  }
});
