import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';

// Define the structure of our global store
interface GlobalState {
  // Authentication state
  auth: {
    user: any | null;
    session: any | null;
    isLoading: boolean;
    error: string | null;
  };

  // User profile
  profile: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    language: string;
    syncStatus: 'idle' | 'syncing' | 'offline';
  };

  // App state
  app: {
    currentScreen: string;
    isOnline: boolean;
    networkConnection: string;
    permissions: {
      camera: boolean;
      location: boolean;
      microphone: boolean;
      storage: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    language: string;
  };

  // AR state
  ar: {
    isActive: boolean;
    cameraPermissions: boolean;
    locationPermissions: boolean;
    currentLocation: {
      latitude: number;
      longitude: number;
      altitude?: number;
      accuracy?: number;
    } | null;
    heading: number;
    nearbyContent: any[];
    selectedContent: any | null;
    isPlacingContent: boolean;
    placementMode: 'marker' | 'object' | 'text' | null;
  };

  // Local AR content (for offline-first approach)
  localContent: {
    userContent: any[];
    publicContent: any[];
    pendingSync: any[];
    lastSync: string | null;
  };

  // UI state
  ui: {
    isLoading: boolean;
    errorMessage: string | null;
    successMessage: string | null;
    modalState: {
      isVisible: boolean;
      type: string;
      data: any;
    };
    tabNavigation: {
      activeTab: string;
    };
  };
}

// Create the observable store
export const globalStore = observable<GlobalState>({
  // Authentication state
  auth: {
    user: null,
    session: null,
    isLoading: false,
    error: null,
  },

  // User profile
  profile: {
    id: '',
    email: '',
    name: '',
    avatar: null,
    language: 'en',
    syncStatus: 'idle',
  },

  // App state
  app: {
    currentScreen: 'home',
    isOnline: true,
    networkConnection: 'unknown',
    permissions: {
      camera: false,
      location: false,
      microphone: false,
      storage: false,
    },
    theme: 'system',
    language: 'en',
  },

  // AR state
  ar: {
    isActive: false,
    cameraPermissions: false,
    locationPermissions: false,
    currentLocation: null,
    heading: 0,
    nearbyContent: [],
    selectedContent: null,
    isPlacingContent: false,
    placementMode: null,
  },

  // Local AR content
  localContent: {
    userContent: [],
    publicContent: [],
    pendingSync: [],
    lastSync: null,
  },

  // UI state
  ui: {
    isLoading: false,
    errorMessage: null,
    successMessage: null,
    modalState: {
      isVisible: false,
      type: '',
      data: null,
    },
    tabNavigation: {
      activeTab: 'home',
    },
  },
});

// Computed values and utilities
export const storeUtils = {
  // Authentication helpers
  isAuthenticated: () => globalStore.auth.user.get() !== null,

  // Profile helpers
  getUserName: () => globalStore.profile.name.get() || 'User',

  getUserAvatar: () => globalStore.profile.avatar.get(),

  // AR helpers
  isARReady: () => globalStore.ar.cameraPermissions.get() && globalStore.ar.locationPermissions.get() && globalStore.ar.currentLocation.get() !== null,

  // Location helpers
  getCurrentCoordinates: () => ({
    latitude: globalStore.ar.currentLocation.get()?.latitude || 0,
    longitude: globalStore.ar.currentLocation.get()?.longitude || 0,
  }),

  // Content helpers
  getTotalUserContent: () => globalStore.localContent.userContent.get().length,

  getNearbyContentCount: () => globalStore.ar.nearbyContent.get().length,

  // Network helpers
  isOfflineFirstReady: () => globalStore.app.isOnline.get() && globalStore.profile.syncStatus.get() !== 'syncing',

  // UI helpers
  showError: (message: string) => {
    globalStore.ui.errorMessage.set(message);
    setTimeout(() => globalStore.ui.errorMessage.set(null), 500);
  },

  showSuccess: (message: string) => {
    globalStore.ui.successMessage.set(message);
    setTimeout(() => globalStore.ui.successMessage.set(null), 300);
  },

  setLoading: (loading: boolean) => globalStore.ui.isLoading.set(loading),

  // Modal helpers
  showModal: (type: string, data: any = null) => {
    globalStore.ui.modalState.set({
      isVisible: true,
      type,
      data,
    });
  },

  hideModal: () => {
    globalStore.ui.modalState.isVisible.set(false);
  },
};

