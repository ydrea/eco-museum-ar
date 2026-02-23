import NetInfo from '@react-native-community/netinfo';
import { supabase, arContentUtils } from './supabase';
import { globalStore, storeActions } from '../store/globalStore';
import { syncStorage, contentStorage, userStorage, cacheStorage } from './localStorage';

// Types for sync operations
interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  failed: number;
  errors: string[];
}

export class SyncManager {
  private static instance: SyncManager;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;

  private constructor() {
    this.initNetworkListener();
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  private initNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Update store
      storeActions.setOnlineStatus(this.isOnline);

      // If coming back online, trigger sync if auto-sync is enabled
      if (!wasOnline && this.isOnline) {
        this.triggerAutoSync();
      }
    });
  }

  private async triggerAutoSync(): Promise<void> {
    const settings = await syncStorage.getSyncStatus();
    if (settings.is_online) {
      // Auto-sync is enabled, perform sync
      try {
        await this.syncContent();
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }
  }

  // Main sync function
  public async syncContent(): Promise<SyncResult> {
    if (this.isSyncing || !this.isOnline) {
      return { success: false, uploaded: , downloaded: , failed: , errors: ['Sync already in progress or offline'] };
    }

    this.isSyncing = true;
    storeActions.setSyncStatus('syncing');

    const result: SyncResult = {
      success: true,
      uploaded: ,
      downloaded: ,
      failed: ,
      errors: [],
    };

    try {
      // 1. Upload pending local content
      await this.uploadPendingContent(result);

      // 2. Download remote content (user's and nearby public)
      await this.downloadRemoteContent(result);

      // 3. Update sync status
      await syncStorage.updateLastSync();

      result.success = result.errors.length === ;

    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message || 'Unknown sync error');
    } finally {
      this.isSyncing = false;
      storeActions.setSyncStatus(this.isOnline ? 'idle' : 'offline');
    }

    return result;
  }

  // Upload pending local content to Supabase
  private async uploadPendingContent(result: SyncResult): Promise<void> {
    const pendingContent = await contentStorage.getPendingSyncContent();

    for (const content of pendingContent) {
      try {
        const { error } = await arContentUtils.createARContent({
          title: content.title,
          description: content.description,
          type: content.type,
          position_lat: content.position_lat,
          position_lng: content.position_lng,
          position_alt: content.position_alt,
          data: content.data,
          is_public: content.is_public,
        });

        if (error) throw error;

        // Mark as synced locally
        await contentStorage.updateSyncStatus(content.id, 'synced');
        await syncStorage.removeFromPending(content.id);
        result.uploaded++;

      } catch (error: any) {
        console.error(`Failed to upload content ${content.id}:`, error);
        await contentStorage.updateSyncStatus(content.id, 'failed');
        result.failed++;
        result.errors.push(`Upload failed for ${content.title}: ${error.message}`);
      }
    }
  }

  // Download remote content
  private async downloadRemoteContent(result: SyncResult): Promise<void> {
    try {
      // Get user's content from remote
      const { data: userContent, error: userError } = await arContentUtils.getUserARContent();
      if (userError) throw userError;

      if (userContent) {
        // Merge with local content
        await this.mergeRemoteContent(userContent);
        result.downloaded += userContent.length;

        // Update store
        storeActions.updateLocalContent(userContent);
      }

      // Get nearby public content if we have location
      const currentLocation = globalStore.ar.currentLocation.get();
      if (currentLocation) {
        const { data: nearbyContent, error: nearbyError } = await arContentUtils.getNearbyPublicARContent(
          currentLocation.latitude,
          currentLocation.longitude
        );

        if (!nearbyError && nearbyContent) {
          await this.mergePublicContent(nearbyContent);
          storeActions.updateNearbyContent(nearbyContent);
        }
      }

    } catch (error: any) {
      result.errors.push(`Download failed: ${error.message}`);
    }
  }

  // Merge remote user content with local
  private async mergeRemoteContent(remoteContent: any[]): Promise<void> {
    const localContent = await contentStorage.getAllContent();
    const localContentMap = new Map(localContent.map(c => [c.id, c]));

    for (const remote of remoteContent) {
      const local = localContentMap.get(remote.id);

      if (!local || new Date(remote.updated_at) > new Date(local.updated_at)) {
        // Remote is newer or doesn't exist locally
        await contentStorage.saveContent({
          ...remote,
          sync_status: 'synced',
        });
      }
    }
  }

  // Cache nearby public content
  private async mergePublicContent(publicContent: any[]): Promise<void> {
    // Store public content in cache for offline access
    await cacheStorage.saveContentCache(publicContent);
  }

  // Create new AR content locally
  public async createLocalContent(content: Omit<any, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<any> {
    const user = globalStore.auth.user.get();
    if (!user) throw new Error('User not authenticated');

    const localContentId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newContent = {
      ...content,
      id: localContentId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: 'pending' as const,
      local_id: localContentId,
    };

    // Save locally
    await contentStorage.saveContent(newContent);

    // Add to pending sync
    await syncStorage.addPendingUpload(localContentId);

    // Update store
    storeActions.addLocalContent(newContent);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncContent().catch(error => console.error('Immediate sync failed:', error));
    }

    return newContent;
  }

  // Delete content (add to pending deletions)
  public async deleteContent(contentId: string): Promise<void> {
    // Add to pending deletions
    await syncStorage.addPendingDeletion(contentId);

    // Mark as failed locally so it doesn't appear in UI
    await contentStorage.updateSyncStatus(contentId, 'failed');

    // Remove from store
    storeActions.removeLocalContent(contentId);

    // If online, sync deletion immediately
    if (this.isOnline) {
      try {
        await arContentUtils.deleteARContent(contentId);
        await syncStorage.removeFromPending(contentId);
      } catch (error) {
        console.error('Immediate deletion sync failed:', error);
      }
    }
  }

  // Get all available content (local + cached)
  public async getAllAvailableContent(): Promise<any[]> {
    const localContent = await contentStorage.getAllContent();
    const user = globalStore.auth.user.get();

    // Filter for user's content and public cached content
    const userContent = localContent.filter(c =>
      c.user_id === user?.id ||
      c.sync_status !== 'failed'
    );

    // Add cached public content
    const cachedPublic = await cacheStorage.getContentCache();

    return [...userContent, ...cachedPublic];
  }

  // Manual sync trigger
  public async manualSync(): Promise<SyncResult> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    return this.syncContent();
  }

  // Reset sync state (useful for troubleshooting)
  public async resetSyncState(): Promise<void> {
    await syncStorage.saveSyncStatus({
      last_sync: null,
      pending_uploads: [],
      pending_deletions: [],
      is_online: this.isOnline,
    });
  }

  // Check sync status
  public getSyncStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
    };
  }
}

// Export singleton instance
export const syncManager = SyncManager.getInstance();