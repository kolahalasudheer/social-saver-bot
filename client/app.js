/* =====================================================
   app.js — ReelSave Dashboard (v2 — with Sidebar)
   ===================================================== */

const API_URL = '/api/reels';

let allReels = [];
let activeCategory = 'all';
let activeDateFilter = 'all'; // 'all' | 'today' | 'yesterday' | 'week' | 'month'
let searchQuery = '';
let sortOrder = 'newest'; // 'newest' | 'oldest'

// ─── Category config ──────────────────────────────
const CATS = {
    Education: { emoji: '📚', color: '#60a5fa', dot: '#3b82f6' },
    Tech: { emoji: '💻', color: '#c4b5fd', dot: '#7C3AED' },
    Fitness: { emoji: '💪', color: '#4ade80', dot: '#22c55e' },
    Motivation: { emoji: '🔥', color: '#fbbf24', dot: '#f59e0b' },
    Business: { emoji: '💼', color: '#22d3ee', dot: '#06b6d4' },
    Entertainment: { emoji: '🎭', color: '#f472b6', dot: '#ec4899' },
    Lifestyle: { emoji: '✨', color: '#fb923c', dot: '#f97316' },
    Other: { emoji: '🌀', color: '#6b7280', dot: '#4b5563' },
};

// ─── Sidebar ──────────────────────────────────────
window.openSidebar = function () {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
};

window.closeSidebar = function () {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
    document.body.style.overflow = '';
};

window.setSidebarFilter = function (cat) {
    closeSidebar();
    activeCategory = cat === 'random' ? 'random' : cat;
    updateFilterButtons(cat);
    renderReels();
};

// ─── Sort ─────────────────────────────────────────
window.toggleSort = function () {
    sortOrder = sortOrder === 'newest' ? 'oldest' : 'newest';
    document.getElementById('sortBtn').textContent =
        sortOrder === 'newest' ? 'Sort: Latest ↓' : 'Sort: Oldest ↑';
    renderReels();
};

// ─── Category filter (pill) ───────────────────────
window.applyCategory = function (cat) {
    activeCategory = cat;
    updateFilterButtons(cat);
    renderReels();
};

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        updateFilterButtons(activeCategory);
        renderReels();
    });
});

// ─── Date filter buttons ──────────────────────────
document.querySelectorAll('.date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        activeDateFilter = btn.dataset.date;
        document.querySelectorAll('.date-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.date === activeDateFilter)
        );
        renderReels();
    });
});

// Returns { start: Date, end: Date } or null for 'all'
function getDateRange(filter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (filter === 'today') {
        return { start: today, end: now };
    }
    if (filter === 'yesterday') {
        const yest = new Date(today); yest.setDate(yest.getDate() - 1);
        return { start: yest, end: today };
    }
    if (filter === 'week') {
        const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 6);
        return { start: weekAgo, end: now };
    }
    if (filter === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart, end: now };
    }
    return null; // 'all'
}

function updateFilterButtons(cat) {
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.cat === cat);
    });

    // Also update sidebar active state
    document.querySelectorAll('.sidebar-nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.cat === cat) el.classList.add('active');
    });
}

// ─── Search ───────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value;
    renderReels();
});

// ─── Fetch ────────────────────────────────────────
async function loadReels() {
    showSkeletons();
    hideStates();

    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        allReels = json.data || [];
        updateStats();
        populateSidebarBuckets();
        updateFilterCounts();
        renderReels();
    } catch (err) {
        console.error('Failed to load reels:', err);
        showError();
    }
}

// ─── Stats Row ────────────────────────────────────
function updateStats() {
    const total = allReels.length;
    document.getElementById('statTotal').textContent = total;

    // Top category
    const catCount = {};
    allReels.forEach(r => { if (r.category) catCount[r.category] = (catCount[r.category] || 0) + 1; });
    const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
        const cfg = CATS[topCat[0]] || {};
        document.getElementById('statTopCat').textContent = (cfg.emoji || '') + ' ' + topCat[0];
        document.getElementById('statTopCount').textContent = topCat[1] + ' saves';
    }

    // Completed
    const done = allReels.filter(r => r.status === 'completed').length;
    document.getElementById('statDone').textContent = done;

    // Categories
    document.getElementById('statCats').textContent = Object.keys(catCount).length;

    // Sidebar all count
    document.getElementById('sidebarAllCount').textContent = total;
    document.getElementById('sidebarAvatar').textContent =
        allReels[0]?.user_phone ? allReels[0].user_phone.slice(-4) : 'U';
}

// ─── Sidebar Buckets ──────────────────────────────
function populateSidebarBuckets() {
    const catCount = {};
    allReels.forEach(r => { if (r.category) catCount[r.category] = (catCount[r.category] || 0) + 1; });

    const container = document.getElementById('sidebarBuckets');
    container.innerHTML = '';

    Object.entries(catCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
            const cfg = CATS[cat] || { dot: '#6b7280', emoji: '🌀' };
            const a = document.createElement('a');
            a.className = 'sidebar-nav-item';
            a.href = '#';
            a.dataset.cat = cat;
            a.innerHTML = `
        <span class="bucket-dot" style="background:${cfg.dot}"></span>
        <span class="sidebar-nav-text">${cat}</span>
        <span class="sidebar-nav-count">${count}</span>
      `;
            a.addEventListener('click', e => {
                e.preventDefault();
                activeCategory = cat;
                updateFilterButtons(cat);
                closeSidebar();
                renderReels();
            });
            container.appendChild(a);
        });
}

