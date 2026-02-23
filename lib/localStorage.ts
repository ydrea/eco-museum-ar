import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const CACHE_KEYS = {
  SYNC_STATUS: 'sync_status',
  CONTENT_CACHE: 'content_cache',
  USER_CONTENT: 'user_content',
  PUBLIC_CONTENT: 'public_content',
  USER_PROFILE: 'user_profile',
  SETTINGS: 'settings',
} as const;

// Types
interface SyncStatus {
  last_sync: string | null;
  pending_uploads: string[];
  pending_deletions: string[];
  is_online: boolean;
}

interface ContentItem {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: 'marker' | 'object' | 'text' | 'audio' | 'model';
  position_lat: number;
  position_lng: number;
  position_alt?: number;
  data: any;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  sync_status?: 'pending' | 'synced' | 'failed';
  local_id?: string;
}

// Sync Storage - manages sync state
export const syncStorage = {
  async saveSyncStatus(status: Partial<SyncStatus>): Promise<void> {
    try {
      const current = await this.getSyncStatus();
      const updated = { ...current, ...status };
      await AsyncStorage.setItem(CACHE_KEYS.SYNC_STATUS, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save sync status:', error);
    }
  },

  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEYS.SYNC_STATUS);
      return data ? JSON.parse(data) : {
        last_sync: null,
        pending_uploads: [],
        pending_deletions: [],
        is_online: true,
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return {
        last_sync: null,
        pending_uploads: [],
        pending_deletions: [],
        is_online: true,
      };
    }
  },

  async updateLastSync(): Promise<void> {
    await this.saveSyncStatus({ last_sync: new Date().toISOString() });
  },

  async addPendingUpload(contentId: string): Promise<void> {
    const status = await this.getSyncStatus();
    if (!status.pending_uploads.includes(contentId)) {
      status.pending_uploads.push(contentId);
      await this.saveSyncStatus(status);
    }
  },

  async addPendingDeletion(contentId: string): Promise<void> {
    const status = await this.getSyncStatus();
    if (!status.pending_deletions.includes(contentId)) {
      status.pending_deletions.push(contentId);
      await this.saveSyncStatus(status);
    }
  },

  async removeFromPending(contentId: string): Promise<void> {
    const status = await this.getSyncStatus();
    status.pending_uploads = status.pending_uploads.filter(id => id !== contentId);
    status.pending_deletions = status.pending_deletions.filter(id => id !== contentId);
    await this.saveSyncStatus(status);
  },
};

// Content Storage - manages user's AR content
export const contentStorage = {
  async saveContent(content: ContentItem): Promise<void> {
    try {
      const key = `${CACHE_KEYS.USER_CONTENT}_${content.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(content));
    } catch (error) {
      console.error('Failed to save content:', error);
      throw error;
    }
  },

  async getAllContent(): Promise<ContentItem[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const contentKeys = keys.filter(key => key.startsWith(`${CACHE_KEYS.USER_CONTENT}_`));

      const content: ContentItem[] = [];
      for (const key of contentKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          content.push(JSON.parse(data));
        }
      }

      return content.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Failed to get all content:', error);
      return [];
    }
  },

  async getContentById(id: string): Promise<ContentItem | null> {
    try {
      const data = await AsyncStorage.getItem(`${CACHE_KEYS.USER_CONTENT}_${id}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get content by ID:', error);
      return null;
    }
  },

  async getPendingSyncContent(): Promise<ContentItem[]> {
    const allContent = await this.getAllContent();
    return allContent.filter(content => content.sync_status === 'pending');
  },

  async updateSyncStatus(id: string, status: 'pending' | 'synced' | 'failed'): Promise<void> {
    const content = await this.getContentById(id);
    if (content) {
      content.sync_status = status;
      await this.saveContent(content);
    }
  },

  async deleteContent(id: string): Promise<void> {
    try {
      const key = `${CACHE_KEYS.USER_CONTENT}_${id}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to delete content:', error);
      throw error;
    }
  },

  async getContentNearLocation(latitude: number, longitude: number, radiusKm: number = 10): Promise<ContentItem[]> {
    const allContent = await this.getAllContent();

    return allContent.filter(content => {
      // Simple distance calculation (not Haversine, but good enough for basic filtering)
      const distance = Math.sqrt(
        Math.pow(content.position_lat - latitude, 2) +
        Math.pow(content.position_lng - longitude, 2)
      ) * 111; // Rough km conversion

      return distance <= radiusKm;
    });
  },
};

// Cache Storage - manages cached public content
export const cacheStorage = {
  async saveContentCache(contents: ContentItem[], maxAge: number = 24 * 60 * 60 * 100): Promise<void> {
    try {
      const cacheData = {
        contents,
        timestamp: Date.now(),
        maxAge,
      };
      await AsyncStorage.setItem(CACHE_KEYS.CONTENT_CACHE, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save content cache:', error);
      throw error;
    }
  },

  async getContentCache(): Promise<ContentItem[]> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEYS.CONTENT_CACHE);
      if (!data) return [];

      const cacheData = JSON.parse(data);

      // Check if cache is expired
      if (Date.now() - cacheData.timestamp > cacheData.maxAge) {
        await this.clearContentCache();
        return [];
      }

      return cacheData.contents || [];
    } catch (error) {
      console.error('Failed to get content cache:', error);
      return [];
    }
  },

  async clearContentCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEYS.CONTENT_CACHE);
    } catch (error) {
      console.error('Failed to clear content cache:', error);
    }
  },

  async isCacheValid(): Promise<boolean> {
    const cache = await this.getContentCache();
    return cache.length > ;
  },
};

// User Storage - manages user profile and preferences
export const userStorage = {
  async saveProfile(profile: any): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save user profile:', error);
      throw error;
    }
  },

  async getProfile(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  },

  async updateProfile(updates: Partial<any>): Promise<void> {
    const current = await this.getProfile();
    const updated = { ...current, ...updates };
    await this.saveProfile(updated);
  },

  async saveSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  },

  async getSettings(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {
        theme: 'system',
        language: 'en',
        autoSync: true,
        offlineMode: false,
      };
    } catch (error) {
      console.error('Failed to get settings:', error);
      return {
        theme: 'system',
        language: 'en',
        autoSync: true,
        offlineMode: false,
      };
    }
  },

  async updateSettings(updates: Partial<any>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };
    await this.saveSettings(updated);
  },
};

// Cache management utilities
export const storageUtils = {
  async clearAllData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const ecomuseumKeys = keys.filter(key => key.includes('USER_CONTENT') || key.includes('CONTENT_CACHE'));
      await AsyncStorage.multiRemove(ecomuseumKeys);
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  },

  async getStorageInfo(): Promise<{ size: number; entries: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = ;

      for (const key of keys) {
        if (key.includes('USER_CONTENT') || key.includes('CONTENT_CACHE')) {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }

      return {
        size: totalSize,
        entries: keys.length,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { size: , entries:  };
    }
  },

  async cleanupOldContent(maxAge: number = 30 * 24 * 60 * 60 * 100): Promise<number> {
    try {
      const allContent = await contentStorage.getAllContent();
      const cutoffDate = new Date(Date.now() - maxAge);

      let removedCount = ;

      for (const content of allContent) {
        if (new Date(content.created_at) < cutoffDate && content.sync_status === 'synced') {
          await contentStorage.deleteContent(content.id);
          removedCount++;
        }
      }

      return removedCount;
    } catch (error) {
      console.error('Failed to cleanup old content:', error);
      return ;
    }
  },
};