/* =====================================================
   app.js — ReelSave Dashboard (v2 — with Sidebar)
   ===================================================== */

const API_URL = '/api/reels';

let allReels = [];
let currentUserPhone = localStorage.getItem('social_saver_phone') || null;
let activeCategory = 'all';
let activeIntentFilter = 'all';
let activeDateFilter = 'all'; // 'all' | 'today' | 'yesterday' | 'week' | 'month'
let searchQuery = '';
let sortOrder = 'newest'; // 'newest' | 'oldest'

// ─── Category config ──────────────────────────────
const CATS = {
    Jobs: { emoji: '💼', color: '#60a5fa', dot: '#3b82f6' },
    Coding: { emoji: '👨‍💻', color: '#60a5fa', dot: '#3b82f6' },
    Gym: { emoji: '🏋️', color: '#4ade80', dot: '#22c55e' },
    Cooking: { emoji: '🍳', color: '#fb923c', dot: '#f97316' },
    Gaming: { emoji: '🎮', color: '#c4b5fd', dot: '#7C3AED' },
    Tech: { emoji: '💻', color: '#22d3ee', dot: '#06b6d4' },
    Finance: { emoji: '💰', color: '#fbbf24', dot: '#f59e0b' },
    Motivation: { emoji: '🔥', color: '#fbbf24', dot: '#f59e0b' },
    Business: { emoji: '💼', color: '#60a5fa', dot: '#3b82f6' },
    Lifestyle: { emoji: '✨', color: '#f472b6', dot: '#ec4899' },
    Travel: { emoji: '✈️', color: '#22d3ee', dot: '#06b6d4' },
    Entertainment: { emoji: '🎭', color: '#f472b6', dot: '#ec4899' },
    Education: { emoji: '📚', color: '#60a5fa', dot: '#3b82f6' },
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

// ─── Filter Dropdown Toggle ───────────────────────
window.toggleFilterDropdown = function () {
    const panel = document.getElementById('filterPanel');
    panel.classList.toggle('hidden');
};

window.clearAllFilters = function () {
    activeCategory = 'all';
    activeIntentFilter = 'all';
    activeDateFilter = 'all';

    // Reset UI pills
    document.querySelectorAll('.f-pill').forEach(b => b.classList.toggle('active', b.dataset.cat === 'all'));
    document.querySelectorAll('.i-pill').forEach(b => b.classList.toggle('active', b.dataset.intent === 'all'));
    document.querySelectorAll('.d-pill').forEach(b => b.classList.toggle('active', b.dataset.date === 'all'));

    updateSidebarActiveState('all');
    updateFilterActiveDot();
    renderReels();
};

// Update the red dot indicator if any filter is active
function updateFilterActiveDot() {
    const dot = document.getElementById('filterActiveDot');
    if (activeCategory !== 'all' || activeIntentFilter !== 'all' || activeDateFilter !== 'all') {
        dot.classList.remove('hidden');
    } else {
        dot.classList.add('hidden');
    }
}

// ─── Filter logic (pills) ─────────────────────────
// Category Pills
document.querySelectorAll('.f-pill').forEach(btn => {
    btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        document.querySelectorAll('.f-pill').forEach(b => b.classList.toggle('active', b.dataset.cat === activeCategory));
        updateSidebarActiveState(activeCategory);
        updateFilterActiveDot();
        renderReels();
    });
});

window.setSidebarFilter = function (cat) {
    closeSidebar();
    activeCategory = cat === 'random' ? 'random' : cat;
    document.querySelectorAll('.f-pill').forEach(b => b.classList.toggle('active', b.dataset.cat === activeCategory));
    updateSidebarActiveState(cat);
    updateFilterActiveDot();
    renderReels();
};

function updateSidebarActiveState(cat) {
    document.querySelectorAll('.sidebar-nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.cat === cat || (cat === 'all' && el.dataset.cat === undefined && el.textContent.includes('All Saves'))) {
            el.classList.add('active');
        }
    });
}