// ─── Filter Counts on pills ───────────────────────
function updateFilterCounts() {
    const allCount = document.getElementById('fc-all');
    if (allCount) allCount.textContent = allReels.length;
}

// ─── Render ───────────────────────────────────────
function renderReels() {
    const feed = document.getElementById('feed');
    feed.innerHTML = '';

    let reels = [...allReels];

    // Sort
    reels.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Date filter
    const dateRange = getDateRange(activeDateFilter);
    if (dateRange) {
        reels = reels.filter(r => {
            const d = new Date(r.created_at || 0);
            return d >= dateRange.start && d <= dateRange.end;
        });
    }

    // Category / random
    if (activeCategory === 'random') {
        const idx = Math.floor(Math.random() * reels.length);
        reels = reels.length > 0 ? [reels[idx]] : [];
    } else if (activeCategory !== 'all') {
        reels = reels.filter(r => r.category === activeCategory);
    }

    // Search
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        reels = reels.filter(r =>
            (r.caption || '').toLowerCase().includes(q) ||
            (r.username || '').toLowerCase().includes(q) ||
            (r.summary || '').toLowerCase().includes(q) ||
            (r.category || '').toLowerCase().includes(q)
        );
    }

    if (reels.length === 0) { showEmpty(); return; }

    reels.forEach((reel, i) => {
        feed.appendChild(createCard(reel, i));
    });
}

// ─── Card Builder ─────────────────────────────────
function createCard(reel, index) {
    const card = document.createElement('div');

    // Normalise category to match CATS keys (handles 'tech', 'TECH', 'Tech' etc.)
    const rawCat = reel.category || 'Other';
    const cat = Object.keys(CATS).find(k => k.toLowerCase() === rawCat.toLowerCase()) || 'Other';
    const cfg = CATS[cat] || CATS.Other;


    card.className = `reel-card cat-${cat}`;
    card.style.animationDelay = `${index * 50}ms`;

    // ── Thumbnail with play overlay ──
    let thumbHtml;
    if (reel.thumbnail_url) {
        thumbHtml = `
          <div class="card-thumb-wrap">
            <img src="${esc(reel.thumbnail_url)}" alt="thumb" loading="lazy"
              onerror="this.parentElement.innerHTML='<span class=card-thumb-emoji>${cfg.emoji}</span>'" />
            <span class="play-icon">▶</span>
          </div>`;
    } else {
        thumbHtml = `<div class="card-thumb-wrap"><span class="card-thumb-emoji">${cfg.emoji}</span></div>`;
    }

    // ── AI Summary (primary title) ──
    // Skip caption if it looks like raw hashtags (starts with #, mostly hashtags)
    const rawCaption = reel.caption || '';
    const isHashtagCaption = rawCaption.trim().startsWith('#') ||
        (rawCaption.match(/#\w+/g) || []).length > rawCaption.trim().split(/\s+/).length * 0.6;
    const title = reel.summary || (isHashtagCaption ? null : rawCaption) || 'No description available';

    // ── Intent badge ──
    const intentMap = { learn: '📖 Learn', try: '🏋️ Try', watch: '🎬 Watch', save: '💾 Save', apply: '✅ Apply' };
    const intentLabel = reel.intent ? (intentMap[reel.intent.toLowerCase()] || `✨ ${reel.intent}`) : null;

    // ── Hashtags (max 2 only, keep them clean) ──
    let hashtags = [];
    try { hashtags = typeof reel.hashtags === 'string' ? JSON.parse(reel.hashtags) : (reel.hashtags || []); }
    catch { hashtags = []; }
    // Only show hashtags that don't look excessively long
    const cleanTags = hashtags.filter(t => t && t.length < 20).slice(0, 2);
    const tagHtml = cleanTags.map(t => `<span class="hashtag">${esc(t)}</span>`).join('');

    // ── Date & creator ──
    const date = reel.created_at ? relativeDate(reel.created_at) : '';
    const creator = reel.username ? `@${reel.username}` : '';

    card.innerHTML = `
    ${thumbHtml}
    <div class="card-content">
      <div class="card-badges">
        <span class="cat-badge cat-badge-${cat}">${cfg.emoji} ${cat}</span>
        ${intentLabel ? `<span class="intent-badge">${intentLabel}</span>` : ''}
        <span class="card-date-badge">${esc(date)}</span>
      </div>
      <p class="card-title">${esc(title)}</p>
      <div class="card-meta">
        ${creator ? `<span class="card-creator">${esc(creator)}</span>` : ''}
        ${tagHtml ? `<span class="card-tags">${tagHtml}</span>` : ''}
      </div>
    </div>
  `;

    // Tap to open reel
    const link = reel.canonical_url || reel.url;
    if (link) card.addEventListener('click', () => window.open(link, '_blank', 'noopener'));

    return card;
}

// ─── Helpers ──────────────────────────────────────
function relativeDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return 'Today';
    if (diff < 172800) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}


function showSkeletons() {
    document.getElementById('feed').innerHTML =
        `<div class="skeleton-card"></div>
     <div class="skeleton-card"></div>
     <div class="skeleton-card"></div>`;
}

function hideStates() {
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
}

function showEmpty() {
    document.getElementById('feed').innerHTML = '';
    document.getElementById('emptyState').classList.remove('hidden');
}

function showError() {
    document.getElementById('feed').innerHTML = '';
    document.getElementById('errorState').classList.remove('hidden');
}

function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Boot ─────────────────────────────────────────
loadReels();
