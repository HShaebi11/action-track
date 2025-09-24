// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCuySIEoHmDAbw7yIRG50bI2nKEsddOxs4",
  authDomain: "track-byhamza-xyz.firebaseapp.com",
  projectId: "track-byhamza-xyz",
  storageBucket: "track-byhamza-xyz.firebasestorage.app",
  messagingSenderId: "524511488998",
  appId: "1:524511488998:web:6574f0ce061665c4990427",
  measurementId: "G-LMSGD3NC19"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteField, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getAnalytics, logEvent } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Track app usage
try {
  // Track page views and user interactions
  if (analytics) {
    console.log('Firebase Analytics initialized successfully');
  }
} catch (error) {
  console.log('Analytics not available:', error);
}

// Database Service Class
class DatabaseService {
  constructor() {
    this.db = db;
    this.isOnline = navigator.onLine;
    this.setupOfflineHandling();
  }

  setupOfflineHandling() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingChanges();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // User Management
  async createUser(userData) {
    try {
      const userRef = doc(this.db, 'users', userData.id);
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });

      // Track user registration
      try {
        logEvent(analytics, 'sign_up', {
          method: 'passkey'
        });
      } catch (e) {
        console.log('Analytics not available');
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  }

  async getUser(userId) {
    try {
      const userRef = doc(this.db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return { success: true, data: userSnap.data() };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUser(userId, updates) {
    try {
      const userRef = doc(this.db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        lastUpdated: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }

  // Subscription Management
  async saveUserSubscriptions(userId, subscriptions) {
    try {
      const userRef = doc(this.db, 'userData', userId);
      await setDoc(userRef, {
        subscriptions: subscriptions,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      // Track subscription actions
      try {
        logEvent(analytics, 'subscription_updated', {
          total_subscriptions: subscriptions.length,
          user_id: userId
        });
      } catch (e) {
        console.log('Analytics not available');
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving subscriptions:', error);

      // Store locally if offline
      if (!this.isOnline) {
        this.storeOfflineData('subscriptions', userId, subscriptions);
        return { success: true, offline: true };
      }

      return { success: false, error: error.message };
    }
  }

  async getUserSubscriptions(userId) {
    try {
      const userRef = doc(this.db, 'userData', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().subscriptions) {
        return { success: true, data: userSnap.data().subscriptions };
      } else {
        return { success: true, data: [] };
      }
    } catch (error) {
      console.error('Error getting subscriptions:', error);

      // Return local data if offline
      if (!this.isOnline) {
        const localData = this.getOfflineData('subscriptions', userId);
        return { success: true, data: localData || [], offline: true };
      }

      return { success: false, error: error.message };
    }
  }

  async saveMonthlyIncome(userId, income) {
    try {
      const userRef = doc(this.db, 'userData', userId);
      await setDoc(userRef, {
        monthlyIncome: income,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      return { success: true };
    } catch (error) {
      console.error('Error saving income:', error);

      if (!this.isOnline) {
        this.storeOfflineData('monthlyIncome', userId, income);
        return { success: true, offline: true };
      }

      return { success: false, error: error.message };
    }
  }

  async getMonthlyIncome(userId) {
    try {
      const userRef = doc(this.db, 'userData', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().monthlyIncome !== undefined) {
        return { success: true, data: userSnap.data().monthlyIncome };
      } else {
        return { success: true, data: 0 };
      }
    } catch (error) {
      console.error('Error getting income:', error);

      if (!this.isOnline) {
        const localData = this.getOfflineData('monthlyIncome', userId);
        return { success: true, data: localData || 0, offline: true };
      }

      return { success: false, error: error.message };
    }
  }

  // Offline Data Management
  storeOfflineData(type, userId, data) {
    const offlineKey = `offline_${type}_${userId}`;
    localStorage.setItem(offlineKey, JSON.stringify({
      data,
      timestamp: Date.now(),
      pending: true
    }));

    // Add to pending sync queue
    let pendingSync = JSON.parse(localStorage.getItem('pendingSync') || '[]');
    pendingSync.push({ type, userId, data });
    localStorage.setItem('pendingSync', JSON.stringify(pendingSync));
  }

  getOfflineData(type, userId) {
    const offlineKey = `offline_${type}_${userId}`;
    const stored = localStorage.getItem(offlineKey);
    if (stored) {
      return JSON.parse(stored).data;
    }
    return null;
  }

  async syncPendingChanges() {
    const pendingSync = JSON.parse(localStorage.getItem('pendingSync') || '[]');

    for (const item of pendingSync) {
      try {
        if (item.type === 'subscriptions') {
          await this.saveUserSubscriptions(item.userId, item.data);
        } else if (item.type === 'monthlyIncome') {
          await this.saveMonthlyIncome(item.userId, item.data);
        }

        // Remove from offline storage after successful sync
        localStorage.removeItem(`offline_${item.type}_${item.userId}`);
      } catch (error) {
        console.error('Error syncing pending changes:', error);
      }
    }

    // Clear pending sync queue
    localStorage.removeItem('pendingSync');

    // Notify user of successful sync
    if (pendingSync.length > 0) {
      window.authSystem?.showSuccess('Data synced successfully!');
    }
  }

  // Get connection status
  isConnected() {
    return this.isOnline;
  }
}

// Export for use in other files
window.DatabaseService = DatabaseService;
window.dbService = new DatabaseService();
window.firebaseAuth = auth;

export { DatabaseService, db, auth };