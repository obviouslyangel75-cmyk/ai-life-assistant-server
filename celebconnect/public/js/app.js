(() => {
  'use strict';

  const REACTIONS = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'haha', emoji: '😆', label: 'Haha (LOL)' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'angry', emoji: '😡', label: 'Angry' },
  ];
  const REACTION_MAP = Object.fromEntries(REACTIONS.map(r => [r.type, r]));
  const CATEGORIES = ['Music', 'Film & TV', 'Sports', 'Comedy', 'Internet', 'Fashion'];

  const state = {
    token: localStorage.getItem('cc_token') || null,
    fan: null,
    plans: [],
    view: { mode: 'feed', category: null }, // feed | following | category | plans
    feedPage: 0,
    feedHasMore: true,
    feedLoading: false,
    recorders: new Map(), // postId -> { mediaRecorder, chunks, startedAt, timerInterval }
  };

  // ---------- helpers ----------
  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function timeAgo(iso) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    if (diff < 2592000) return Math.floor(diff / 86400) + 'd';
    return Math.floor(diff / 2592000) + 'mo';
  }
  function toast(msg) {
    const root = document.getElementById('toastRoot');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
  async function api(path, opts = {}) {
    const headers = Object.assign({}, opts.headers || {});
    if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
    const res = await fetch(path, Object.assign({}, opts, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }
  function badgeHtml(badge) {
    return badge ? `<span class="badge ${badge}">${badge}</span>` : '';
  }

  // ---------- auth ----------
  function setSession(token, fan) {
    state.token = token;
    state.fan = fan;
    if (token) localStorage.setItem('cc_token', token);
    else localStorage.removeItem('cc_token');
    renderNav();
    renderPlanWidget();
  }
  async function loadMe() {
    if (!state.token) return;
    try {
      const { fan } = await api('/api/auth/me');
      state.fan = fan;
    } catch (e) {
      state.token = null;
      localStorage.removeItem('cc_token');
    }
    renderNav();
    renderPlanWidget();
  }

  function renderNav() {
    const el = document.getElementById('navRight');
    if (state.fan) {
      el.innerHTML = `
        <div class="user-chip" id="userChip">
          <img src="${state.fan.avatar_url}" alt="">
          <span>${escapeHtml(state.fan.name)} ${badgeHtml(state.fan.plan !== 'free' ? state.fan.planName : null)}</span>
        </div>
        <button class="btn secondary small" id="logoutBtn">Log out</button>
      `;
      document.getElementById('logoutBtn').onclick = () => { setSession(null, null); toast('Logged out.'); };
    } else {
      el.innerHTML = `
        <button class="btn secondary small" id="loginBtn">Log in</button>
        <button class="btn small" id="signupBtn">Sign up</button>
      `;
      document.getElementById('loginBtn').onclick = () => openAuthModal('login');
      document.getElementById('signupBtn').onclick = () => openAuthModal('signup');
    }
  }

  // ---------- modal helpers ----------
  function openModal(html, opts = {}) {
    const root = document.getElementById('modalRoot');
    root.innerHTML = `<div class="modal-overlay" id="modalOverlay"><div class="modal ${opts.wide ? 'wide' : ''}">
      <button class="close-btn" id="modalClose">✕</button>
      ${html}
    </div></div>`;
    document.getElementById('modalClose').onclick = closeModal;
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'modalOverlay') closeModal();
    });
  }
  function closeModal() { document.getElementById('modalRoot').innerHTML = ''; }

  function openAuthModal(mode) {
    openModal(`
      <div class="tab-row">
        <button data-tab="login" class="${mode === 'login' ? 'active' : ''}">Log in</button>
        <button data-tab="signup" class="${mode === 'signup' ? 'active' : ''}">Sign up</button>
      </div>
      <form id="authForm">
        <div class="field signup-only ${mode === 'signup' ? '' : 'hidden'}">
          <label>Name</label>
          <input type="text" name="name" placeholder="Your name">
        </div>
        <div class="field">
          <label>Email</label>
          <input type="email" name="email" required>
        </div>
        <div class="field">
          <label>Password</label>
          <input type="password" name="password" required minlength="6">
        </div>
        <div class="form-error" id="authError"></div>
        <button class="btn" style="width:100%" type="submit">${mode === 'login' ? 'Log in' : 'Create account'}</button>
      </form>
    `);
    let currentMode = mode;
    const tabs = document.querySelectorAll('#modalRoot [data-tab]');
    tabs.forEach(t => t.onclick = () => {
      currentMode = t.dataset.tab;
      tabs.forEach(x => x.classList.toggle('active', x === t));
      document.querySelector('.signup-only').classList.toggle('hidden', currentMode !== 'signup');
      document.querySelector('#authForm button[type=submit]').textContent = currentMode === 'login' ? 'Log in' : 'Create account';
    });
    document.getElementById('authForm').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const errorEl = document.getElementById('authError');
      errorEl.textContent = '';
      try {
        const payload = { email: fd.get('email'), password: fd.get('password') };
        if (currentMode === 'signup') payload.name = fd.get('name');
        const data = await api(`/api/auth/${currentMode}`, { method: 'POST', body: JSON.stringify(payload) });
        setSession(data.token, data.fan);
        closeModal();
        toast(currentMode === 'login' ? `Welcome back, ${data.fan.name}!` : `Welcome to CelebConnect, ${data.fan.name}!`);
        refreshCurrentView();
      } catch (err) {
        errorEl.textContent = err.message;
      }
    };
  }

  // ---------- plans / subscription ----------
  async function loadPlans() {
    const data = await api('/api/plans');
    state.plans = data.plans;
    state.paymentMode = data.mode;
  }

  function renderPlanWidget() {
    const el = document.getElementById('planWidget');
    if (!state.fan) {
      el.innerHTML = `<h4>Unlock more</h4><p class="current">Sign up to follow stars, comment and go VIP.</p>
        <button class="btn pill" style="width:100%" id="widgetSignup">Get started</button>`;
      document.getElementById('widgetSignup').onclick = () => openAuthModal('signup');
      return;
    }
    const planName = state.fan.plan === 'free' ? 'Fan (Free)' : state.fan.planName;
    el.innerHTML = `<h4>Your plan</h4>
      <p class="current">You're on <strong>${planName}</strong> ${badgeHtml(state.fan.plan !== 'free' ? state.fan.planName : null)}</p>
      <button class="btn pill" style="width:100%" id="widgetUpgrade">${state.fan.plan === 'free' ? 'Upgrade plan' : 'Manage plan'}</button>`;
    document.getElementById('widgetUpgrade').onclick = openPlansModal;
  }

  async function openPlansModal() {
    if (state.plans.length === 0) await loadPlans();
    const cards = state.plans.map(p => {
      const isCurrent = state.fan && state.fan.plan === p.id;
      return `<div class="plan-card ${isCurrent ? 'current' : ''}">
        <h3>${p.name}</h3>
        <div class="price">${p.price === 0 ? 'Free' : '$' + p.price.toFixed(2)} ${p.price > 0 ? '<span>/ month</span>' : ''}</div>
        <ul>${p.perks.map(perk => `<li>${escapeHtml(perk)}</li>`).join('')}</ul>
        <button class="btn ${isCurrent ? 'secondary' : ''} pill" data-plan="${p.id}" ${isCurrent ? 'disabled' : ''}>
          ${isCurrent ? 'Current plan' : (p.id === 'free' ? 'Downgrade' : 'Subscribe')}
        </button>
      </div>`;
    }).join('');
    openModal(`<h2>Choose your plan</h2>
      <p style="text-align:center;color:var(--muted);margin-top:-8px;">${state.paymentMode === 'mock' ? 'Test mode — no real payment is charged.' : 'Secure checkout powered by Stripe.'}</p>
      <div class="plans-grid">${cards}</div>`, { wide: true });

    document.querySelectorAll('#modalRoot [data-plan]').forEach(btn => {
      btn.onclick = async () => {
        if (!state.fan) { closeModal(); openAuthModal('signup'); return; }
        btn.disabled = true;
        btn.textContent = 'Processing...';
        try {
          const data = await api('/api/subscribe', { method: 'POST', body: JSON.stringify({ planId: btn.dataset.plan }) });
          if (data.mode === 'stripe' && data.url) {
            window.location.href = data.url;
            return;
          }
          state.fan = data.fan;
          closeModal();
          renderNav(); renderPlanWidget();
          toast(`You're now subscribed to ${data.fan.planName}!`);
        } catch (err) {
          toast(err.message);
          btn.disabled = false;
        }
      };
    });
  }

  // ---------- sidebar ----------
  function renderCategoryList() {
    const el = document.getElementById('categoryList');
    el.innerHTML = CATEGORIES.map(cat => `<li data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</li>`).join('');
  }

  async function renderSuggestions() {
    const el = document.getElementById('suggestions');
    try {
      const { celebrities } = await api('/api/celebrities');
      const suggested = celebrities.filter(c => !c.following).slice(0, 6);
      el.innerHTML = suggested.map(c => `
        <div class="suggest-row">
          <img src="${c.avatar_url}" alt="">
          <div class="meta">
            <div class="name">${escapeHtml(c.name)} ${c.verified ? '<span class="verified">✔</span>' : ''}</div>
            <div class="followers">${c.followersFormatted} followers</div>
          </div>
          <button class="btn small pill" data-follow="${c.id}">Follow</button>
        </div>
      `).join('') || '<p style="color:var(--muted);font-size:13px;">You follow everyone already!</p>';
      el.querySelectorAll('[data-follow]').forEach(btn => btn.onclick = () => followCelebrity(btn.dataset.follow, btn));
    } catch (e) { /* ignore */ }
  }

  async function followCelebrity(id, btn) {
    if (!state.fan) { openAuthModal('signup'); return; }
    try {
      await api(`/api/celebrities/${id}/follow`, { method: 'POST' });
      toast('Following!');
      if (btn) { btn.textContent = 'Following'; btn.disabled = true; }
      renderSuggestions();
    } catch (e) { toast(e.message); }
  }

  // ---------- feed ----------
  function postCardHtml(post) {
    const r = post.reactions;
    const topEmojiSpans = r.top.map(t => `<span>${REACTION_MAP[t].emoji}</span>`).join('');
    const myReaction = r.myReaction ? REACTION_MAP[r.myReaction] : null;
    return `
    <article class="post card" data-post-id="${post.id}">
      <div class="post-head">
        <img class="avatar" src="${post.celebrity.avatar_url}" alt="">
        <div class="meta">
          <div class="name-line">${escapeHtml(post.celebrity.name)} ${post.celebrity.verified ? '<span class="verified">✔</span>' : ''}</div>
          <div class="sub-line"><span>${post.celebrity.followersFormatted} followers</span> · <span>${timeAgo(post.created_at)}</span> · <span class="category-pill" style="margin:0;">${escapeHtml(post.celebrity.category)}</span></div>
        </div>
      </div>
      <div class="post-body">${escapeHtml(post.content)}</div>
      ${post.image_url ? `<img class="post-image" src="${escapeHtml(post.image_url)}" alt="">` : ''}
      <div class="reaction-strip">
        <div class="emojis">${topEmojiSpans} <span style="margin-left:6px;">${r.totalFormatted}</span></div>
        <div class="comment-count-label" data-role="comment-count">${post.commentCountFormatted} comments</div>
      </div>
      <div class="action-row">
        <button class="action-btn ${myReaction ? 'active' : ''}" data-action="toggle-reaction-popover">
          ${myReaction ? myReaction.emoji + ' ' + myReaction.label : '👍 Like'}
        </button>
        <button class="action-btn" data-action="toggle-comments">💬 Comment</button>
        <button class="action-btn" data-action="share">↗ Share</button>
      </div>
      <div class="comments-section hidden" data-role="comments-section">
        <div data-role="comments-list"></div>
        <div class="load-more-wrap" style="padding:6px 0;">
          <button class="view-more-comments hidden" data-action="load-comments">View more comments</button>
        </div>
        <div class="composer">
          <img class="avatar" src="${state.fan ? state.fan.avatar_url : 'https://api.dicebear.com/9.x/avataaars/svg?seed=guest'}" alt="">
          <div class="composer-input-wrap">
            <input type="text" placeholder="${state.fan ? 'Write a comment...' : 'Log in to comment...'}" data-role="comment-input" ${state.fan ? '' : 'disabled'}>
            <button class="mic-btn" data-action="mic" title="Record a voice note" ${state.fan ? '' : 'disabled'}>🎤</button>
          </div>
        </div>
        <div class="recording-bar hidden" data-role="recording-bar">🔴 Recording... <span data-role="rec-timer">0:00</span>
          <button class="btn small" data-action="stop-recording">Send</button>
          <button class="btn small secondary" data-action="cancel-recording">Cancel</button>
        </div>
      </div>
    </article>`;
  }

  async function loadFeed(reset) {
    if (state.feedLoading) return;
    if (reset) { state.feedPage = 0; state.feedHasMore = true; document.getElementById('feed').innerHTML = ''; }
    if (!state.feedHasMore) return;
    state.feedLoading = true;
    document.getElementById('loadMoreBtn').textContent = 'Loading...';
    try {
      state.feedPage += 1;
      const data = await api(`/api/feed?page=${state.feedPage}&limit=8`);
      const feedEl = document.getElementById('feed');
      data.posts.forEach(post => {
        feedEl.insertAdjacentHTML('beforeend', postCardHtml(post));
      });
      state.feedHasMore = data.hasMore;
      document.getElementById('loadMoreWrap').classList.toggle('hidden', !state.feedHasMore);
    } catch (e) {
      toast(e.message);
    } finally {
      state.feedLoading = false;
      document.getElementById('loadMoreBtn').textContent = 'Show more posts';
    }
  }

  async function loadCelebrityFeed(celebId) {
    const feedEl = document.getElementById('feed');
    feedEl.innerHTML = '<div class="spinner">Loading posts...</div>';
    document.getElementById('loadMoreWrap').classList.add('hidden');
    try {
      const data = await api(`/api/celebrities/${celebId}`);
      feedEl.innerHTML = data.posts.length
        ? data.posts.map(postCardHtml).join('')
        : '<div class="card spinner">No posts yet.</div>';
    } catch (e) { toast(e.message); }
  }

  async function loadFollowingFeed() {
    const feedEl = document.getElementById('feed');
    if (!state.fan) {
      feedEl.innerHTML = '<div class="card spinner">Log in and follow some stars to see them here.</div>';
      document.getElementById('loadMoreWrap').classList.add('hidden');
      return;
    }
    feedEl.innerHTML = '<div class="spinner">Loading...</div>';
    document.getElementById('loadMoreWrap').classList.add('hidden');
    try {
      const { celebrities } = await api('/api/celebrities');
      const following = celebrities.filter(c => c.following);
      if (following.length === 0) {
        feedEl.innerHTML = '<div class="card spinner">You\'re not following anyone yet. Try the suggestions on the right!</div>';
        return;
      }
      const results = await Promise.all(following.map(c => api(`/api/celebrities/${c.id}`)));
      const posts = results.flatMap(r => r.posts).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      feedEl.innerHTML = posts.length ? posts.map(postCardHtml).join('') : '<div class="card spinner">No posts yet from people you follow.</div>';
    } catch (e) { toast(e.message); }
  }

  function refreshCurrentView() {
    if (state.view.mode === 'feed') loadFeed(true);
    else if (state.view.mode === 'following') loadFollowingFeed();
    else if (state.view.mode === 'category') loadCategoryFeed(state.view.category);
    renderSuggestions();
  }

  async function loadCategoryFeed(category) {
    const feedEl = document.getElementById('feed');
    feedEl.innerHTML = '<div class="spinner">Loading...</div>';
    document.getElementById('loadMoreWrap').classList.add('hidden');
    try {
      const { celebrities } = await api(`/api/celebrities?category=${encodeURIComponent(category)}`);
      const results = await Promise.all(celebrities.map(c => api(`/api/celebrities/${c.id}`)));
      const posts = results.flatMap(r => r.posts).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      feedEl.innerHTML = posts.length ? posts.map(postCardHtml).join('') : '<div class="card spinner">No posts in this category yet.</div>';
    } catch (e) { toast(e.message); }
  }

  // ---------- comments ----------
  function commentHtml(c) {
    return `<div class="comment" data-comment-id="${c.id}">
      <img class="avatar" src="${c.author_avatar || ''}" alt="">
      <div>
        <div class="comment-bubble">
          <div class="comment-name">${escapeHtml(c.author_name)} ${badgeHtml(c.badge)}</div>
          ${c.voice_url
            ? `<audio controls src="${escapeHtml(c.voice_url)}"></audio>`
            : `<div class="comment-text">${escapeHtml(c.body)}</div>`}
        </div>
        <div class="comment-meta">
          <span>${timeAgo(c.created_at)}</span>
          <button data-action="react-comment" data-comment-id="${c.id}" class="${c.reactions.myReaction ? 'active' : ''}">
            ${c.reactions.myReaction ? REACTION_MAP[c.reactions.myReaction].label : 'Like'}${c.reactions.total ? ' · ' + c.reactions.totalFormatted : ''}
          </button>
        </div>
      </div>
    </div>`;
  }

  const commentPages = new Map(); // postId -> { page, hasMore }

  async function toggleComments(postEl, postId) {
    const section = postEl.querySelector('[data-role="comments-section"]');
    const wasHidden = section.classList.contains('hidden');
    section.classList.toggle('hidden');
    if (wasHidden && !commentPages.has(postId)) {
      await loadMoreComments(postEl, postId);
    }
  }

  async function loadMoreComments(postEl, postId) {
    const info = commentPages.get(postId) || { page: 0, hasMore: true };
    if (!info.hasMore) return;
    info.page += 1;
    const data = await api(`/api/posts/${postId}/comments?page=${info.page}&limit=15`);
    info.hasMore = data.hasMore;
    commentPages.set(postId, info);
    const list = postEl.querySelector('[data-role="comments-list"]');
    list.insertAdjacentHTML('beforeend', data.comments.map(commentHtml).join(''));
    const moreBtn = postEl.querySelector('[data-action="load-comments"]');
    moreBtn.classList.toggle('hidden', !info.hasMore);
    moreBtn.textContent = `View more comments (${data.total - info.page * 15 > 0 ? data.total - info.page * 15 : 0} left)`;
  }

  async function submitComment(postEl, postId, text) {
    if (!text.trim()) return;
    try {
      const { comment } = await api(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ body: text }) });
      const list = postEl.querySelector('[data-role="comments-list"]');
      list.insertAdjacentHTML('afterbegin', commentHtml(comment));
      bumpCommentCount(postEl, 1);
    } catch (e) { toast(e.message); }
  }

  function bumpCommentCount(postEl, delta) {
    const label = postEl.querySelector('[data-role="comment-count"]');
    const current = parseInt((label.textContent || '0').replace(/[^\d]/g, ''), 10) || 0;
    label.textContent = `${current + delta} comments`;
  }

  // ---------- reactions ----------
  function applyReactionResult(postEl, result) {
    const strip = postEl.querySelector('.reaction-strip .emojis');
    const emojiSpans = result.top.map(t => `<span>${REACTION_MAP[t].emoji}</span>`).join('');
    strip.innerHTML = `${emojiSpans} <span style="margin-left:6px;">${result.totalFormatted}</span>`;
    const btn = postEl.querySelector('[data-action="toggle-reaction-popover"]');
    if (result.myReaction) {
      btn.classList.add('active');
      btn.innerHTML = `${REACTION_MAP[result.myReaction].emoji} ${REACTION_MAP[result.myReaction].label}`;
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '👍 Like';
    }
  }

  async function reactToPost(postEl, postId, type) {
    if (!state.fan) { openAuthModal('signup'); return; }
    try {
      const { reactions } = await api(`/api/posts/${postId}/react`, { method: 'POST', body: JSON.stringify({ type }) });
      applyReactionResult(postEl, reactions);
    } catch (e) { toast(e.message); }
  }

  async function reactToComment(commentEl, commentId) {
    if (!state.fan) { openAuthModal('signup'); return; }
    try {
      const { reactions } = await api(`/api/comments/${commentId}/react`, { method: 'POST', body: JSON.stringify({ type: 'like' }) });
      const btn = commentEl.querySelector('[data-action="react-comment"]');
      btn.classList.toggle('active', !!reactions.myReaction);
      btn.textContent = `${reactions.myReaction ? 'Like' : 'Like'}${reactions.total ? ' · ' + reactions.totalFormatted : ''}`;
    } catch (e) { toast(e.message); }
  }

  function showReactionPopover(postEl, anchorBtn, postId) {
    document.querySelectorAll('.reaction-popover').forEach(p => p.remove());
    const pop = document.createElement('div');
    pop.className = 'reaction-popover';
    pop.innerHTML = REACTIONS.map(r => `<button data-react-type="${r.type}" title="${r.label}">${r.emoji}</button>`).join('');
    anchorBtn.style.position = 'relative';
    anchorBtn.appendChild(pop);
    pop.querySelectorAll('[data-react-type]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        reactToPost(postEl, postId, btn.dataset.reactType);
        pop.remove();
      };
    });
    setTimeout(() => {
      document.addEventListener('click', function closer(ev) {
        if (!pop.contains(ev.target)) { pop.remove(); document.removeEventListener('click', closer); }
      });
    }, 0);
  }

  // ---------- voice notes ----------
  async function startRecording(postEl, postId) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast('Voice notes need microphone access, which isn\'t available in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.start();

      const bar = postEl.querySelector('[data-role="recording-bar"]');
      const timerEl = postEl.querySelector('[data-role="rec-timer"]');
      bar.classList.remove('hidden');
      postEl.querySelector('[data-action="mic"]').classList.add('recording');
      const startedAt = Date.now();
      const timerInterval = setInterval(() => {
        const s = Math.floor((Date.now() - startedAt) / 1000);
        timerEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      }, 250);

      state.recorders.set(postId, { mediaRecorder, chunks, stream, startedAt, timerInterval, mimeType: mimeType || 'audio/webm' });
    } catch (e) {
      toast('Microphone permission was denied.');
    }
  }

  function cleanupRecording(postEl, postId) {
    const rec = state.recorders.get(postId);
    if (rec) {
      clearInterval(rec.timerInterval);
      rec.stream.getTracks().forEach(t => t.stop());
      state.recorders.delete(postId);
    }
    postEl.querySelector('[data-role="recording-bar"]').classList.add('hidden');
    postEl.querySelector('[data-action="mic"]').classList.remove('recording');
  }

  function cancelRecording(postEl, postId) {
    const rec = state.recorders.get(postId);
    if (rec) rec.mediaRecorder.stop();
    cleanupRecording(postEl, postId);
  }

  function stopAndSendRecording(postEl, postId) {
    const rec = state.recorders.get(postId);
    if (!rec) return;
    const duration = (Date.now() - rec.startedAt) / 1000;
    rec.mediaRecorder.onstop = async () => {
      const blob = new Blob(rec.chunks, { type: rec.mimeType });
      cleanupRecording(postEl, postId);
      if (duration < 0.6) { toast('Voice note was too short.'); return; }
      const fd = new FormData();
      fd.append('audio', blob, 'voice-note.webm');
      fd.append('duration', duration.toFixed(1));
      try {
        const { comment } = await api(`/api/posts/${postId}/comments/voice`, { method: 'POST', body: fd });
        const list = postEl.querySelector('[data-role="comments-list"]');
        list.insertAdjacentHTML('afterbegin', commentHtml(comment));
        bumpCommentCount(postEl, 1);
        toast('Voice note posted!');
      } catch (e) { toast(e.message); }
    };
    rec.mediaRecorder.stop();
  }

  // ---------- event delegation ----------
  function wireFeedEvents() {
    const feedEl = document.getElementById('feed');
    feedEl.addEventListener('click', (e) => {
      const postEl = e.target.closest('[data-post-id]');
      if (!postEl) return;
      const postId = postEl.dataset.postId;
      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;
      const action = actionEl.dataset.action;

      if (action === 'toggle-reaction-popover') {
        if (e.detail === 0) return; // ignore synthetic
        showReactionPopover(postEl, actionEl, postId);
      } else if (action === 'toggle-comments') {
        toggleComments(postEl, postId);
      } else if (action === 'load-comments') {
        loadMoreComments(postEl, postId);
      } else if (action === 'share') {
        navigator.clipboard?.writeText(window.location.href).catch(() => {});
        toast('Link copied (demo share).');
      } else if (action === 'mic') {
        if (state.recorders.has(postId)) return;
        startRecording(postEl, postId);
      } else if (action === 'stop-recording') {
        stopAndSendRecording(postEl, postId);
      } else if (action === 'cancel-recording') {
        cancelRecording(postEl, postId);
      } else if (action === 'react-comment') {
        const commentEl = e.target.closest('[data-comment-id]');
        reactToComment(commentEl, actionEl.dataset.commentId);
      }
    });

    feedEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.matches('[data-role="comment-input"]')) {
        const postEl = e.target.closest('[data-post-id]');
        submitComment(postEl, postEl.dataset.postId, e.target.value);
        e.target.value = '';
      }
    });

    document.getElementById('loadMoreBtn').onclick = () => loadFeed(false);
  }

  function wireNavEvents() {
    document.getElementById('navList').addEventListener('click', (e) => {
      const li = e.target.closest('li[data-nav]');
      if (!li) return;
      document.querySelectorAll('#navList li').forEach(x => x.classList.remove('active'));
      li.classList.add('active');
      document.getElementById('searchResults').classList.add('hidden');
      if (li.dataset.nav === 'feed') { state.view = { mode: 'feed' }; loadFeed(true); }
      else if (li.dataset.nav === 'following') { state.view = { mode: 'following' }; loadFollowingFeed(); }
      else if (li.dataset.nav === 'plans') { openPlansModal(); }
    });

    document.getElementById('categoryList').addEventListener('click', (e) => {
      const li = e.target.closest('li[data-category]');
      if (!li) return;
      document.querySelectorAll('#navList li, #categoryList li').forEach(x => x.classList.remove('active'));
      li.classList.add('active');
      document.getElementById('searchResults').classList.add('hidden');
      state.view = { mode: 'category', category: li.dataset.category };
      loadCategoryFeed(li.dataset.category);
    });

    let searchTimer;
    document.getElementById('searchInput').addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      const q = e.target.value.trim();
      if (!q) { document.getElementById('searchResults').classList.add('hidden'); return; }
      searchTimer = setTimeout(() => runSearch(q), 250);
    });
  }

  async function runSearch(q) {
    try {
      const { celebrities } = await api(`/api/celebrities?search=${encodeURIComponent(q)}`);
      const el = document.getElementById('searchResults');
      el.classList.remove('hidden');
      el.innerHTML = `<h4>Results for "${escapeHtml(q)}"</h4>` + (celebrities.length ? celebrities.map(c => `
        <div class="suggest-row" data-open-celeb="${c.id}" style="cursor:pointer;">
          <img src="${c.avatar_url}" alt="">
          <div class="meta">
            <div class="name">${escapeHtml(c.name)} ${c.verified ? '<span class="verified">✔</span>' : ''}</div>
            <div class="followers">${c.followersFormatted} followers · ${escapeHtml(c.category)}</div>
          </div>
        </div>
      `).join('') : '<p style="color:var(--muted)">No celebrities found.</p>');
      el.querySelectorAll('[data-open-celeb]').forEach(row => row.onclick = () => {
        state.view = { mode: 'celeb', id: row.dataset.openCeleb };
        el.classList.add('hidden');
        document.getElementById('searchInput').value = '';
        loadCelebrityFeed(row.dataset.openCeleb);
        document.getElementById('loadMoreWrap').classList.add('hidden');
      });
    } catch (e) { /* ignore */ }
  }

  // ---------- init ----------
  async function init() {
    renderNav();
    renderCategoryList();
    wireNavEvents();
    wireFeedEvents();
    await loadMe();
    await loadPlans();
    renderPlanWidget();
    renderSuggestions();
    loadFeed(true);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
