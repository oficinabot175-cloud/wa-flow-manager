/**
 * Analytics Section
 */
window.Sections.analytics = {
  async render() {
    const c = document.getElementById('analyticsContent');
    if (!c) return;
    if (!api.isConfigured()) { showEmpty('analyticsContent','⚙️','Configuración requerida',''); return; }
    showLoading('analyticsContent');
    try {
      const res = await api.getAnalytics(7);
      if (!res.success) throw new Error(res.error);

      // Build bar chart data
      const days = Object.keys(res.messages_by_day || {}).sort();
      const maxRecv = Math.max(...days.map(d => res.messages_by_day[d]), 1);
      const maxSent = Math.max(...days.map(d => res.sent_by_day[d] || 0), 1);

      c.innerHTML = `
        <div class="toolbar">
          <h3>📊 Últimos 7 días</h3>
          <button class="btn btn-secondary btn-sm" onclick="Sections.analytics.render()">🔄 Actualizar</button>
        </div>
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h3>📥 Mensajes recibidos por día</h3></div>
            <div class="bar-chart">${days.map(d => {
              const v = res.messages_by_day[d];
              const h = Math.max((v / maxRecv) * 120, 4);
              return `<div class="bar" style="height:${h}px"><span class="bar-value">${v}</span><span class="bar-label">${d.slice(5)}</span></div>`;
            }).join('')}</div>
          </div>
          <div class="card">
            <div class="card-header"><h3>📤 Mensajes enviados por día</h3></div>
            <div class="bar-chart">${days.map(d => {
              const v = res.sent_by_day[d] || 0;
              const h = Math.max((v / maxSent) * 120, 4);
              return `<div class="bar" style="height:${h}px;background:var(--accent-blue)"><span class="bar-value">${v}</span><span class="bar-label">${d.slice(5)}</span></div>`;
            }).join('')}</div>
          </div>
        </div>
        <div class="grid-2 mt-24">
          <div class="card">
            <div class="card-header"><h3>👥 Contactos más activos</h3></div>
            ${(res.top_contacts||[]).length===0?'<p class="text-muted text-sm">Sin datos</p>':`
            <div class="table-wrap"><table>
              <thead><tr><th>Nombre</th><th>Teléfono</th><th>Mensajes</th></tr></thead>
              <tbody>${(res.top_contacts||[]).slice(0,5).map(tc => `<tr><td>${escapeHtml(tc.name)}</td><td class="text-sm">${escapeHtml(tc.phone)}</td><td><strong>${tc.count}</strong></td></tr>`).join('')}</tbody>
            </table></div>`}
          </div>
          <div class="card">
            <div class="card-header"><h3>🤖 Reglas más usadas</h3></div>
            ${(res.top_rules||[]).length===0?'<p class="text-muted text-sm">Sin datos</p>':`
            <div class="table-wrap"><table>
              <thead><tr><th>Regla ID</th><th>Coincidencias</th></tr></thead>
              <tbody>${(res.top_rules||[]).map(tr => `<tr><td>${escapeHtml(tr.rule_id)}</td><td><strong>${tr.count}</strong></td></tr>`).join('')}</tbody>
            </table></div>`}
          </div>
        </div>
        <div class="card mt-24">
          <div class="card-header"><h3>📈 Resumen de envíos</h3></div>
          <div class="stats-grid">
            <div class="stat-card"><div class="stat-value">${res.total_sent||0}</div><div class="stat-label">Total enviados</div></div>
            <div class="stat-card"><div class="stat-value">${res.total_failed||0}</div><div class="stat-label">Total fallidos</div></div>
            <div class="stat-card"><div class="stat-value">${res.error_rate||0}%</div><div class="stat-label">Tasa de error</div></div>
          </div>
        </div>
      `;
    } catch (err) { showEmpty('analyticsContent','⚠️','Error',err.message); }
  }
};