// Intent Pills
document.querySelectorAll('.i-pill').forEach(btn => {
    btn.addEventListener('click', () => {
        activeIntentFilter = btn.dataset.intent;
        document.querySelectorAll('.i-pill').forEach(b => b.classList.toggle('active', b.dataset.intent === activeIntentFilter));
        updateFilterActiveDot();
        renderReels();
    });
});

// Date Pills
document.querySelectorAll('.d-pill').forEach(btn => {
    btn.addEventListener('click', () => {
        activeDateFilter = btn.dataset.date;
        document.querySelectorAll('.d-pill').forEach(b => b.classList.toggle('active', b.dataset.date === activeDateFilter));
        updateFilterActiveDot();
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

// ─── Sort ─────────────────────────────────────────
window.toggleSort = function () {
    sortOrder = sortOrder === 'newest' ? 'oldest' : 'newest';
    document.getElementById('sortBtn').textContent =
        sortOrder === 'newest' ? 'Sort: Latest ↓' : 'Sort: Oldest ↑';
    renderReels();
};

// ─── Search ───────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value;
    renderReels();
});

// ─── Fetch ────────────────────────────────────────
async function loadReels() {
    if (!currentUserPhone) return;

    showSkeletons();
    hideStates();

    try {
        const url = new URL(API_URL, window.location.origin);
        url.searchParams.append('phone', currentUserPhone);

        const res = await fetch(url);
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

    // Starred count
    const starredTotal = allReels.filter(r => r.is_starred).length;
    document.getElementById('sidebarStarredCount').textContent = starredTotal;

    // Sidebar all count
    document.getElementById('sidebarAllCount').textContent = total;

    // Set Profile Info
    document.getElementById('sidebarPhone').textContent = currentUserPhone || 'WhatsApp User';
    const avatarChar = currentUserPhone ? currentUserPhone.replace(/\D/g, '').slice(-1) : 'U';
    document.getElementById('sidebarAvatar').textContent = avatarChar || 'U';
    document.getElementById('headerAvatar').textContent = avatarChar || 'R';
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
                document.querySelectorAll('.f-pill').forEach(b => b.classList.toggle('active', b.dataset.cat === activeCategory));
                updateSidebarActiveState(activeCategory);
                updateFilterActiveDot();
                closeSidebar();
                renderReels();
            });
            container.appendChild(a);
        });
}

// ─── Filter Counts on pills ───────────────────────
function updateFilterCounts() {
    // We could wire this up to the new pills if desired
}

// ─── Render ───────────────────────────────────────
function renderReels() {
    const feed = document.getElementById('feed');
    feed.innerHTML = '';

    let reels = [...allReels];

    // Filter by category / starred
    if (activeCategory === 'starred') {
        reels = reels.filter(r => r.is_starred);
    } else if (activeCategory !== 'all' && activeCategory !== 'random') {
        reels = reels.filter(r => r.category === activeCategory);
    }
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
    } else if (activeCategory !== 'all' && activeCategory !== 'starred') {
        reels = reels.filter(r => r.category === activeCategory);
    }

    // Intent Filter
    if (activeIntentFilter !== 'all') {
        reels = reels.filter(r => {
            if (!r.intent) return false;
            // API might return "Educational", pill dataset is "educational"
            return r.intent.toLowerCase() === activeIntentFilter.toLowerCase();
        });
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
            <img src="/api/proxy/image?url=${encodeURIComponent(reel.thumbnail_url)}" alt="thumb" loading="lazy" referrerpolicy="no-referrer"
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

    // Tap to open detailed modal
    card.addEventListener('click', () => {
        openReelModal(reel.id);
    });

    return card;
}

