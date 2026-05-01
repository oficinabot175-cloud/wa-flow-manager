/**
 * Dashboard Section
 */
window.Sections.dashboard = {
  async render() {
    const container = document.getElementById('dashboardContent');
    if (!container) return;

    if (!api.isConfigured()) {
      container.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-icon">⚙️</div><h3>Configuración requerida</h3><p>Configura la URL de tu Apps Script en la sección de Configuración para comenzar.</p><button class="btn btn-primary mt-16" onclick="location.hash='settings'">Ir a Configuración</button></div></div>`;
      return;
    }

    showLoading('dashboardContent');

    try {
      const stats = await api.getDashboardStats();
      if (!stats.success) throw new Error(stats.error);

      container.innerHTML = `
        <div class="stats-grid">
          ${this.statCard('📥', 'Recibidos hoy', stats.received_today, 'green')}
          ${this.statCard('📤', 'Enviados hoy', stats.sent_today, 'blue')}
          ${this.statCard('🤖', 'Auto-respuestas', stats.auto_replied_today, 'purple')}
          ${this.statCard('👥', 'Contactos nuevos', stats.new_contacts_today, 'green')}
          ${this.statCard('💬', 'Conv. pendientes', stats.pending_conversations, 'yellow')}
          ${this.statCard('🙋', 'Requieren humano', stats.needs_human, 'red')}
          ${this.statCard('❌', 'Errores hoy', stats.errors_today, 'red')}
          ${this.statCard('📢', 'Campañas activas', stats.active_campaigns, 'blue')}
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h3>📅 Próximas programaciones</h3></div>
            ${stats.upcoming_schedules && stats.upcoming_schedules.length > 0 ? `
              <div class="table-wrap"><table>
                <thead><tr><th>Título</th><th>Próximo envío</th><th>Estado</th></tr></thead>
                <tbody>${stats.upcoming_schedules.map(s => `<tr><td>${escapeHtml(s.title)}</td><td>${formatDate(s.next_run_at)}</td><td>${getBadgeHtml(s.status)}</td></tr>`).join('')}</tbody>
              </table></div>
            ` : '<p class="text-muted text-sm">No hay programaciones próximas</p>'}
          </div>

          <div class="card">
            <div class="card-header"><h3>⚠️ Errores recientes</h3></div>
            ${stats.recent_errors && stats.recent_errors.length > 0 ? `
              <div class="table-wrap"><table>
                <thead><tr><th>Destinatario</th><th>Error</th></tr></thead>
                <tbody>${stats.recent_errors.map(e => `<tr><td>${escapeHtml(e.recipient)}</td><td class="text-sm">${escapeHtml(e.error)}</td></tr>`).join('')}</tbody>
              </table></div>
            ` : '<p class="text-muted text-sm">Sin errores recientes 🎉</p>'}
          </div>
        </div>

        <div class="card mt-24">
          <div class="card-header"><h3>📊 Resumen del sistema</h3></div>
          <div class="flex gap-16 flex-wrap">
            <div class="text-sm"><strong>Total contactos:</strong> ${stats.total_contacts}</div>
            <div class="text-sm"><strong>Total mensajes inbox:</strong> ${stats.total_inbox}</div>
            <div class="text-sm"><span class="status-dot online"></span>Sistema conectado</div>
          </div>
        </div>
      `;

      const badge = document.getElementById('pendingBadge');
      if (badge) {
        badge.textContent = stats.pending_conversations || '';
        badge.style.display = stats.pending_conversations > 0 ? 'inline' : 'none';
      }

    } catch (err) {
      container.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error al cargar datos</h3><p>${escapeHtml(err.message)}</p><button class="btn btn-secondary mt-16" onclick="Sections.dashboard.render()">Reintentar</button></div></div>`;
    }
  },

  statCard(icon, label, value, color) {
    return `<div class="stat-card"><div class="stat-icon ${color}">${icon}</div><div class="stat-value">${value || 0}</div><div class="stat-label">${label}</div></div>`;
  }
};
