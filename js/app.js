/**
 * Recruiting Agents CRM - Main Application Controller
 * Full CRUD, Highly Mobile-Optimized, PWA & Offline Support, IndexedDB Persistence
 */

(function () {
  'use strict';

  /* ============ Configuration & Constants ============ */
  const STATUSES = [
    { key: 'new',            label: 'New',            color: 'var(--status-new)',       bg: 'var(--status-new-bg)' },
    { key: 'selected',       label: 'Selected',       color: 'var(--status-selected)',  bg: 'var(--status-selected-bg)' },
    { key: 'contacted',      label: 'Contacted',      color: 'var(--status-contacted)', bg: 'var(--status-contacted-bg)' },
    { key: 'agreed',         label: 'Agreed',         color: 'var(--status-agreed)',    bg: 'var(--status-agreed-bg)' },
    { key: 'deal_done',      label: 'Deal Done',      color: 'var(--status-done)',      bg: 'var(--status-done-bg)' },
    { key: 'not_interested', label: 'Not Interested', color: 'var(--status-skip)',      bg: 'var(--status-skip-bg)' },
  ];
  const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.key, s]));

  /* ============ State Management ============ */
  let allAgents = [];
  let currentDrawerAgent = null;
  let selectedAgentIds = new Set();

  const state = {
    q: '',
    status: null,
    stateFilter: '',
    district: '',
    hasWebsite: false,
    noWebsite: false,
    hasEmail: false,
    hasPhone: false,
    sortBy: 'sno',
    sortDir: 'asc',
    page: 1,
    pageSize: 50
  };

  /* ============ DOM Elements ============ */
  const elements = {
    // Search & filters
    searchInput: document.getElementById('searchInput'),
    searchClear: document.getElementById('searchClear'),
    statusFilters: document.getElementById('statusFilters'),
    stateFilter: document.getElementById('stateFilter'),
    districtFilter: document.getElementById('districtFilter'),
    fWebsite: document.getElementById('fWebsite'),
    fNoWebsite: document.getElementById('fNoWebsite'),
    fEmail: document.getElementById('fEmail'),
    fPhone: document.getElementById('fPhone'),
    clearFilters: document.getElementById('clearFilters'),
    closeMobileFilters: document.getElementById('closeMobileFilters'),
    
    // Stats & counts
    statsStrip: document.getElementById('statsStrip'),
    resultCount: document.getElementById('resultCount'),
    
    // Table & Pagination
    tableBody: document.getElementById('tableBody'),
    selectAllHeader: document.getElementById('selectAllHeader'),
    emptyState: document.getElementById('emptyState'),
    pagination: document.getElementById('pagination'),
    pageSizeSelect: document.getElementById('pageSizeSelect'),
    sortBySelect: document.getElementById('sortBySelect'),
    sortDirBtn: document.getElementById('sortDirBtn'),
    
    // Bulk bar
    bulkBar: document.getElementById('bulkBar'),
    bulkCount: document.getElementById('bulkCount'),
    bulkStatusSelect: document.getElementById('bulkStatusSelect'),
    bulkExportBtn: document.getElementById('bulkExportBtn'),
    bulkDeleteBtn: document.getElementById('bulkDeleteBtn'),
    bulkDeselectBtn: document.getElementById('bulkDeselectBtn'),
    
    // Topbar actions
    addAgentBtn: document.getElementById('addAgentBtn'),
    exportDropdownBtn: document.getElementById('exportDropdownBtn'),
    exportDropdownMenu: document.getElementById('exportDropdownMenu'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    exportJsonBtn: document.getElementById('exportJsonBtn'),
    exportSqliteBtn: document.getElementById('exportSqliteBtn'),
    dbManagerBtn: document.getElementById('dbManagerBtn'),
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    menuToggle: document.getElementById('menuToggle'),
    sidebar: document.getElementById('sidebar'),
    
    // Mobile Bottom Navigation
    mobNavAgents: document.getElementById('mobNavAgents'),
    mobNavFilter: document.getElementById('mobNavFilter'),
    mobNavAdd: document.getElementById('mobNavAdd'),
    mobNavExport: document.getElementById('mobNavExport'),
    mobNavSettings: document.getElementById('mobNavSettings'),

    // Drawer
    overlay: document.getElementById('overlay'),
    drawer: document.getElementById('drawer'),
    drawerClose: document.getElementById('drawerClose'),
    dRaid: document.getElementById('dRaid'),
    dName: document.getElementById('dName'),
    dSignatory: document.getElementById('dSignatory'),
    dLocation: document.getElementById('dLocation'),
    dContact: document.getElementById('dContact'),
    dQuickActions: document.getElementById('dQuickActions'),
    dReg: document.getElementById('dReg'),
    dBranchWrap: document.getElementById('dBranchWrap'),
    dBranch: document.getElementById('dBranch'),
    dStatusGrid: document.getElementById('dStatusGrid'),
    dNotes: document.getElementById('dNotes'),
    savedNote: document.getElementById('savedNote'),
    dEditBtn: document.getElementById('dEditBtn'),
    dDeleteBtn: document.getElementById('dDeleteBtn'),
    quickNotesChips: document.getElementById('quickNotesChips'),

    // Modals
    agentModalBackdrop: document.getElementById('agentModalBackdrop'),
    agentModalTitle: document.getElementById('agentModalTitle'),
    agentForm: document.getElementById('agentForm'),
    modalAgentId: document.getElementById('modalAgentId'),
    modalRaid: document.getElementById('modalRaid'),
    modalName: document.getElementById('modalName'),
    modalSignatory: document.getElementById('modalSignatory'),
    modalState: document.getElementById('modalState'),
    modalDistrict: document.getElementById('modalDistrict'),
    modalRcNumber: document.getElementById('modalRcNumber'),
    modalEmail: document.getElementById('modalEmail'),
    modalPhone: document.getElementById('modalPhone'),
    modalWebsite: document.getElementById('modalWebsite'),
    modalAddress: document.getElementById('modalAddress'),
    modalBranchAddress: document.getElementById('modalBranchAddress'),
    modalStatus: document.getElementById('modalStatus'),
    modalNotes: document.getElementById('modalNotes'),
    closeAgentModal: document.getElementById('closeAgentModal'),
    cancelAgentModal: document.getElementById('cancelAgentModal'),
    
    // Delete Confirmation Modal
    deleteModalBackdrop: document.getElementById('deleteModalBackdrop'),
    deleteTargetName: document.getElementById('deleteTargetName'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    closeDeleteModal: document.getElementById('closeDeleteModal'),

    // Database Manager Modal
    dbModalBackdrop: document.getElementById('dbModalBackdrop'),
    closeDbModal: document.getElementById('closeDbModal'),
    dbRecordCount: document.getElementById('dbRecordCount'),
    dbLastUpdated: document.getElementById('dbLastUpdated'),
    btnResetDb: document.getElementById('btnResetDb'),
    importFileInput: document.getElementById('importFileInput'),
    btnTriggerImport: document.getElementById('btnTriggerImport'),
    importModeSelect: document.getElementById('importModeSelect'),

    // Toast container
    toastContainer: document.getElementById('toastContainer')
  };

  /* ============ Helpers & Formatters ============ */
  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function formatWebsite(w) {
    if (!w) return '';
    return w.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }

  function normalizedHref(w) {
    if (!w) return '#';
    return /^https?:\/\//i.test(w) ? w : 'http://' + w;
  }

  function telHref(p) {
    if (!p) return '#';
    return 'tel:' + p.replace(/[^\d+]/g, '');
  }

  function whatsappHref(p) {
    if (!p) return '#';
    const digits = p.replace(/[^\d]/g, '');
    return `https://wa.me/${digits}`;
  }

  /* ============ Toast Notifications ============ */
  function showToast(message, type = 'info', duration = 2800) {
    if (!elements.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '';
    if (type === 'success') icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    else if (type === 'error') icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    else icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

    toast.innerHTML = `${icon}<span>${escapeHtml(message)}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px) scale(0.95)';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  /* ============ Theme Management ============ */
  const root = document.documentElement;
  const sunPath = 'M12 4V2M12 22v-2M4.93 4.93 3.51 3.51M20.49 20.49l-1.42-1.42M4 12H2M22 12h-2M4.93 19.07 3.51 20.49M20.49 3.51l-1.42 1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z';
  const moonPath = 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z';

  function applyTheme(mode) {
    root.setAttribute('data-theme', mode);
    if (elements.themeIcon) {
      elements.themeIcon.innerHTML = `<path d="${mode === 'dark' ? sunPath : moonPath}"/>`;
    }
    try { localStorage.setItem('ra_outreach_theme', mode); } catch (e) {}
  }

  function initTheme() {
    let savedTheme;
    try { savedTheme = localStorage.getItem('ra_outreach_theme'); } catch (e) {}
    applyTheme(savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    elements.themeToggle?.addEventListener('click', () => {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  /* ============ Data Refresh & Dynamic Filter Options ============ */
  async function reloadAgentsFromDB() {
    allAgents = await window.agentDB.getAll();
    refreshStateOptions();
    refreshDistrictOptions();
    render();
  }

  function refreshStateOptions() {
    const states = [...new Set(allAgents.map(a => a.state).filter(Boolean))].sort();
    const prev = elements.stateFilter.value;
    elements.stateFilter.innerHTML = '<option value="">All states</option>' + 
      states.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    if (states.includes(prev)) elements.stateFilter.value = prev;

    // Also populate modal state select
    if (elements.modalState) {
      elements.modalState.innerHTML = '<option value="">Select state...</option>' +
        states.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    }
  }

  function refreshDistrictOptions() {
    const pool = state.stateFilter ? allAgents.filter(a => a.state === state.stateFilter) : allAgents;
    const districts = [...new Set(pool.map(a => a.district).filter(Boolean))].sort();
    const prev = elements.districtFilter.value;
    elements.districtFilter.innerHTML = '<option value="">All districts</option>' + 
      districts.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
    if (districts.includes(prev)) elements.districtFilter.value = prev;
    else { elements.districtFilter.value = ''; state.district = ''; }
  }

  /* ============ Filter & Match Logic ============ */
  function matches(a) {
    if (state.stateFilter && a.state !== state.stateFilter) return false;
    if (state.district && a.district !== state.district) return false;
    if (state.hasWebsite && (!a.website || !a.website.trim())) return false;
    if (state.noWebsite && (a.website && a.website.trim())) return false;
    if (state.hasEmail && (!a.email || !a.email.trim())) return false;
    if (state.hasPhone && (!a.phone || !a.phone.trim())) return false;
    if (state.status && a.status !== state.status) return false;
    
    if (state.q) {
      const hay = `${a.ra_name || ''} ${a.raid || ''} ${a.district || ''} ${a.state || ''} ${a.email || ''} ${a.phone || ''} ${a.signatory || ''} ${a.rc_number || ''} ${a.notes || ''}`.toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  }

  function computeStatusCounts(pool) {
    const counts = {};
    STATUSES.forEach(s => counts[s.key] = 0);
    pool.forEach(a => {
      const st = a.status || 'new';
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }

  function sortAgents(list) {
    const dir = state.sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      let vA = a[state.sortBy];
      let vB = b[state.sortBy];
      
      if (vA === undefined || vA === null) vA = '';
      if (vB === undefined || vB === null) vB = '';

      if (state.sortBy === 'sno' || state.sortBy === 'id') {
        return (Number(vA) - Number(vB)) * dir;
      }
      return String(vA).localeCompare(String(vB), undefined, { numeric: true, sensitivity: 'base' }) * dir;
    });
  }

  /* ============ Rendering ============ */
  function renderStatusFilters(counts) {
    elements.statusFilters.innerHTML = STATUSES.map(s => {
      const isActive = state.status === s.key;
      return `
        <div class="status-chip ${isActive ? 'active' : ''}" data-status="${s.key}" style="--chip-color: ${s.color}">
          <div class="status-chip-left">
            <span class="status-dot" style="background: ${s.color}"></span>
            <span>${s.label}</span>
          </div>
          <span class="status-count">${counts[s.key] || 0}</span>
        </div>
      `;
    }).join('');

    elements.statusFilters.querySelectorAll('.status-chip').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.dataset.status;
        state.status = state.status === key ? null : key;
        state.page = 1;
        render();
        // Close mobile filters sheet if open
        elements.sidebar?.classList.remove('show');
        elements.overlay?.classList.remove('show');
      });
    });
  }

  function renderStats(totalAll, filteredCount) {
    const withWeb = allAgents.filter(a => a.website && a.website.trim()).length;
    const withEmail = allAgents.filter(a => a.email && a.email.trim()).length;
    const statesCount = new Set(allAgents.map(a => a.state).filter(Boolean)).size;
    const agreedCount = allAgents.filter(a => a.status === 'agreed' || a.status === 'deal_done').length;

    elements.statsStrip.innerHTML = `
      <div class="stat-pill ${!state.status ? 'active' : ''}" id="statTotal">
        <div class="n">${totalAll.toLocaleString()}</div>
        <div class="l">Total agents</div>
      </div>
      <div class="stat-pill" id="statWeb">
        <div class="n">${withWeb.toLocaleString()}</div>
        <div class="l">With website</div>
      </div>
      <div class="stat-pill" id="statEmail">
        <div class="n">${withEmail.toLocaleString()}</div>
        <div class="l">With email</div>
      </div>
      <div class="stat-pill" id="statStates">
        <div class="n">${statesCount}</div>
        <div class="l">States covered</div>
      </div>
      <div class="stat-pill" id="statAgreed">
        <div class="n">${agreedCount}</div>
        <div class="l">Agreed / Won</div>
      </div>
    `;

    document.getElementById('statTotal')?.addEventListener('click', () => {
      state.status = null; state.page = 1; render();
    });
    document.getElementById('statWeb')?.addEventListener('click', () => {
      state.hasWebsite = !state.hasWebsite;
      state.noWebsite = false;
      elements.fWebsite.checked = state.hasWebsite;
      elements.fNoWebsite.checked = false;
      state.page = 1; render();
    });
    document.getElementById('statEmail')?.addEventListener('click', () => {
      state.hasEmail = !state.hasEmail;
      elements.fEmail.checked = state.hasEmail;
      state.page = 1; render();
    });
    document.getElementById('statAgreed')?.addEventListener('click', () => {
      state.status = state.status === 'agreed' ? null : 'agreed';
      state.page = 1; render();
    });
  }

  function render() {
    // Status counts pool without current status constraint
    const preStatusPool = allAgents.filter(a => {
      const save = state.status; state.status = null;
      const r = matches(a);
      state.status = save;
      return r;
    });
    const counts = computeStatusCounts(preStatusPool);
    renderStatusFilters(counts);

    const filtered = allAgents.filter(matches);
    const sorted = sortAgents(filtered);

    const totalAll = allAgents.length;
    renderStats(totalAll, filtered.length);

    elements.resultCount.innerHTML = `Showing <strong>${sorted.length.toLocaleString()}</strong> of <strong>${totalAll.toLocaleString()}</strong> agents`;

    const pageSize = state.pageSize === 'all' ? sorted.length : Number(state.pageSize);
    const totalPages = Math.max(1, Math.ceil(sorted.length / (pageSize || 1)));
    if (state.page > totalPages) state.page = totalPages;

    const startIdx = (state.page - 1) * pageSize;
    const pageItems = state.pageSize === 'all' ? sorted : sorted.slice(startIdx, startIdx + pageSize);

    elements.emptyState.style.display = sorted.length === 0 ? 'block' : 'none';
    elements.tableBody.innerHTML = pageItems.map(rowHtml).join('');

    // Table / Card Row Events
    elements.tableBody.querySelectorAll('tr[data-id]').forEach(tr => {
      const id = Number(tr.dataset.id);
      
      tr.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('select') || e.target.closest('input[type="checkbox"]') || e.target.closest('.action-btn') || e.target.closest('.mobile-action-chip')) {
          return;
        }
        openDrawer(id);
      });

      const rowCheckbox = tr.querySelector('.row-checkbox');
      rowCheckbox?.addEventListener('change', (e) => {
        if (e.target.checked) selectedAgentIds.add(id);
        else selectedAgentIds.delete(id);
        updateBulkBar();
      });

      const statusSelect = tr.querySelector('.status-select');
      statusSelect?.addEventListener('change', async (e) => {
        e.stopPropagation();
        const newStatus = e.target.value;
        await window.agentDB.patch(id, { status: newStatus });
        const agent = allAgents.find(a => a.id === id);
        if (agent) agent.status = newStatus;
        showToast(`Status updated to "${STATUS_MAP[newStatus]?.label || newStatus}"`, 'success', 1800);
        render();
      });

      const editBtn = tr.querySelector('.edit-row-btn');
      editBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(id);
      });

      const deleteBtn = tr.querySelector('.delete-row-btn');
      deleteBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteConfirm(id);
      });
    });

    // Update Select All Checkbox state
    if (elements.selectAllHeader) {
      const visibleIds = pageItems.map(a => a.id);
      const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedAgentIds.has(id));
      elements.selectAllHeader.checked = allSelected;
    }

    renderPagination(totalPages, sorted.length);
    updateBulkBar();
  }

  function rowHtml(a) {
    const isSelected = selectedAgentIds.has(a.id);
    const s = STATUS_MAP[a.status] || STATUS_MAP.new;
    const statusOpts = STATUSES.map(o => `<option value="${o.key}" ${o.key === a.status ? 'selected' : ''}>${o.label}</option>`).join('');

    const contactBits = [];
    if (a.email) contactBits.push(`<div class="contact-line"><a href="mailto:${escapeHtml(a.email)}" onclick="event.stopPropagation()">${escapeHtml(a.email)}</a></div>`);
    else contactBits.push(`<div class="contact-line muted">No email</div>`);
    
    if (a.phone) contactBits.push(`<div class="contact-line"><a href="${telHref(a.phone)}" onclick="event.stopPropagation()">${escapeHtml(a.phone)}</a></div>`);
    else contactBits.push(`<div class="contact-line muted">No phone</div>`);

    // Direct Mobile Touch Chips
    const mobileActions = [];
    if (a.phone) {
      mobileActions.push(`<a class="mobile-action-chip" href="${telHref(a.phone)}" onclick="event.stopPropagation()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Call</a>`);
      mobileActions.push(`<a class="mobile-action-chip" href="${whatsappHref(a.phone)}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> WhatsApp</a>`);
    }
    if (a.email) {
      mobileActions.push(`<a class="mobile-action-chip" href="mailto:${escapeHtml(a.email)}" onclick="event.stopPropagation()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Email</a>`);
    }
    if (a.website) {
      mobileActions.push(`<a class="mobile-action-chip" href="${normalizedHref(a.website)}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Site</a>`);
    }

    return `
      <tr data-id="${a.id}" class="${isSelected ? 'selected-row' : ''}">
        <td style="width: 38px; text-align: center;" onclick="event.stopPropagation()">
          <input type="checkbox" class="row-checkbox" ${isSelected ? 'checked' : ''}>
        </td>
        <td style="width: 28%">
          <div class="cell-agent">
            <div class="cell-name">${escapeHtml(a.ra_name)}</div>
            <div class="cell-sub">
              <span class="raid-badge">${escapeHtml(a.raid)}</span>
              <span>${escapeHtml(a.signatory || '—')}</span>
            </div>
          </div>
        </td>
        <td style="width: 18%">
          <div class="cell-loc">${escapeHtml(a.state || '—')}</div>
          <div class="cell-dist">${escapeHtml(a.district || '')}</div>
        </td>
        <td style="width: 20%">
          ${contactBits.join('')}
          <div class="mobile-direct-actions">${mobileActions.join('')}</div>
        </td>
        <td style="width: 14%">
          ${a.website ? `<a class="web-link" href="${normalizedHref(a.website)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(a.website)}" onclick="event.stopPropagation()">${escapeHtml(formatWebsite(a.website))}</a>` : `<span class="web-none">No website</span>`}
        </td>
        <td style="width: 12%">
          <span style="font-size:12px; color:var(--ink-soft); display:none;" class="mobile-status-label">Status:</span>
          <select class="status-select" style="background-color:${s.bg};color:${s.color}">${statusOpts}</select>
        </td>
        <td style="width: 8%">
          <div class="row-actions">
            <button class="action-btn edit-row-btn" title="Edit Agent"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
            <button class="action-btn delete-btn delete-row-btn" title="Delete Agent"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </div>
        </td>
      </tr>
    `;
  }

  function renderPagination(totalPages, totalItems) {
    if (totalPages <= 1 || state.pageSize === 'all') {
      elements.pagination.innerHTML = '';
      return;
    }

    let buttons = [];
    buttons.push(`<button id="prevPage" ${state.page === 1 ? 'disabled' : ''}>&larr; Prev</button>`);

    // Page numbers with ellipsis
    const cur = state.page;
    const maxBtns = window.innerWidth <= 600 ? 3 : 5;
    let startPage = Math.max(1, cur - 1);
    let endPage = Math.min(totalPages, startPage + maxBtns - 1);
    if (endPage - startPage < maxBtns - 1) {
      startPage = Math.max(1, endPage - maxBtns + 1);
    }

    if (startPage > 1) {
      buttons.push(`<button class="page-number" data-page="1">1</button>`);
      if (startPage > 2) buttons.push(`<span>…</span>`);
    }

    for (let p = startPage; p <= endPage; p++) {
      buttons.push(`<button class="page-number ${p === cur ? 'active' : ''}" data-page="${p}">${p}</button>`);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) buttons.push(`<span>…</span>`);
      buttons.push(`<button class="page-number" data-page="${totalPages}">${totalPages}</button>`);
    }

    buttons.push(`<button id="nextPage" ${state.page === totalPages ? 'disabled' : ''}>Next &rarr;</button>`);

    elements.pagination.innerHTML = buttons.join('');

    document.getElementById('prevPage')?.addEventListener('click', () => {
      if (state.page > 1) { state.page--; render(); window.scrollTo(0, 0); }
    });
    document.getElementById('nextPage')?.addEventListener('click', () => {
      if (state.page < totalPages) { state.page++; render(); window.scrollTo(0, 0); }
    });
    elements.pagination.querySelectorAll('.page-number').forEach(btn => {
      btn.addEventListener('click', () => {
        state.page = Number(btn.dataset.page);
        render();
        window.scrollTo(0, 0);
      });
    });
  }

  /* ============ Bulk Actions ============ */
  function updateBulkBar() {
    const count = selectedAgentIds.size;
    if (count > 0) {
      elements.bulkBar.classList.add('show');
      elements.bulkCount.textContent = `${count} agent${count > 1 ? 's' : ''} selected`;
    } else {
      elements.bulkBar.classList.remove('show');
    }
  }

  elements.selectAllHeader?.addEventListener('change', (e) => {
    const filtered = allAgents.filter(matches);
    const sorted = sortAgents(filtered);
    const pageSize = state.pageSize === 'all' ? sorted.length : Number(state.pageSize);
    const startIdx = (state.page - 1) * pageSize;
    const pageItems = state.pageSize === 'all' ? sorted : sorted.slice(startIdx, startIdx + pageSize);

    if (e.target.checked) {
      pageItems.forEach(a => selectedAgentIds.add(a.id));
    } else {
      pageItems.forEach(a => selectedAgentIds.delete(a.id));
    }
    render();
  });

  elements.bulkDeselectBtn?.addEventListener('click', () => {
    selectedAgentIds.clear();
    render();
  });

  elements.bulkStatusSelect?.addEventListener('change', async (e) => {
    const status = e.target.value;
    if (!status) return;
    const ids = Array.from(selectedAgentIds);
    await window.agentDB.bulkUpdateStatus(ids, status);
    ids.forEach(id => {
      const a = allAgents.find(x => x.id === id);
      if (a) a.status = status;
    });
    showToast(`Updated status for ${ids.length} agents`, 'success');
    e.target.value = '';
    render();
  });

  elements.bulkDeleteBtn?.addEventListener('click', async () => {
    const ids = Array.from(selectedAgentIds);
    if (!confirm(`Are you sure you want to delete ${ids.length} selected agents? This cannot be undone.`)) {
      return;
    }
    await window.agentDB.bulkDelete(ids);
    allAgents = allAgents.filter(a => !selectedAgentIds.has(a.id));
    selectedAgentIds.clear();
    showToast(`Deleted ${ids.length} agents`, 'info');
    render();
  });

  elements.bulkExportBtn?.addEventListener('click', () => {
    const selectedList = allAgents.filter(a => selectedAgentIds.has(a.id));
    exportCSVData(selectedList, `ra-selected-export-${new Date().toISOString().slice(0, 10)}.csv`);
  });

  /* ============ Agent Drawer ============ */
  let notesDebounceTimer = null;

  function openDrawer(id) {
    const agent = allAgents.find(a => a.id === id);
    if (!agent) return;
    currentDrawerAgent = agent;

    elements.dRaid.textContent = agent.raid;
    elements.dName.textContent = agent.ra_name;
    elements.dSignatory.textContent = agent.signatory ? `Signatory: ${agent.signatory}` : '';
    elements.dLocation.innerHTML = `
      <strong>${escapeHtml(agent.district || '—')}, ${escapeHtml(agent.state || '—')}</strong>
      <div style="margin-top:4px;color:var(--ink-soft);font-size:12.5px;">${escapeHtml(agent.address || 'No street address on file')}</div>
    `;

    // Contact Details & Quick Actions
    const quickActions = [];
    const contactHtml = [];

    if (agent.phone) {
      quickActions.push(`<a class="contact-action-chip" href="${telHref(agent.phone)}"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Call</a>`);
      quickActions.push(`<a class="contact-action-chip" href="${whatsappHref(agent.phone)}" target="_blank" rel="noopener"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> WhatsApp</a>`);
      contactHtml.push(`<div><strong>Phone:</strong> <a href="${telHref(agent.phone)}">${escapeHtml(agent.phone)}</a></div>`);
    } else {
      contactHtml.push(`<div style="color:var(--ink-faint)">No phone on file</div>`);
    }

    if (agent.email) {
      quickActions.push(`<a class="contact-action-chip" href="mailto:${escapeHtml(agent.email)}"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Email</a>`);
      contactHtml.push(`<div><strong>Email:</strong> <a href="mailto:${escapeHtml(agent.email)}">${escapeHtml(agent.email)}</a></div>`);
    } else {
      contactHtml.push(`<div style="color:var(--ink-faint)">No email on file</div>`);
    }

    if (agent.website) {
      quickActions.push(`<a class="contact-action-chip" href="${normalizedHref(agent.website)}" target="_blank" rel="noopener"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Visit Site</a>`);
      contactHtml.push(`<div><strong>Website:</strong> <a href="${normalizedHref(agent.website)}" target="_blank" rel="noopener">${escapeHtml(agent.website)}</a></div>`);
    } else {
      contactHtml.push(`<div style="color:var(--ink-faint)">No website on file</div>`);
    }

    elements.dQuickActions.innerHTML = quickActions.join('');
    elements.dContact.innerHTML = contactHtml.join('');

    elements.dReg.textContent = agent.rc_number || '—';

    if (agent.branch_address && agent.branch_address.trim()) {
      elements.dBranchWrap.style.display = 'block';
      elements.dBranch.textContent = agent.branch_address;
    } else {
      elements.dBranchWrap.style.display = 'none';
    }

    // Status Selector Grid in Drawer
    elements.dStatusGrid.innerHTML = STATUSES.map(s => {
      const isCur = agent.status === s.key;
      return `
        <button class="status-btn ${isCur ? 'active' : ''}" data-status="${s.key}" style="color:${s.color};${isCur ? `background:${s.bg};border-color:${s.color}` : ''}">
          <span class="status-dot" style="background:${s.color}"></span>
          <span>${s.label}</span>
        </button>
      `;
    }).join('');

    elements.dStatusGrid.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const newSt = btn.dataset.status;
        await window.agentDB.patch(agent.id, { status: newSt });
        agent.status = newSt;
        openDrawer(agent.id);
        render();
        showToast(`Status updated to ${STATUS_MAP[newSt]?.label || newSt}`, 'success', 1800);
      });
    });

    // Notes
    elements.dNotes.value = agent.notes || '';

    // Quick notes templates
    elements.quickNotesChips.querySelectorAll('.template-pill').forEach(chip => {
      chip.onclick = () => {
        const text = chip.textContent;
        const current = elements.dNotes.value.trim();
        const dateTag = `[${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}]`;
        const appended = current ? `${current}\n${dateTag} ${text}` : `${dateTag} ${text}`;
        elements.dNotes.value = appended;
        elements.dNotes.dispatchEvent(new Event('input'));
      };
    });

    elements.drawer.classList.add('show');
    elements.overlay.classList.add('show');
  }

  function closeDrawer() {
    elements.drawer.classList.remove('show');
    elements.overlay.classList.remove('show');
    currentDrawerAgent = null;
  }

  elements.drawerClose?.addEventListener('click', closeDrawer);
  elements.overlay?.addEventListener('click', () => {
    closeDrawer();
    closeAllModals();
    elements.sidebar?.classList.remove('show');
  });

  // Notes Auto-save in Drawer
  elements.dNotes?.addEventListener('input', (e) => {
    if (!currentDrawerAgent) return;
    clearTimeout(notesDebounceTimer);
    notesDebounceTimer = setTimeout(async () => {
      const val = e.target.value;
      await window.agentDB.patch(currentDrawerAgent.id, { notes: val });
      currentDrawerAgent.notes = val;
      elements.savedNote.classList.add('show');
      setTimeout(() => elements.savedNote.classList.remove('show'), 1500);
    }, 400);
  });

  // Drawer Footer Edit / Delete Actions
  elements.dEditBtn?.addEventListener('click', () => {
    if (currentDrawerAgent) openEditModal(currentDrawerAgent.id);
  });
  elements.dDeleteBtn?.addEventListener('click', () => {
    if (currentDrawerAgent) openDeleteConfirm(currentDrawerAgent.id);
  });

  /* ============ Create & Edit Agent Modals (CRUD) ============ */
  function openAddModal() {
    elements.agentModalTitle.textContent = 'Add New Recruiting Agent';
    elements.agentForm.reset();
    elements.modalAgentId.value = '';
    elements.modalRaid.value = `RA${Date.now().toString().slice(-6)}`;
    elements.modalStatus.value = 'new';
    elements.agentModalBackdrop.classList.add('show');
  }

  function openEditModal(id) {
    const agent = allAgents.find(a => a.id === id);
    if (!agent) return;

    elements.agentModalTitle.textContent = `Edit Agent: ${agent.ra_name}`;
    elements.modalAgentId.value = agent.id;
    elements.modalRaid.value = agent.raid || '';
    elements.modalName.value = agent.ra_name || '';
    elements.modalSignatory.value = agent.signatory || '';
    elements.modalState.value = agent.state || '';
    elements.modalDistrict.value = agent.district || '';
    elements.modalRcNumber.value = agent.rc_number || '';
    elements.modalEmail.value = agent.email || '';
    elements.modalPhone.value = agent.phone || '';
    elements.modalWebsite.value = agent.website || '';
    elements.modalAddress.value = agent.address || '';
    elements.modalBranchAddress.value = agent.branch_address || '';
    elements.modalStatus.value = agent.status || 'new';
    elements.modalNotes.value = agent.notes || '';

    elements.agentModalBackdrop.classList.add('show');
  }

  function closeAllModals() {
    elements.agentModalBackdrop.classList.remove('show');
    elements.deleteModalBackdrop.classList.remove('show');
    elements.dbModalBackdrop.classList.remove('show');
    elements.sidebar?.classList.remove('show');
    elements.overlay?.classList.remove('show');
  }

  elements.closeAgentModal?.addEventListener('click', closeAllModals);
  elements.cancelAgentModal?.addEventListener('click', closeAllModals);

  elements.agentForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = elements.modalAgentId.value;
    const isEdit = Boolean(id);

    const formData = {
      raid: elements.modalRaid.value.trim(),
      ra_name: elements.modalName.value.trim(),
      signatory: elements.modalSignatory.value.trim(),
      state: elements.modalState.value.trim(),
      district: elements.modalDistrict.value.trim(),
      rc_number: elements.modalRcNumber.value.trim(),
      email: elements.modalEmail.value.trim(),
      phone: elements.modalPhone.value.trim(),
      website: elements.modalWebsite.value.trim(),
      address: elements.modalAddress.value.trim(),
      branch_address: elements.modalBranchAddress.value.trim(),
      status: elements.modalStatus.value,
      notes: elements.modalNotes.value.trim()
    };

    if (!formData.ra_name) {
      showToast('Agent Name is required', 'error');
      return;
    }

    try {
      if (isEdit) {
        formData.id = Number(id);
        const updated = await window.agentDB.update(formData);
        const idx = allAgents.findIndex(a => a.id === updated.id);
        if (idx !== -1) allAgents[idx] = updated;
        showToast(`Agent "${updated.ra_name}" updated successfully!`, 'success');
        if (currentDrawerAgent && currentDrawerAgent.id === updated.id) {
          openDrawer(updated.id);
        }
      } else {
        const created = await window.agentDB.create(formData);
        allAgents.unshift(created);
        showToast(`Agent "${created.ra_name}" created successfully!`, 'success');
        openDrawer(created.id);
      }

      closeAllModals();
      refreshStateOptions();
      refreshDistrictOptions();
      render();
    } catch (err) {
      console.error('Save error:', err);
      showToast(`Error saving agent: ${err.message}`, 'error');
    }
  });

  /* ============ Delete Confirmation Modal ============ */
  let agentToDeleteId = null;

  function openDeleteConfirm(id) {
    const agent = allAgents.find(a => a.id === id);
    if (!agent) return;
    agentToDeleteId = id;
    elements.deleteTargetName.textContent = `${agent.ra_name} (${agent.raid})`;
    elements.deleteModalBackdrop.classList.add('show');
  }

  elements.confirmDeleteBtn?.addEventListener('click', async () => {
    if (!agentToDeleteId) return;
    try {
      await window.agentDB.delete(agentToDeleteId);
      allAgents = allAgents.filter(a => a.id !== agentToDeleteId);
      selectedAgentIds.delete(agentToDeleteId);
      
      showToast('Agent deleted successfully', 'info');
      closeAllModals();
      if (currentDrawerAgent && currentDrawerAgent.id === agentToDeleteId) {
        closeDrawer();
      }
      render();
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete agent', 'error');
    } finally {
      agentToDeleteId = null;
    }
  });

  elements.cancelDeleteBtn?.addEventListener('click', closeAllModals);
  elements.closeDeleteModal?.addEventListener('click', closeAllModals);

  /* ============ Database & Backup Manager Modal ============ */
  function openDbModal() {
    elements.dbRecordCount.textContent = `${allAgents.length.toLocaleString()} agent records`;
    const lastSeed = localStorage.getItem('ra_outreach_last_sync') || 'IndexedDB persistent store';
    elements.dbLastUpdated.textContent = lastSeed;
    elements.dbModalBackdrop.classList.add('show');
  }

  elements.dbManagerBtn?.addEventListener('click', openDbModal);
  elements.closeDbModal?.addEventListener('click', closeAllModals);

  elements.btnResetDb?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to reset the database to the original dataset (1,988 records)? Any custom records and notes will be reloaded from the base seed.')) {
      return;
    }
    try {
      await window.agentDB.resetToDefault();
      await reloadAgentsFromDB();
      showToast('Database reset to original 1,988 records!', 'success');
      closeAllModals();
    } catch (err) {
      console.error('Reset error:', err);
      showToast('Failed to reset database', 'error');
    }
  });

  /* ============ Export & Import Functions ============ */
  function exportCSVData(list, filename = 'recruiting-agents.csv') {
    const headers = ['S.No', 'RAID', 'Agent Name', 'Signatory', 'State', 'District', 'RC Number', 'Address', 'Email', 'Phone', 'Website', 'Branch Address', 'Status', 'Notes', 'Updated At'];
    const csvEsc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    
    const rows = list.map(a => [
      a.sno || a.id,
      a.raid || '',
      a.ra_name || '',
      a.signatory || '',
      a.state || '',
      a.district || '',
      a.rc_number || '',
      a.address || '',
      a.email || '',
      a.phone || '',
      a.website || '',
      a.branch_address || '',
      STATUS_MAP[a.status]?.label || a.status || 'New',
      a.notes || '',
      a.updated_at || ''
    ]);

    const csvContent = [headers, ...rows].map(r => r.map(csvEsc).join(',')).join('\r\n');
    downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), filename);
    showToast(`Exported ${list.length} agents to CSV`, 'success');
  }

  function exportJSONData() {
    const jsonStr = JSON.stringify(allAgents, null, 2);
    downloadBlob(new Blob([jsonStr], { type: 'application/json' }), `recruiting-agents-backup-${new Date().toISOString().slice(0, 10)}.json`);
    showToast(`Exported JSON backup with ${allAgents.length} records`, 'success');
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // SQLite .db Export using sql.js WebAssembly
  async function exportSqliteDatabase() {
    try {
      showToast('Generating SQLite .db database...', 'info', 1500);
      
      let initSqlJsFn = window.initSqlJs;
      if (!initSqlJsFn && window.SQL) initSqlJsFn = () => Promise.resolve(window.SQL);

      if (!initSqlJsFn) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.js');
        initSqlJsFn = window.initSqlJs;
      }

      const SQL = await initSqlJsFn({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
      });

      const db = new SQL.Database();
      db.run(`
        CREATE TABLE agents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sno INTEGER,
          raid TEXT,
          ra_name TEXT,
          signatory TEXT,
          state TEXT,
          district TEXT,
          rc_number TEXT,
          address TEXT,
          email TEXT,
          phone TEXT,
          website TEXT,
          branch_address TEXT,
          has_website INTEGER,
          has_email INTEGER,
          has_phone INTEGER,
          status TEXT,
          notes TEXT,
          updated_at TEXT
        );
      `);

      const stmt = db.prepare(`
        INSERT INTO agents (id, sno, raid, ra_name, signatory, state, district, rc_number, address, email, phone, website, branch_address, has_website, has_email, has_phone, status, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);

      for (const a of allAgents) {
        stmt.run([
          a.id,
          a.sno || a.id,
          a.raid || '',
          a.ra_name || '',
          a.signatory || '',
          a.state || '',
          a.district || '',
          a.rc_number || '',
          a.address || '',
          a.email || '',
          a.phone || '',
          a.website || '',
          a.branch_address || '',
          a.has_website || (a.website ? 1 : 0),
          a.has_email || (a.email ? 1 : 0),
          a.has_phone || (a.phone ? 1 : 0),
          STATUS_MAP[a.status]?.label || a.status || 'New',
          a.notes || '',
          a.updated_at || ''
        ]);
      }
      stmt.free();

      const binaryArray = db.export();
      downloadBlob(new Blob([binaryArray], { type: 'application/x-sqlite3' }), 'recruiting_agents.db');
      showToast('Exported SQLite database (recruiting_agents.db) successfully!', 'success');
    } catch (err) {
      console.error('SQLite export error:', err);
      exportCSVData(allAgents, 'recruiting_agents.csv');
      showToast('SQLite export unavailable; exported full CSV instead', 'info');
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Import JSON or CSV Handler
  elements.btnTriggerImport?.addEventListener('click', () => {
    elements.importFileInput?.click();
  });

  elements.importFileInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const mode = elements.importModeSelect?.value || 'merge';
    const reader = new FileReader();

    reader.onload = async (evt) => {
      const content = evt.target.result;
      try {
        let imported = [];
        if (file.name.endsWith('.json')) {
          imported = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          imported = parseCsv(content);
        } else {
          showToast('Unsupported file format. Please upload .json or .csv', 'error');
          return;
        }

        if (!Array.isArray(imported) || imported.length === 0) {
          showToast('No valid agent records found in file', 'error');
          return;
        }

        const count = await window.agentDB.importData(imported, mode);
        await reloadAgentsFromDB();
        showToast(`Successfully imported ${count} agents (${mode} mode)!`, 'success');
        closeAllModals();
      } catch (err) {
        console.error('Import parse error:', err);
        showToast(`Import error: ${err.message}`, 'error');
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  });

  function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];

    const parseLine = (line) => {
      const result = [];
      let cur = '';
      let insideQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (insideQuotes && line[i + 1] === '"') { cur += '"'; i++; }
          else insideQuotes = !insideQuotes;
        } else if (c === ',' && !insideQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    const items = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = parseLine(lines[i]);
      if (vals.length === 0) continue;
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = vals[idx] !== undefined ? vals[idx] : '';
      });
      const agent = {
        raid: obj.raid || obj.ra_id || '',
        ra_name: obj.ra_name || obj.agent_name || obj.name || '',
        signatory: obj.signatory || '',
        state: obj.state || '',
        district: obj.district || '',
        rc_number: obj.rc_number || obj.rc_no || '',
        address: obj.address || '',
        email: obj.email || '',
        phone: obj.phone || '',
        website: obj.website || '',
        branch_address: obj.branch_address || '',
        status: obj.status || 'new',
        notes: obj.notes || ''
      };
      if (agent.ra_name || agent.raid) items.push(agent);
    }
    return items;
  }

  /* ============ Wire Search & Filter Inputs ============ */
  let searchTimer = null;
  elements.searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const val = e.target.value;
    elements.searchClear.classList.toggle('show', val.length > 0);
    searchTimer = setTimeout(() => {
      state.q = val.trim().toLowerCase();
      state.page = 1;
      render();
    }, 150);
  });

  elements.searchClear?.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.searchClear.classList.remove('show');
    state.q = '';
    state.page = 1;
    render();
    elements.searchInput.focus();
  });

  elements.stateFilter?.addEventListener('change', () => {
    state.stateFilter = elements.stateFilter.value;
    state.district = '';
    state.page = 1;
    refreshDistrictOptions();
    render();
  });

  elements.districtFilter?.addEventListener('change', (e) => {
    state.district = e.target.value;
    state.page = 1;
    render();
  });

  elements.fWebsite?.addEventListener('change', (e) => {
    state.hasWebsite = e.target.checked;
    if (e.target.checked) {
      state.noWebsite = false;
      elements.fNoWebsite.checked = false;
    }
    state.page = 1;
    render();
  });

  elements.fNoWebsite?.addEventListener('change', (e) => {
    state.noWebsite = e.target.checked;
    if (e.target.checked) {
      state.hasWebsite = false;
      elements.fWebsite.checked = false;
    }
    state.page = 1;
    render();
  });

  elements.fEmail?.addEventListener('change', (e) => {
    state.hasEmail = e.target.checked;
    state.page = 1;
    render();
  });

  elements.fPhone?.addEventListener('change', (e) => {
    state.hasPhone = e.target.checked;
    state.page = 1;
    render();
  });

  elements.clearFilters?.addEventListener('click', () => {
    state.q = '';
    state.status = null;
    state.stateFilter = '';
    state.district = '';
    state.hasWebsite = false;
    state.noWebsite = false;
    state.hasEmail = false;
    state.hasPhone = false;
    state.page = 1;

    elements.searchInput.value = '';
    elements.searchClear.classList.remove('show');
    elements.stateFilter.value = '';
    elements.fWebsite.checked = false;
    elements.fNoWebsite.checked = false;
    elements.fEmail.checked = false;
    elements.fPhone.checked = false;

    refreshDistrictOptions();
    render();
    showToast('Filters cleared', 'info', 1200);
  });

  elements.closeMobileFilters?.addEventListener('click', () => {
    elements.sidebar?.classList.remove('show');
    elements.overlay?.classList.remove('show');
  });

  // Sort & Page Controls
  elements.sortBySelect?.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    render();
  });

  elements.sortDirBtn?.addEventListener('click', () => {
    state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    elements.sortDirBtn.innerHTML = state.sortDir === 'asc' 
      ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 8 4-4 4 4M7 4v16M21 16l-4 4-4-4M17 20V4"/></svg>'
      : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 16 4 4 4-4M7 20V4M21 8l-4-4-4 4M17 4v16"/></svg>';
    render();
  });

  elements.pageSizeSelect?.addEventListener('change', (e) => {
    state.pageSize = e.target.value;
    state.page = 1;
    render();
  });

  /* ============ Topbar Action Wiring ============ */
  elements.addAgentBtn?.addEventListener('click', openAddModal);

  // Dropdown Export Menu
  elements.exportDropdownBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = elements.exportDropdownBtn.closest('.dropdown');
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    }
  });

  elements.exportCsvBtn?.addEventListener('click', () => {
    const filtered = allAgents.filter(matches);
    exportCSVData(filtered, `ra-outreach-export-${new Date().toISOString().slice(0, 10)}.csv`);
  });

  elements.exportJsonBtn?.addEventListener('click', exportJSONData);
  elements.exportSqliteBtn?.addEventListener('click', exportSqliteDatabase);

  /* ============ Mobile Bottom Navigation Wiring ============ */
  elements.mobNavAgents?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('.table-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveNav('mobNavAgents');
  });

  elements.mobNavFilter?.addEventListener('click', () => {
    elements.sidebar?.classList.toggle('show');
    elements.overlay?.classList.toggle('show', elements.sidebar?.classList.contains('show'));
    setActiveNav('mobNavFilter');
  });

  elements.mobNavAdd?.addEventListener('click', () => {
    openAddModal();
  });

  elements.mobNavExport?.addEventListener('click', () => {
    const filtered = allAgents.filter(matches);
    exportCSVData(filtered, `ra-outreach-export-${new Date().toISOString().slice(0, 10)}.csv`);
    setActiveNav('mobNavExport');
  });

  elements.mobNavSettings?.addEventListener('click', () => {
    openDbModal();
    setActiveNav('mobNavSettings');
  });

  function setActiveNav(navId) {
    document.querySelectorAll('.mobile-nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(navId)?.classList.add('active');
  }

  /* ============ Mobile Sidebar Toggle ============ */
  function checkMobile() {
    if (window.innerWidth <= 768) {
      if (elements.menuToggle) elements.menuToggle.style.display = 'flex';
    } else {
      if (elements.menuToggle) elements.menuToggle.style.display = 'none';
      elements.sidebar?.classList.remove('show');
    }
  }
  window.addEventListener('resize', checkMobile);
  checkMobile();

  elements.menuToggle?.addEventListener('click', () => {
    elements.sidebar?.classList.toggle('show');
    elements.overlay?.classList.toggle('show', elements.sidebar?.classList.contains('show'));
  });

  /* ============ Keyboard Shortcuts ============ */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      closeAllModals();
    }
    // "/" to search
    if (e.key === '/' && document.activeElement !== elements.searchInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      elements.searchInput?.focus();
    }
    // "n" for new agent
    if ((e.key === 'n' || e.key === 'N') && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      openAddModal();
    }
  });

  /* ============ URL Query Handling (PWA Shortcuts) ============ */
  function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'add') {
      setTimeout(openAddModal, 300);
    }
    if (params.get('status')) {
      const st = params.get('status');
      if (STATUS_MAP[st]) {
        state.status = st;
        render();
      }
    }
  }

  /* ============ Application Initialization ============ */
  async function initApp() {
    initTheme();

    try {
      // Initialize IndexedDB
      await window.agentDB.init();
      await reloadAgentsFromDB();
      handleUrlParams();
      console.log('Recruiting Agents CRM initialized with full database persistence and mobile optimization.');
    } catch (err) {
      console.error('Failed to initialize database:', err);
      if (window.INITIAL_AGENTS) {
        allAgents = window.INITIAL_AGENTS.map(a => ({ ...a }));
        refreshStateOptions();
        refreshDistrictOptions();
        render();
      }
      showToast('Operating in memory mode.', 'error');
    }
  }

  // Start app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