// ─── Reel Details Modal ───────────────────────────
window.openReelModal = function (id) {
    const reel = allReels.find(r => r.id === id);
    if (!reel) return;

    // Normalise category
    const rawCat = reel.category || 'Other';
    const cat = Object.keys(CATS).find(k => k.toLowerCase() === rawCat.toLowerCase()) || 'Other';
    const cfg = CATS[cat] || CATS.Other;

    // Intent
    const intentMap = { learn: '📖 Learn', try: '🏋️ Try', watch: '🎬 Watch', save: '💾 Save', apply: '✅ Apply' };
    const intentLabel = reel.intent ? (intentMap[reel.intent.toLowerCase()] || `✨ ${reel.intent}`) : null;

    // Date
    const dateStr = reel.created_at ? relativeDate(reel.created_at) : '';

    // Tags
    let hashtags = [];
    try { hashtags = typeof reel.hashtags === 'string' ? JSON.parse(reel.hashtags) : (reel.hashtags || []); }
    catch { hashtags = []; }
    const cleanTags = hashtags.filter(t => t && t.length < 20).slice(0, 5);

    const overlay = document.getElementById('reelModalOverlay');

    // Star icon in header
    const starIcon = reel.is_starred ? '⭐' : '☆';
    const header = document.querySelector('#reelModal .rm-header');
    let starBtn = header.querySelector('.rm-star-btn');
    if (!starBtn) {
        starBtn = document.createElement('button');
        starBtn.className = 'rm-star-btn';
        header.insertBefore(starBtn, header.firstChild);
    }
    starBtn.textContent = starIcon;
    starBtn.onclick = (e) => {
        e.stopPropagation();
        toggleStar(reel.id);
        // Visual feedback immediately
        const isNowStarred = !reel.is_starred;
        starBtn.textContent = isNowStarred ? '⭐' : '☆';
    };

    // Inject Data
    document.getElementById('rmCreator').textContent = reel.username ? `@${reel.username}` : 'Unknown Creator';

    const thumb = document.getElementById('rmThumbnail');
    if (reel.thumbnail_url) {
        thumb.src = '/api/proxy/image?url=' + encodeURIComponent(reel.thumbnail_url);
        thumb.referrerPolicy = "no-referrer";
        thumb.style.display = 'block';
    } else {
        thumb.style.display = 'none';
    }

    // Badges
    let badgesHtml = `<span class="cat-badge cat-badge-${cat}">${cfg.emoji} ${cat}</span>`;
    if (intentLabel) badgesHtml += `<span class="intent-badge">${intentLabel}</span>`;
    badgesHtml += `<span class="card-date-badge">${esc(dateStr)}</span>`;
    document.getElementById('rmBadges').innerHTML = badgesHtml;

    // Text Content
    const rawCaption = reel.caption || '';
    const isHashtagCaption = rawCaption.trim().startsWith('#') || (rawCaption.match(/#\w+/g) || []).length > rawCaption.trim().split(/\s+/).length * 0.6;
    const title = reel.summary || (isHashtagCaption ? null : rawCaption) || 'No description available';

    document.getElementById('rmTitle').textContent = title;
    // Show original caption below if AI summary exists and caption isn't just hashtags
    if (reel.summary && rawCaption && !isHashtagCaption && rawCaption !== reel.summary) {
        document.getElementById('rmCaption').textContent = rawCaption;
        document.getElementById('rmCaption').style.display = 'block';
    } else {
        document.getElementById('rmCaption').style.display = 'none';
    }

    // Tags
    const tagHtml = cleanTags.map(t => `<span class="hashtag">${esc(t)}</span>`).join('');
    document.getElementById('rmTags').innerHTML = tagHtml;

    // CTA
    const btn = document.getElementById('rmCtaBtn');
    const link = reel.canonical_url || reel.url;
    btn.onclick = () => {
        if (link) window.open(link, '_blank', 'noopener');
    };

    // Show Modal
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Handle Reminder
    const reminderBtn = document.getElementById('rmSetReminderBtn');
    const reminderInput = document.getElementById('rmReminderInput');
    const statusEl = document.getElementById('rmReminderStatus');

    // Reset UI
    statusEl.classList.add('hidden');
    statusEl.textContent = '';
    reminderInput.value = '';

    reminderBtn.onclick = async () => {
        const value = reminderInput.value;
        if (!value) {
            showReminderStatus('Please select a date and time', 'error');
            return;
        }

        try {
            reminderBtn.disabled = true;
            reminderBtn.textContent = 'Setting...';

            const res = await fetch(`${API_URL}/${reel.id}/reminders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    remindAt: value,
                    userPhone: currentUserPhone
                })
            });

            const json = await res.json();
            if (res.ok) {
                showReminderStatus(`🔔 Reminder set for ${json.data.formattedTime}`, 'success');
                // Auto-clear success message after 3s
                setTimeout(() => statusEl.classList.add('hidden'), 5000);
            } else {
                showReminderStatus(json.error || 'Failed to set reminder', 'error');
            }
        } catch (err) {
            showReminderStatus('Network error. Try again.', 'error');
        } finally {
            reminderBtn.disabled = false;
            reminderBtn.textContent = 'Notify Me';
        }
    };

    function showReminderStatus(msg, type) {
        statusEl.textContent = msg;
        statusEl.className = `rm-reminder-status ${type}`;
        statusEl.classList.remove('hidden');
    }
};

window.closeReelModal = function () {
    const overlay = document.getElementById('reelModalOverlay');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
};

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

// ─── Interaction ──────────────────────────────────
window.toggleStar = async function (id) {
    try {
        const res = await fetch(`${API_URL}/${id}/star?phone=${currentUserPhone}`, { method: 'PATCH' });
        if (!res.ok) throw new Error('Failed to star');

        const json = await res.json();
        const updated = json.data;

        // Update local state
        const idx = allReels.findIndex(r => r.id == id);
        if (idx !== -1) {
            allReels[idx].is_starred = updated.is_starred;
        }

        updateStats();
        // Don't re-render everything instantly if we are just toggling in the modal
        // but if we are in the feed, we probably want to See the star change.
        // For simplicity, re-render feed:
        renderReels();

    } catch (err) {
        console.error('Star error:', err);
    }
};

function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Authentication Logic ─────────────────────────
function checkAuth() {
    const overlay = document.getElementById('authModalOverlay');
    if (!currentUserPhone) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
        loadReels();
    }
}

async function requestOTP() {
    const phoneInput = document.getElementById('authPhoneInput');
    const phone = phoneInput.value.trim();
    const errorEl = document.getElementById('authError');

    if (!phone) {
        showAuthError('Please enter your phone number');
        return;
    }

    try {
        toggleAuthLoading(true);
        const res = await fetch('/api/auth/request-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const json = await res.json();

        if (res.ok) {
            document.getElementById('authStepPhone').classList.add('hidden');
            document.getElementById('authStepOtp').classList.remove('hidden');
            errorEl.classList.add('hidden');
        } else {
            showAuthError(json.error || 'Failed to send OTP');
        }
    } catch (err) {
        showAuthError('Connection error. Is the server running?');
    } finally {
        toggleAuthLoading(false);
    }
}

async function verifyOTP() {
    const phone = document.getElementById('authPhoneInput').value.trim();
    const code = document.getElementById('authOtpInput').value.trim();

    if (!code) {
        showAuthError('Please enter the verification code');
        return;
    }

    try {
        toggleAuthLoading(true);
        const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, code })
        });
        const json = await res.json();

        if (res.ok) {
            currentUserPhone = phone;
            localStorage.setItem('social_saver_phone', phone);
            checkAuth(); // This will hide modal and load reels
        } else {
            showAuthError(json.error || 'Invalid code');
        }
    } catch (err) {
        showAuthError('Verification failed. Try again.');
    } finally {
        toggleAuthLoading(false);
    }
}

function showAuthError(msg) {
    const errorEl = document.getElementById('authError');
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
}

function toggleAuthLoading(isLoading) {
    const btns = document.querySelectorAll('.auth-btn');
    btns.forEach(b => b.disabled = isLoading);
}

// Attach Event Listeners
document.getElementById('authRequestOtpBtn').addEventListener('click', requestOTP);
document.getElementById('authVerifyOtpBtn').addEventListener('click', verifyOTP);
document.getElementById('authBackBtn').addEventListener('click', () => {
    document.getElementById('authStepPhone').classList.remove('hidden');
    document.getElementById('authStepOtp').classList.add('hidden');
    document.getElementById('authError').classList.add('hidden');
});

window.logout = function () {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('social_saver_phone');
        currentUserPhone = null;
        window.location.reload();
    }
};

// ─── Boot ─────────────────────────────────────────
checkAuth();
