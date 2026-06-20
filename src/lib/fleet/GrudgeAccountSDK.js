/**
 * GrudgeAccountSDK — portable account + character module for all Grudge apps.
 * No framework dependency.
 */

import { fleetApiBase } from './config.js';

const TOKEN_KEY = 'grudge_auth_token';
const CHAR_ACTIVE = 'gruda_active_character';
const GRUDGE_ID_KEY = 'grudge_id';
const USERNAME_KEY = 'grudge_username';
const ACCOUNT_ID_KEY = 'grudge_account_id';
const POLL_MS = 60_000;

class _GrudgeAccountSDK {
  constructor() {
    this._apiBase = fleetApiBase();
    this._token = null;
    this._user = null;
    this._characters = [];
    this._activeId = null;
    this._callbacks = [];
    this._pollTimer = null;
    this._embedded = false;
    this._ready = false;
  }

  async init(apiBase) {
    if (apiBase !== undefined) this._apiBase = apiBase;
    this._token = this._readToken();
    this._activeId = this._readActiveId();
    if (this._token) await this.syncFromBackend();
    this._startPoll();
    this._dispatch('grudge:auth:ready');
    this._ready = true;
  }

  initEmbedded() {
    this._embedded = true;
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const urlToken = p.get('token');
      const urlChar = p.get('characterId');
      if (urlToken) { this._token = urlToken; this._saveToken(urlToken); }
      if (urlChar) { this._activeId = urlChar; this._saveActiveId(urlChar); }

      window.addEventListener('message', (e) => {
        if (e.data?.type !== 'GRUDGE_AUTH') return;
        const { token, characterId, grudgeId, username } = e.data;
        if (token) { this._token = token; this._saveToken(token); }
        if (characterId) { this._activeId = characterId; this._saveActiveId(characterId); }
        if (grudgeId) localStorage.setItem(GRUDGE_ID_KEY, grudgeId);
        if (username) localStorage.setItem(USERNAME_KEY, username);
        if (this._token) this.syncFromBackend();
        this._dispatch('grudge:auth:ready');
      });

      window.parent?.postMessage({ type: 'GRUDGE_READY' }, '*');
    }
    this._startPoll();
    this._ready = true;
  }

  _readToken() {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('grudge_session_token');
  }

  _saveToken(token) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('grudge_session_token', token);
  }

  _readActiveId() {
    if (typeof localStorage === 'undefined') return null;
    const grudgeId = localStorage.getItem(ACCOUNT_ID_KEY) || 'guest';
    const key = `${CHAR_ACTIVE}_${grudgeId}`;
    return localStorage.getItem(key) || localStorage.getItem(CHAR_ACTIVE);
  }

  _saveActiveId(id) {
    if (typeof localStorage === 'undefined') return;
    const grudgeId = localStorage.getItem(ACCOUNT_ID_KEY) || 'guest';
    localStorage.setItem(`${CHAR_ACTIVE}_${grudgeId}`, id);
    localStorage.setItem(CHAR_ACTIVE, id);
  }

  getToken() { return this._token || this._readToken(); }
  getUser() { return this._user; }
  getCharacters() { return this._characters; }
  getActiveId() { return this._activeId || this._readActiveId(); }

  getActiveCharacter() {
    const id = this.getActiveId();
    return id ? (this._characters.find((c) => c.id === id) ?? null) : null;
  }

  selectCharacter(id) {
    this._activeId = id;
    this._saveActiveId(id);
    const char = this._characters.find((c) => c.id === id) ?? null;
    this._notifyCallbacks(char);
    this._dispatch('grudge:character:selected', { characterId: id });
    if (this._embedded && typeof window !== 'undefined') {
      window.parent?.postMessage({ type: 'GRUDGE_CHARACTER_CHANGE', characterId: id }, '*');
    }
  }

  onCharacterChange(cb) {
    this._callbacks.push(cb);
    return () => { this._callbacks = this._callbacks.filter((f) => f !== cb); };
  }

  async syncFromBackend() {
    const token = this.getToken();
    if (!token) return;

    const headers = {
      Authorization: `Bearer ${token}`,
      'X-Session-Token': token,
      'Content-Type': 'application/json',
    };

    try {
      const userRes = await fetch(`${this._apiBase}/api/account`, { headers });
      if (userRes.ok) {
        const userData = await userRes.json();
        this._user = {
          grudgeId: userData.grudgeId || localStorage.getItem(GRUDGE_ID_KEY) || '',
          username: userData.username || localStorage.getItem(USERNAME_KEY) || '',
          displayName: userData.displayName,
          email: userData.email,
          gbuxBalance: Number(userData.gbuxBalance ?? 0),
          walletAddress: userData.walletAddress,
          isPremium: userData.isPremium,
        };
        if (this._user.grudgeId) localStorage.setItem(GRUDGE_ID_KEY, this._user.grudgeId);
      }

      const charRes = await fetch(`${this._apiBase}/api/characters`, { headers });
      if (charRes.ok) {
        const chars = await charRes.json();
        this._characters = chars;
        const stored = this.getActiveId();
        if (stored && chars.some((c) => c.id === stored)) {
          this._activeId = stored;
        } else if (chars.length > 0) {
          this._activeId = chars[0].id;
          this._saveActiveId(chars[0].id);
        }
        const activeChar = this.getActiveCharacter();
        this._notifyCallbacks(activeChar);
        this._dispatch('grudge:character:updated', { character: activeChar });
      }
      this._dispatch('grudge:sync:complete');
    } catch (err) {
      console.warn('[GrudgeAccountSDK] sync failed:', err);
    }
  }

  async createCharacter(data) {
    const token = this.getToken();
    if (!token) return null;
    const BASE = 10;
    const attrs = data.attributes ?? {
      Strength: BASE, Vitality: BASE, Endurance: BASE, Intellect: BASE,
      Wisdom: BASE, Dexterity: BASE, Agility: BASE, Tactics: BASE,
    };
    try {
      const res = await fetch(`${this._apiBase}/api/characters`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, attributes: attrs, gameOrigin: 'grudge-fleet' }),
      });
      if (!res.ok) return null;
      const created = await res.json();
      this._characters.push(created);
      this.selectCharacter(created.id);
      return created;
    } catch {
      return null;
    }
  }

  async mintCharacterCNFT(characterId, avatarUrl) {
    const token = this.getToken();
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch(`${this._apiBase}/api/characters/${characterId}/mint`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e?.message || 'Mint failed' };
    }
  }

  async ensureWallet() {
    const token = this.getToken();
    if (!token) return { error: 'Not authenticated' };
    try {
      const status = await fetch(`${this._apiBase}/api/wallet/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (status.ok) {
        const d = await status.json();
        if (d.walletAddress) return { walletAddress: d.walletAddress };
      }
      const create = await fetch(`${this._apiBase}/api/wallet/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!create.ok) return { error: 'Wallet creation failed' };
      const d = await create.json();
      return { walletAddress: d.walletAddress };
    } catch (e) {
      return { error: e?.message };
    }
  }

  async saveCharacter(id, updates) {
    const token = this.getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${this._apiBase}/api/characters/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      const updated = await res.json();
      this._characters = this._characters.map((c) => (c.id === id ? updated : c));
      if (id === this._activeId) {
        this._notifyCallbacks(updated);
        this._dispatch('grudge:character:updated', { character: updated });
      }
      return updated;
    } catch {
      return null;
    }
  }

  _notifyCallbacks(char) {
    this._callbacks.forEach((cb) => { try { cb(char); } catch { /* noop */ } });
  }

  _dispatch(name, detail) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    }
  }

  _startPoll() {
    if (this._pollTimer || typeof setInterval === 'undefined') return;
    this._pollTimer = setInterval(() => {
      if (this.getToken()) this.syncFromBackend();
    }, POLL_MS);
  }

  destroy() {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    this._callbacks = [];
  }
}

export const GrudgeAccountSDK = new _GrudgeAccountSDK();