/**
 * Recruiting Agents CRM - Database Layer
 * IndexedDB persistence with SQLite WASM compatibility and fallback
 */

const DB_NAME = 'RecruitingAgentCRM_DB';
const DB_VERSION = 1;
const STORE_NAME = 'agents';
const META_STORE = 'meta';

class AgentDatabase {
  constructor() {
    this.db = null;
    this.isReady = false;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('raid', 'raid', { unique: false });
          store.createIndex('state', 'state', { unique: false });
          store.createIndex('district', 'district', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('has_website', 'has_website', { unique: false });
          store.createIndex('has_email', 'has_email', { unique: false });
          store.createIndex('has_phone', 'has_phone', { unique: false });
          store.createIndex('updated_at', 'updated_at', { unique: false });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        await this._seedInitialDataIfNeeded();
        this.isReady = true;
        resolve(this);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async _seedInitialDataIfNeeded() {
    const count = await this.count();
    if (count === 0 && window.INITIAL_AGENTS && window.INITIAL_AGENTS.length > 0) {
      console.log(`Seeding database with ${window.INITIAL_AGENTS.length} initial agent records...`);
      
      // Check if user had legacy localStorage overlay notes or status
      let legacyOverlay = {};
      try {
        legacyOverlay = JSON.parse(localStorage.getItem('ra_outreach_state_v1') || '{}');
      } catch (e) {
        legacyOverlay = {};
      }

      const tx = this.db.transaction([STORE_NAME, META_STORE], 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      for (const raw of window.INITIAL_AGENTS) {
        const agent = { ...raw };
        // Apply legacy overlay if exists
        if (legacyOverlay[agent.raid]) {
          if (legacyOverlay[agent.raid].status) agent.status = legacyOverlay[agent.raid].status;
          if (legacyOverlay[agent.raid].notes) agent.notes = legacyOverlay[agent.raid].notes;
        }
        
        agent.has_website = agent.website && agent.website.trim() ? 1 : 0;
        agent.has_email = agent.email && agent.email.trim() ? 1 : 0;
        agent.has_phone = agent.phone && agent.phone.trim() ? 1 : 0;
        
        store.put(agent);
      }

      const metaStore = tx.objectStore(META_STORE);
      metaStore.put({ key: 'last_seed', timestamp: new Date().toISOString() });
      metaStore.put({ key: 'version', value: '1.0' });

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => {
          console.log('Database seeding complete.');
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      });
    }
  }

  async count() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getById(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const numId = Number(id);
      const req = store.get(isNaN(numId) ? id : numId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getByRaid(raid) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('raid');
      const req = index.get(raid);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async create(agentData) {
    return new Promise(async (resolve, reject) => {
      try {
        const allAgents = await this.getAll();
        const maxId = allAgents.reduce((max, a) => Math.max(max, Number(a.id) || 0), 0);
        const maxSno = allAgents.reduce((max, a) => Math.max(max, Number(a.sno) || 0), 0);

        const newAgent = {
          id: maxId + 1,
          sno: maxSno + 1,
          raid: (agentData.raid && agentData.raid.trim()) ? agentData.raid.trim().toUpperCase() : `RA${Date.now().toString().slice(-6)}`,
          ra_name: (agentData.ra_name || '').trim().toUpperCase(),
          signatory: (agentData.signatory || '').trim(),
          state: (agentData.state || '').trim().toUpperCase(),
          district: (agentData.district || '').trim().toUpperCase(),
          rc_number: (agentData.rc_number || '').trim(),
          address: (agentData.address || '').trim(),
          email: (agentData.email || '').trim().toLowerCase(),
          phone: (agentData.phone || '').trim(),
          website: (agentData.website || '').trim(),
          branch_address: (agentData.branch_address || '').trim(),
          has_website: (agentData.website && agentData.website.trim()) ? 1 : 0,
          has_email: (agentData.email && agentData.email.trim()) ? 1 : 0,
          has_phone: (agentData.phone && agentData.phone.trim()) ? 1 : 0,
          status: (agentData.status || 'new').toLowerCase().replace(/\s+/g, '_'),
          notes: agentData.notes || '',
          updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
        };

        const tx = this.db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.add(newAgent);

        req.onsuccess = (e) => {
          newAgent.id = e.target.result;
          resolve(newAgent);
        };
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async update(agentData) {
    return new Promise(async (resolve, reject) => {
      try {
        const existing = await this.getById(agentData.id);
        if (!existing) {
          throw new Error(`Agent with ID ${agentData.id} not found.`);
        }

        const updated = {
          ...existing,
          ...agentData,
          id: existing.id, // preserve primary key
          sno: existing.sno || agentData.sno || existing.id,
          raid: (agentData.raid || existing.raid || '').trim().toUpperCase(),
          ra_name: (agentData.ra_name || existing.ra_name || '').trim().toUpperCase(),
          signatory: (agentData.signatory !== undefined ? agentData.signatory : existing.signatory || '').trim(),
          state: (agentData.state || existing.state || '').trim().toUpperCase(),
          district: (agentData.district || existing.district || '').trim().toUpperCase(),
          rc_number: (agentData.rc_number !== undefined ? agentData.rc_number : existing.rc_number || '').trim(),
          address: (agentData.address !== undefined ? agentData.address : existing.address || '').trim(),
          email: (agentData.email !== undefined ? agentData.email : existing.email || '').trim().toLowerCase(),
          phone: (agentData.phone !== undefined ? agentData.phone : existing.phone || '').trim(),
          website: (agentData.website !== undefined ? agentData.website : existing.website || '').trim(),
          branch_address: (agentData.branch_address !== undefined ? agentData.branch_address : existing.branch_address || '').trim(),
          has_website: (agentData.website !== undefined ? (agentData.website.trim() ? 1 : 0) : existing.has_website),
          has_email: (agentData.email !== undefined ? (agentData.email.trim() ? 1 : 0) : existing.has_email),
          has_phone: (agentData.phone !== undefined ? (agentData.phone.trim() ? 1 : 0) : existing.has_phone),
          status: (agentData.status || existing.status || 'new').toLowerCase().replace(/\s+/g, '_'),
          notes: agentData.notes !== undefined ? agentData.notes : existing.notes || '',
          updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
        };

        const tx = this.db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(updated);

        req.onsuccess = () => resolve(updated);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async patch(id, partial) {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Agent not found with ID: ${id}`);
    return this.update({ ...existing, ...partial, id: existing.id });
  }

  async delete(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const numId = Number(id);
      const req = store.delete(isNaN(numId) ? id : numId);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async bulkDelete(ids) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const id of ids) {
        const numId = Number(id);
        store.delete(isNaN(numId) ? id : numId);
      }
      tx.oncomplete = () => resolve(ids.length);
      tx.onerror = () => reject(tx.error);
    });
  }

  async bulkUpdateStatus(ids, status) {
    const normStatus = status.toLowerCase().replace(/\s+/g, '_');
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return new Promise(async (resolve, reject) => {
      try {
        const tx = this.db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        for (const id of ids) {
          const numId = Number(id);
          const getReq = store.get(isNaN(numId) ? id : numId);
          getReq.onsuccess = () => {
            if (getReq.result) {
              const agent = getReq.result;
              agent.status = normStatus;
              agent.updated_at = now;
              store.put(agent);
            }
          };
        }

        tx.oncomplete = () => resolve(ids.length);
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async resetToDefault() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME, META_STORE], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const clearReq = store.clear();

      clearReq.onsuccess = () => {
        if (window.INITIAL_AGENTS && window.INITIAL_AGENTS.length > 0) {
          for (const raw of window.INITIAL_AGENTS) {
            const agent = { ...raw };
            agent.has_website = agent.website && agent.website.trim() ? 1 : 0;
            agent.has_email = agent.email && agent.email.trim() ? 1 : 0;
            agent.has_phone = agent.phone && agent.phone.trim() ? 1 : 0;
            store.put(agent);
          }
        }
      };

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async importData(dataArray, mode = 'merge') {
    return new Promise(async (resolve, reject) => {
      try {
        const tx = this.db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        if (mode === 'replace') {
          store.clear();
        }

        let importedCount = 0;
        for (const item of dataArray) {
          if (!item.ra_name && !item.raid) continue;

          const agent = {
            id: item.id || Date.now() + importedCount,
            sno: item.sno || importedCount + 1,
            raid: (item.raid || `RA${Date.now().toString().slice(-6)}`).trim().toUpperCase(),
            ra_name: (item.ra_name || '').trim().toUpperCase(),
            signatory: (item.signatory || '').trim(),
            state: (item.state || '').trim().toUpperCase(),
            district: (item.district || '').trim().toUpperCase(),
            rc_number: (item.rc_number || '').trim(),
            address: (item.address || '').trim(),
            email: (item.email || '').trim().toLowerCase(),
            phone: (item.phone || '').trim(),
            website: (item.website || '').trim(),
            branch_address: (item.branch_address || '').trim(),
            has_website: (item.website && item.website.trim()) ? 1 : 0,
            has_email: (item.email && item.email.trim()) ? 1 : 0,
            has_phone: (item.phone && item.phone.trim()) ? 1 : 0,
            status: (item.status || 'new').toLowerCase().replace(/\s+/g, '_'),
            notes: item.notes || '',
            updated_at: item.updated_at || new Date().toISOString().replace('T', ' ').slice(0, 19)
          };

          store.put(agent);
          importedCount++;
        }

        tx.oncomplete = () => resolve(importedCount);
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    });
  }
}

// Export singleton instance
window.agentDB = new AgentDatabase();
