Below is API-style documentation for the provided TypeScript module. It is written for developers consuming or extending the global state in a React / React Native application using Legend State.

Global Store API Documentation

This module defines a global observable state, along with selectors (utilities) and actions for managing authentication, user profile, application state, AR features, offline-first content, and UI state.

It is designed for:

Centralized state management

Offline-first and AR-enabled apps

Predictable, reactive updates via @legendapp/state

Overview
Exports
Export	Description
globalStore	The root observable store containing all application state
storeUtils	Read-only helpers and computed utilities
storeActions	Mutating actions for complex or multi-field updates
Global State Structure

The GlobalState interface defines the full shape of the store. Each state slice has a clear responsibility.

State Slices
auth — Authentication State

Purpose:
Tracks authentication lifecycle, current user, and auth-related errors.

Fields

user: Authenticated user object or null

session: Session/token object or null

isLoading: Auth request in progress

error: Auth error message

Typical Usage

Login / logout flows

Session restoration

Error handling for auth APIs

profile — User Profile

Purpose:
Stores user metadata and sync-related information.

Fields

id: User identifier

email: User email

name: Display name

avatar: Avatar URL or null

language: Preferred language code

syncStatus: 'idle' | 'syncing' | 'offline'

Typical Usage

Profile screens

Localization

Sync state indicators

app — Application State

Purpose:
Tracks global app-level configuration and environment state.

Fields

currentScreen: Current route or screen key

isOnline: Network connectivity status

networkConnection: Connection type (wifi, cellular, etc.)

permissions: Camera, location, microphone, storage

theme: 'light' | 'dark' | 'system'

language: App UI language

Typical Usage

Navigation

Theming

Permission gating

Offline/online behavior

ar — Augmented Reality State

Purpose:
Manages AR session lifecycle, device sensors, and AR content.

Fields

isActive: Whether AR mode is active

cameraPermissions: Camera permission granted

locationPermissions: Location permission granted

currentLocation: GPS coordinates or null

heading: Compass heading

nearbyContent: AR content near the user

selectedContent: Currently selected AR item

isPlacingContent: Whether user is placing content

placementMode: 'marker' | 'object' | 'text' | null

Typical Usage

AR scene rendering

Content placement workflows

Sensor-driven updates

localContent — Offline-First AR Content

Purpose:
Stores local and pending AR content for offline-first operation.

Fields

userContent: Locally created content

publicContent: Cached public content

pendingSync: Content waiting to sync

lastSync: ISO timestamp of last successful sync

Typical Usage

Offline creation

Conflict resolution

Background sync queues

ui — UI State

Purpose:
Manages transient UI concerns and feedback.

Fields

isLoading: Global loading indicator

errorMessage: Error toast/message

successMessage: Success toast/message

modalState: Modal visibility and payload

tabNavigation.activeTab: Current tab key

Typical Usage

Loading spinners

Toast notifications

Modals and tab navigation

Store Utilities (storeUtils)

Utilities are read-only helpers and computed values.
They should be used in components instead of duplicating logic.

Authentication Utilities
isAuthenticated(): boolean

Returns true if a user is logged in.

if (storeUtils.isAuthenticated()) {
  // show protected content
}
Profile Utilities
getUserName(): string

Returns the user’s name or "User" as a fallback.

getUserAvatar(): string | null

Returns the avatar URL.

AR Utilities
isARReady(): boolean

Checks if AR can start (permissions + location available).

const canStartAR = storeUtils.isARReady();
Location Utilities
getCurrentCoordinates()

Returns latitude and longitude with safe fallbacks.

const { latitude, longitude } = storeUtils.getCurrentCoordinates();
Content Utilities
getTotalUserContent(): number

Number of locally created AR items.

getNearbyContentCount(): number

Count of nearby AR content.

Network Utilities
isOfflineFirstReady(): boolean

Returns true when:

App is online

Profile is not currently syncing

UI Utilities
showError(message: string)

Shows a temporary error message.

showSuccess(message: string)

Shows a temporary success message.

setLoading(loading: boolean)

Toggles global loading state.

Modal Utilities
showModal(type: string, data?: any)

Displays a modal with payload.

hideModal()

Hides the active modal.

Store Actions (storeActions)

Actions mutate state and encapsulate multi-field or business logic updates.
Components should prefer actions over direct state mutation.

Authentication Actions
setUser(user, session?)

Use after successful login or session restoration.

storeActions.setUser(user, session);
setAuthError(error: string)

Use when authentication fails.

setAuthLoading(loading: boolean)

Use during async auth operations.

Profile Actions
updateProfile(updates)

Partially updates profile fields.

storeActions.updateProfile({ name: 'Ana', language: 'hr' });
App Actions
setOnlineStatus(isOnline: boolean)

Update network connectivity status.

setPermissions(permissions)

Update one or more app permissions.

storeActions.setPermissions({ camera: true, location: true });
AR Actions
setARPermissions(cameraGranted, locationGranted)

Update AR permission state.

setLocation(location)

Update current GPS location.

setHeading(heading)

Update compass heading.

updateNearbyContent(content[])

Replace nearby AR content list.

selectARContent(content | null)

Select or deselect AR content.

setPlacementMode(mode)

Enable or disable AR placement mode.

Local Content Actions
addLocalContent(content)

Add newly created AR content.

updateLocalContent(id, updates)

Update a local content item by ID.

removeLocalContent(id)

Delete a local content item.

addPendingSync(content)

Queue content for sync.

clearPendingSync()

Clear sync queue after successful sync.

Sync Actions
setSyncStatus(status)

Update profile sync status.

updateLastSync()

Store current timestamp as last sync time.

UI Actions
setCurrentScreen(screen)

Update current screen identifier.

setActiveTab(tab)

Switch active tab.

Component Usage Examples
Reading State in a Component
import { useSelector } from '@legendapp/state/react';
import { globalStore, storeUtils } from './store';

function ProfileHeader() {
  const name = useSelector(globalStore.profile.name);
  const avatar = storeUtils.getUserAvatar();

  return <Header title={name} avatar={avatar} />;
}
Triggering Actions
async function login() {
  storeActions.setAuthLoading(true);

  try {
    const { user, session } = await api.login();
    storeActions.setUser(user, session);
    storeUtils.showSuccess('Welcome back!');
  } catch (e) {
    storeActions.setAuthError('Login failed');
  }
}
AR Flow Example
if (storeUtils.isARReady()) {
  storeActions.setPlacementMode('object');
}
Design Notes

Observable-first: All state is reactive and granular

Offline-first ready: Local content and sync queues are first-class

Action-driven mutations: Reduces bugs and improves maintainability

UI state isolated: Prevents business logic from leaking into components

This store is suitable as a single source of truth for medium-to-large React / React Native applications with AR and offline requirements.