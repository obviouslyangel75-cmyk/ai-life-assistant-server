(() => {
  'use strict';
  const CATEGORIES = ['Music', 'Film & TV', 'Sports', 'Comedy', 'Internet', 'Fashion'];
  let token = localStorage.getItem('cc_admin_token') || null;

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(path, Object.assign({}, opts, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }
  function openModal(html) {
    document.getElementById('modalRoot').innerHTML = `<div class="modal-overlay" id="modalOverlay"><div class="modal wide">
      <button class="close-btn" id="modalClose">✕</button>${html}</div></div>`;
    document.getElementById('modalClose').onclick = closeModal;
    document.getElementById('modalOverlay').onclick = (e) => { if (e.target.id === 'modalOverlay') closeModal(); };
  }
  function closeModal() { document.getElementById('modalRoot').innerHTML = ''; }

  function showDashboard(show) {
    document.getElementById('loginScreen').classList.toggle('hidden', show);
    document.getElementById('dashboard').classList.toggle('hidden', !show);
  }

  async function loadStats() {
    const s = await api('/api/admin/stats');
    document.getElementById('statGrid').innerHTML = `
      <div class="stat-card"><div class="num">${s.celebrities}</div><div class="label">Celebrities</div></div>
      <div class="stat-card"><div class="num">${s.posts}</div><div class="label">Posts</div></div>
      <div class="stat-card"><div class="num">${s.comments.toLocaleString()}</div><div class="label">Comments</div></div>
      <div class="stat-card"><div class="num">${s.fans}</div><div class="label">Fans</div></div>
      <div class="stat-card"><div class="num">$${s.mrr}</div><div class="label">MRR (${s.activeSubscribers} subs)</div></div>
    `;
  }

  async function loadCelebs() {
    const { celebrities } = await api('/api/admin/celebrities');
    document.getElementById('celebTable').innerHTML = celebrities.map(c => `
      <tr data-id="${c.id}">
        <td><img src="${c.avatar_url}" alt="">${escapeHtml(c.name)}<br><span style="color:var(--muted);font-size:12px;">@${escapeHtml(c.handle)}</span></td>
        <td>${escapeHtml(c.category)}</td>
        <td>${c.followersFormatted}</td>
        <td>${c.verified ? '✔ Verified' : '—'}</td>
        <td class="row-actions">
          <button class="btn small secondary" data-action="edit">Edit</button>
          <button class="btn small secondary" data-action="posts">Posts</button>
          <button class="btn small secondary" data-action="delete">Delete</button>
        </td>
      </tr>
    `).join('');

    document.getElementById('celebTable').querySelectorAll('tr').forEach(tr => {
      const id = tr.dataset.id;
      const c = celebrities.find(x => x.id === id);
      tr.querySelector('[data-action="edit"]').onclick = () => openCelebForm(c);
      tr.querySelector('[data-action="posts"]').onclick = () => openPostsModal(c);
      tr.querySelector('[data-action="delete"]').onclick = async () => {
        if (!confirm(`Delete ${c.name}? This removes all their posts and comments too.`)) return;
        await api(`/api/admin/celebrities/${id}`, { method: 'DELETE' });
        toast('Deleted.');
        refresh();
      };
    });
  }

  function openCelebForm(c) {
    const isEdit = !!c;
    openModal(`
      <h2>${isEdit ? 'Edit celebrity' : 'New celebrity'}</h2>
      <form id="celebForm">
        <div class="field"><label>Name</label><input name="name" value="${c ? escapeHtml(c.name) : ''}" required></div>
        ${isEdit ? '' : `<div class="field"><label>Handle</label><input name="handle" required placeholder="e.g. novareyes"></div>`}
        <div class="field"><label>Category</label>
          <select name="category">${CATEGORIES.map(cat => `<option ${c && c.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Avatar URL</label><input name="avatar_url" value="${c ? escapeHtml(c.avatar_url) : ''}" placeholder="https://..."></div>
        <div class="field"><label>Bio</label><textarea name="bio" rows="3">${c ? escapeHtml(c.bio) : ''}</textarea></div>
        <div class="field"><label>Followers</label><input type="number" name="followers" min="0" value="${c ? c.followers : 1000000}"></div>
        <div class="field"><label><input type="checkbox" name="verified" ${!c || c.verified ? 'checked' : ''} style="width:auto;display:inline;"> Verified (blue check)</label></div>
        <div class="form-error" id="celebFormError"></div>
        <button class="btn" style="width:100%" type="submit">${isEdit ? 'Save changes' : 'Create celebrity'}</button>
      </form>
    `);
    document.getElementById('celebForm').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = {
        name: fd.get('name'),
        category: fd.get('category'),
        avatar_url: fd.get('avatar_url'),
        bio: fd.get('bio'),
        followers: fd.get('followers'),
        verified: fd.get('verified') === 'on',
      };
      if (!isEdit) payload.handle = fd.get('handle');
      try {
        if (isEdit) await api(`/api/admin/celebrities/${c.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        else await api('/api/admin/celebrities', { method: 'POST', body: JSON.stringify(payload) });
        closeModal();
        toast(isEdit ? 'Saved.' : 'Celebrity created.');
        refresh();
      } catch (err) { document.getElementById('celebFormError').textContent = err.message; }
    };
  }

  async function openPostsModal(c) {
    openModal(`<h2>${escapeHtml(c.name)}'s posts</h2>
      <form id="newPostForm" style="margin-bottom:16px;">
        <div class="field"><textarea name="content" rows="2" placeholder="Write a new update as ${escapeHtml(c.name)}..." required></textarea></div>
        <div class="field"><input name="image_url" placeholder="Optional image URL"></div>
        <button class="btn small" type="submit">Post update</button>
      </form>
      <div id="postsList">Loading...</div>`);

    async function renderPosts() {
      const { posts } = await api(`/api/admin/celebrities/${c.id}/posts`);
      document.getElementById('postsList').innerHTML = posts.length ? posts.map(p => `
        <div class="card" style="margin-bottom:8px;padding:10px;">
          <div style="font-size:13px;color:var(--muted);margin-bottom:4px;">${new Date(p.created_at).toLocaleString()}</div>
          <div>${escapeHtml(p.content)}</div>
          <button class="btn small secondary" style="margin-top:8px;" data-del-post="${p.id}">Delete</button>
        </div>
      `).join('') : '<p style="color:var(--muted)">No posts yet.</p>';
      document.getElementById('postsList').querySelectorAll('[data-del-post]').forEach(btn => {
        btn.onclick = async () => {
          await api(`/api/admin/posts/${btn.dataset.delPost}`, { method: 'DELETE' });
          renderPosts();
          loadStats();
        };
      });
    }
    renderPosts();

    document.getElementById('newPostForm').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await api(`/api/admin/celebrities/${c.id}/posts`, {
          method: 'POST',
          body: JSON.stringify({ content: fd.get('content'), image_url: fd.get('image_url') || null }),
        });
        e.target.reset();
        renderPosts();
        loadStats();
        toast('Posted!');
      } catch (err) { toast(err.message); }
    };
  }

  async function refresh() {
    await Promise.all([loadStats(), loadCelebs()]);
  }

  document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const errEl = document.getElementById('loginError');
    errEl.textContent = '';
    try {
      const data = await api('/api/auth/admin/login', { method: 'POST', body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }) });
      token = data.token;
      localStorage.setItem('cc_admin_token', token);
      showDashboard(true);
      refresh();
    } catch (err) { errEl.textContent = err.message; }
  });

  document.getElementById('adminLogout').addEventListener('click', () => {
    token = null;
    localStorage.removeItem('cc_admin_token');
    showDashboard(false);
  });

  document.getElementById('newCelebBtn').addEventListener('click', () => openCelebForm(null));

  (async function init() {
    if (!token) { showDashboard(false); return; }
    try {
      await loadStats();
      showDashboard(true);
      loadCelebs();
    } catch (e) {
      token = null;
      localStorage.removeItem('cc_admin_token');
      showDashboard(false);
    }
  })();
})();