// Actions for complex state updates
export const storeActions = {
  // Auth actions
  setUser: (user: any, session: any = null) => {
    globalStore.auth.user.set(user);
    globalStore.auth.session.set(session);
    globalStore.auth.error.set(null);
    if (user) {
      globalStore.profile.id.set(user.id);
      globalStore.profile.email.set(user.email);
    }
  },

  setAuthError: (error: string) => {
    globalStore.auth.error.set(error);
    globalStore.auth.isLoading.set(false);
  },

  setAuthLoading: (loading: boolean) => {
    globalStore.auth.isLoading.set(loading);
  },

  // Profile actions
  updateProfile: (updates: Partial<GlobalState['profile']>) => {
    Object.entries(updates).forEach(([key, value]) => {
      if (key in globalStore.profile) {
        (globalStore.profile as any)[key].set(value);
      }
    });
  },

  // App actions
  setOnlineStatus: (isOnline: boolean) => {
    globalStore.app.isOnline.set(isOnline);
  },

  setPermissions: (permissions: Partial<GlobalState['app']['permissions']>) => {
    Object.entries(permissions).forEach(([key, value]) => {
      if (key in globalStore.app.permissions) {
        (globalStore.app.permissions as any)[key].set(value);
      }
    });
  },

  // AR actions
  setARPermissions: (cameraGranted: boolean, locationGranted: boolean) => {
    globalStore.ar.cameraPermissions.set(cameraGranted);
    globalStore.ar.locationPermissions.set(locationGranted);
  },

  setLocation: (location: GlobalState['ar']['currentLocation']) => {
    globalStore.ar.currentLocation.set(location);
  },

  setHeading: (heading: number) => {
    globalStore.ar.heading.set(heading);
  },

  updateNearbyContent: (content: any[]) => {
    globalStore.ar.nearbyContent.set(content);
  },

  selectARContent: (content: any | null) => {
    globalStore.ar.selectedContent.set(content);
  },

  setPlacementMode: (mode: GlobalState['ar']['placementMode']) => {
    globalStore.ar.placementMode.set(mode);
    globalStore.ar.isPlacingContent.set(mode !== null);
  },

  // Content actions
  addLocalContent: (content: any) => {
    globalStore.localContent.userContent.push(content);
  },

  updateLocalContent: (id: string, updates: any) => {
    const index = globalStore.localContent.userContent.findIndex(item => item.id === id);
    if (index >= 0) {
      globalStore.localContent.userContent[index].set({
        ...globalStore.localContent.userContent[index].get(),
        ...updates,
      });
    }
  },

  removeLocalContent: (id: string) => {
    const index = globalStore.localContent.userContent.findIndex(item => item.id === id);
    if (index >= 0) {
      globalStore.localContent.userContent.splice(index, 1);
    }
  },

  addPendingSync: (content: any) => {
    globalStore.localContent.pendingSync.push(content);
  },

  clearPendingSync: () => {
    globalStore.localContent.pendingSync.set([]);
  },

  // Sync actions
  setSyncStatus: (status: GlobalState['profile']['syncStatus']) => {
    globalStore.profile.syncStatus.set(status);
  },

  updateLastSync: () => {
    globalStore.localContent.lastSync.set(new Date().toISOString());
  },

  // UI actions
  setCurrentScreen: (screen: string) => {
    globalStore.app.currentScreen.set(screen);
  },

  setActiveTab: (tab: string) => {
    globalStore.ui.tabNavigation.activeTab.set(tab);
  },
};