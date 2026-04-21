import AsyncStorage from '@react-native-async-storage/async-storage';

// Crie um app em https://developer.spotify.com/dashboard
// Redirect URI: focus://spotify-callback
export const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';

export const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'user-read-email',
];

const KEYS = {
  access: 'spotify_access_token',
  refresh: 'spotify_refresh_token',
  expiry: 'spotify_expiry',
};

export async function saveSpotifySession(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
) {
  const expiry = Date.now() + expiresIn * 1000;
  await AsyncStorage.multiSet([
    [KEYS.access, accessToken],
    [KEYS.refresh, refreshToken],
    [KEYS.expiry, expiry.toString()],
  ]);
}

export async function getSpotifyAccessToken(): Promise<string | null> {
  const [access, expiryStr, refresh] = await AsyncStorage.multiGet([
    KEYS.access,
    KEYS.expiry,
    KEYS.refresh,
  ]).then((r) => r.map(([, v]) => v));

  if (!access) return null;

  if (expiryStr && Date.now() < parseInt(expiryStr) - 60_000) return access;

  if (!refresh) {
    await clearSpotifySession();
    return null;
  }

  // refresh token
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh,
        client_id: SPOTIFY_CLIENT_ID,
      }).toString(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    await saveSpotifySession(
      json.access_token,
      json.refresh_token ?? refresh,
      json.expires_in,
    );
    return json.access_token as string;
  } catch {
    await clearSpotifySession();
    return null;
  }
}

export async function clearSpotifySession() {
  await AsyncStorage.multiRemove([KEYS.access, KEYS.refresh, KEYS.expiry]);
}

async function spotifyFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getSpotifyAccessToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });

  if (res.status === 204 || res.status === 202) return {} as T;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message ?? `Spotify ${res.status}`);
  }
  return res.json();
}

export interface SpotifyTrack {
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  uri: string;
}

export interface SpotifyPlaybackState {
  is_playing: boolean;
  item: SpotifyTrack | null;
  progress_ms: number;
  device: { name: string; volume_percent: number } | null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  uri: string;
  images: { url: string }[];
  description: string;
}

export const spotifyApi = {
  getPlayback: () =>
    spotifyFetch<SpotifyPlaybackState>('/me/player'),
  play: (contextUri?: string) =>
    spotifyFetch<void>('/me/player/play', {
      method: 'PUT',
      body: contextUri ? JSON.stringify({ context_uri: contextUri }) : undefined,
    }),
  pause: () => spotifyFetch<void>('/me/player/pause', { method: 'PUT' }),
  next: () => spotifyFetch<void>('/me/player/next', { method: 'POST' }),
  prev: () => spotifyFetch<void>('/me/player/previous', { method: 'POST' }),
  searchPlaylists: (query: string) =>
    spotifyFetch<{ playlists: { items: SpotifyPlaylist[] } }>(
      `/search?q=${encodeURIComponent(query)}&type=playlist&limit=6`,
    ),
  getMe: () => spotifyFetch<{ display_name: string; id: string }>('/me'),
};
