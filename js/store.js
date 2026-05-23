// ============================================
// HOME CARE APP — State Management (Store)
// Firebase Realtime Database + LocalStorage fallback
// ============================================

const Store = (() => {
  const STORAGE_KEY = 'homecare_app';
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAGDrLmsREilhXNT3uwz0aEKp4CwGskpJA",
    authDomain: "homecare-8d600.firebaseapp.com",
    databaseURL: "https://homecare-8d600-default-rtdb.firebaseio.com",
    projectId: "homecare-8d600",
    storageBucket: "homecare-8d600.firebasestorage.app",
    messagingSenderId: "1065295428987",
    appId: "1:1065295428987:web:01d0527238d162127311de",
    measurementId: "G-0DV6GLYRYS"
  };
  
  let state = {};
  let listeners = [];
  let firebaseReady = false;
  let db = null;
  let firebaseApp = null;

  // ---- Firebase Integration ----

  // Initialize Firebase
  async function initFirebase() {
    try {
      // Check if Firebase SDK is loaded
      if (typeof firebase !== 'undefined') {
        // Initialize Firebase app if not already initialized
        if (!firebase.apps.length) {
          firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
        } else {
          firebaseApp = firebase.apps[0];
        }
        db = firebase.database();
        firebaseReady = true;
        console.log('🔥 Firebase conectado:', FIREBASE_CONFIG.databaseURL);
        return true;
      } else {
        console.warn('⚠️ Firebase SDK não carregado. Usando localStorage como fallback.');
        return false;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao conectar Firebase:', error.message);
      console.warn('⚠️ Usando localStorage como fallback.');
      return false;
    }
  }

  // Sync state to Firebase
  async function syncToFirebase(path, data) {
    if (!firebaseReady || !db) return;
    try {
      if (path) {
        await db.ref(path).set(data);
      } else {
        await db.ref().set(data);
      }
    } catch (error) {
      console.warn('Firebase sync error:', error.message);
    }
  }

  // Load state from Firebase
  async function loadFromFirebase() {
    if (!firebaseReady || !db) return null;
    try {
      const snapshot = await db.ref().once('value');
      const data = snapshot.val();
      return data;
    } catch (error) {
      console.warn('Firebase load error:', error.message);
      return null;
    }
  }

  // Listen for real-time changes from Firebase
  function listenFirebase() {
    if (!firebaseReady || !db) return;
    db.ref().on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        state = data;
        saveLocal();
        notify('firebase_sync', state);
      }
    }, (error) => {
      console.warn('Firebase listener error:', error.message);
    });
  }

  // ---- LocalStorage Operations ----

  function saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Store: Failed to save to localStorage', e);
    }
  }

  function loadLocal() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('Store: Failed to load from localStorage', e);
      return null;
    }
  }

  // Reconcile and merge offline data with cloud data (Last-Write-Wins based on timestamps)
  function reconcileState(localState, fbState) {
    if (!localState) return fbState || {};
    if (!fbState) return localState || {};

    const mergedState = { ...fbState };
    const collections = [
      'patients', 'professionals', 'schedules', 'vitalSigns', 
      'evolutions', 'conversations', 'inventory', 'auditLog', 'alerts'
    ];

    collections.forEach(col => {
      const localItems = localState[col] || [];
      const fbItems = fbState[col] || [];
      const mergedItems = [...fbItems];

      localItems.forEach(localItem => {
        if (!localItem.id) return;
        
        const fbIndex = fbItems.findIndex(i => i.id === localItem.id);
        if (fbIndex === -1) {
          // New offline item, add to collection
          mergedItems.push(localItem);
        } else {
          const fbItem = fbItems[fbIndex];
          // Determine newest based on timestamp properties
          const localTime = localItem.updatedAt || localItem.timestamp || localItem.createdAt || '0';
          const fbTime = fbItem.updatedAt || fbItem.timestamp || fbItem.createdAt || '0';
          
          if (new Date(localTime) > new Date(fbTime)) {
            // Local is newer, overwrite the item in merged list
            const mergedIndex = mergedItems.findIndex(i => i.id === localItem.id);
            if (mergedIndex !== -1) {
              mergedItems[mergedIndex] = localItem;
            }
          }
        }
      });

      mergedState[col] = mergedItems;
    });

    // Merge settings and billing
    mergedState.settings = { ...(fbState.settings || {}), ...(localState.settings || {}) };
    mergedState.billing = { ...(fbState.billing || {}), ...(localState.billing || {}) };

    // Retain active currentUser session from local state
    if (localState.currentUser) {
      mergedState.currentUser = localState.currentUser;
    }

    return mergedState;
  }

  // ---- Core Initialization ----

  // Initialize state from Firebase, then localStorage, then defaults
  async function init(defaultData) {
    // Try to connect Firebase
    const fbConnected = await initFirebase();

    if (fbConnected) {
      // Try loading from Firebase first
      const fbData = await loadFromFirebase();
      const localData = loadLocal();

      if (fbData && Object.keys(fbData).length > 0) {
        state = reconcileState(localData, fbData);
        saveLocal();
        await syncToFirebase(null, state);
        console.log('✅ Dados carregados do Firebase e reconciliados com LocalStorage');
      } else {
        // Firebase is empty, seed it with default data or local data
        state = localData || { ...defaultData };
        await syncToFirebase(null, state);
        saveLocal();
        console.log('✅ Dados iniciais enviados ao Firebase');
      }
      // Start real-time listener
      listenFirebase();
    } else {
      // Firebase unavailable, use localStorage
      const localData = loadLocal();
      if (localData) {
        state = localData;
        console.log('✅ Dados carregados do localStorage (Modo Offline)');
      } else {
        state = { ...defaultData };
        saveLocal();
        console.log('✅ Dados padrão inicializados (Modo Offline)');
      }
    }

    return state;
  }

  // Save state to both localStorage and Firebase
  function save() {
    saveLocal();
    // Async Firebase sync (non-blocking)
    if (firebaseReady) {
      syncToFirebase(null, state).catch(() => {});
    }
  }

  // Save a specific path to Firebase (more efficient)
  function savePath(path) {
    saveLocal();
    if (firebaseReady) {
      const value = get(path);
      syncToFirebase(path, value).catch(() => {});
    }
  }

  // Get entire state or a specific key
  function get(key) {
    if (!key) return state;
    return key.split('.').reduce((obj, k) => obj?.[k], state);
  }

  // Set a value at a specific key path
  function set(key, value) {
    const keys = key.split('.');
    let obj = state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    save();
    notify(key, value);
  }

  // Subscribe to state changes
  function subscribe(callback) {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter(l => l !== callback);
    };
  }

  // Notify listeners
  function notify(key, value) {
    listeners.forEach(cb => {
      try {
        cb(key, value, state);
      } catch (e) {
        console.warn('Store listener error:', e);
      }
    });
  }

  // ---- CRUD Operations ----

  // Get all items from a collection
  function getAll(collection) {
    return state[collection] || [];
  }

  // Get item by ID
  function getById(collection, id) {
    return (state[collection] || []).find(item => item.id === id);
  }

  // Add item to collection
  function add(collection, item) {
    if (!state[collection]) state[collection] = [];
    const newItem = {
      ...item,
      id: item.id || generateId(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state[collection].push(newItem);
    savePath(collection);
    notify(collection, state[collection]);
    return newItem;
  }

  // Update item in collection
  function update(collection, id, updates) {
    const items = state[collection] || [];
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    savePath(collection);
    notify(collection, state[collection]);
    return items[index];
  }

  // Remove item from collection
  function remove(collection, id) {
    const items = state[collection] || [];
    state[collection] = items.filter(item => item.id !== id);
    savePath(collection);
    notify(collection, state[collection]);
  }

  // Filter items
  function filter(collection, predicate) {
    return (state[collection] || []).filter(predicate);
  }

  // Search items by text
  function search(collection, query, fields) {
    const q = query.toLowerCase().trim();
    if (!q) return state[collection] || [];
    return (state[collection] || []).filter(item =>
      fields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(q);
      })
    );
  }

  // Generate unique ID
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // Reset to default data
  async function reset(defaultData) {
    state = { ...defaultData };
    save();
    notify('reset', state);
  }

  // Add audit log entry
  function addAuditLog(action, details = {}) {
    const entry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      action,
      professional: state.currentUser?.name || 'Sistema',
      professionalRole: state.currentUser?.role || 'admin',
      ...details
    };
    if (!state.auditLog) state.auditLog = [];
    state.auditLog.unshift(entry);
    // Keep only last 500 entries
    if (state.auditLog.length > 500) {
      state.auditLog = state.auditLog.slice(0, 500);
    }
    savePath('auditLog');
    return entry;
  }

  // Check Firebase connection status
  function isFirebaseConnected() {
    return firebaseReady;
  }

  // Force resync with Firebase
  async function forceSync() {
    if (!firebaseReady) return false;
    try {
      await syncToFirebase(null, state);
      console.log('✅ Dados sincronizados com Firebase');
      return true;
    } catch (e) {
      console.warn('❌ Erro ao sincronizar:', e);
      return false;
    }
  }

  return {
    init,
    get,
    set,
    subscribe,
    getAll,
    getById,
    add,
    update,
    remove,
    filter,
    search,
    reset,
    addAuditLog,
    generateId,
    isFirebaseConnected,
    forceSync
  };
})();

// Export for modules
if (typeof module !== 'undefined') module.exports = Store;
