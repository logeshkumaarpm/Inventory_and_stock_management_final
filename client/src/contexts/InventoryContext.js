import React, { createContext, useState, useCallback } from 'react';
import api from '../utils/api';

export const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const [inventory, setInventory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [queries, setQueries] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory');
      setInventory(response.data);
    } catch (e) {
      console.error('Error fetching inventory:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  }, []);

  const fetchQueries = useCallback(async () => {
    try {
      const response = await api.get('/queries');
      setQueries(response.data);
    } catch (e) {
      console.error('Error fetching queries:', e);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (e) {
      console.error('Error fetching transactions:', e);
    }
  }, []);

  const approveTransaction = useCallback(async (id) => {
    await api.patch(`/transactions/${id}/approve`);
    await fetchTransactions();
    await fetchInventory();
    await fetchNotifications();
  }, [fetchTransactions, fetchInventory, fetchNotifications]);

  const rejectTransaction = useCallback(async (id) => {
    await api.patch(`/transactions/${id}/reject`);
    await fetchTransactions();
  }, [fetchTransactions]);

  return (
    <InventoryContext.Provider value={{ 
      inventory, fetchInventory, 
      notifications, fetchNotifications,
      queries, fetchQueries,
      transactions, fetchTransactions,
      approveTransaction, rejectTransaction,
      loading 
    }}>
      {children}
    </InventoryContext.Provider>
  );
};
