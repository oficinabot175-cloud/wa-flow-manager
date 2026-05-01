/**
 * ============================================================
 * WA FLOW MANAGER — API Client v1.1
 * Usa localStorage para persistir token y URL entre sesiones
 * ============================================================
 */
class WaApi {
  constructor() {
    // localStorage persiste aunque cierres el navegador
    this.baseUrl = localStorage.getItem('wa_apps_script_url') || '';
    this.token   = localStorage.getItem('wa_app_token') || '';
  }

  setBaseUrl(url) {
    this.baseUrl = url;
    localStorage.setItem('wa_apps_script_url', url);
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('wa_app_token', token);
  }

  clearSession() {
    localStorage.removeItem('wa_apps_script_url');
    localStorage.removeItem('wa_app_token');
    localStorage.removeItem('wa_user_name');
    this.baseUrl = '';
    this.token   = '';
  }

  isConfigured() {
    return !!this.baseUrl && !!this.token;
  }

  async request(action, params = {}) {
    if (!this.baseUrl) throw new Error('Backend URL no configurado. Por favor inicia sesión.');

    const url = new URL(this.baseUrl);
    url.searchParams.set('action', action);
    if (this.token) url.searchParams.set('token', this.token);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }

    try {
      const response = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`API Error [${action}]:`, err);
      throw err;
    }
  }

  // ── System ────────────────────────────────────
  async ping()          { return this.request('ping'); }
  async setupDatabase() { return this.request('setupDatabase'); }
  async getSettings()   { return this.request('getSettings'); }
  async saveSetting(key, value, description) { return this.request('saveSettings', { key, value, description }); }

  // ── Dashboard ─────────────────────────────────
  async getDashboardStats() { return this.request('getDashboardStats'); }

  // ── Inbox ─────────────────────────────────────
  async getInbox(filters = {}) { return this.request('getInbox', filters); }

  // ── Contacts ──────────────────────────────────
  async getContacts(filters = {})              { return this.request('getContacts', filters); }
  async createContact(data)                    { return this.request('createContact', data); }
  async updateContact(contactId, updates)      { return this.request('updateContact', { contact_id: contactId, ...updates }); }

  // ── Conversations ─────────────────────────────
  async getConversations(filters = {})         { return this.request('getConversations', filters); }
  async getConversationByPhone(phone)          { return this.request('getConversationByPhone', { phone }); }
  async markConversationStatus(phone, status)  { return this.request('markConversationStatus', { phone, status }); }

  // ── Send ──────────────────────────────────────
  async sendMessage(data) { return this.request('sendMessage', data); }

  // ── Schedules ─────────────────────────────────
  async getSchedules(filters = {})             { return this.request('getSchedules', filters); }
  async createSchedule(data)                   { return this.request('createSchedule', data); }
  async updateSchedule(scheduleId, data)       { return this.request('updateSchedule', { schedule_id: scheduleId, ...data }); }
  async deleteSchedule(scheduleId)             { return this.request('deleteSchedule', { schedule_id: scheduleId }); }
  async runSchedulerManual()                   { return this.request('runSchedulerManual'); }

  // ── Rules ─────────────────────────────────────
  async getRules()                             { return this.request('getRules'); }
  async createRule(data)                       { return this.request('createRule', data); }
  async updateRule(ruleId, data)               { return this.request('updateRule', { rule_id: ruleId, ...data }); }
  async deleteRule(ruleId)                     { return this.request('deleteRule', { rule_id: ruleId }); }
  async testRule(ruleId, testMessage)          { return this.request('testRule', { rule_id: ruleId, test_message: testMessage }); }

  // ── Templates ─────────────────────────────────
  async getTemplates(filters = {})             { return this.request('getTemplates', filters); }
  async createTemplate(data)                   { return this.request('createTemplate', data); }
  async updateTemplate(templateId, data)       { return this.request('updateTemplate', { template_id: templateId, ...data }); }
  async deleteTemplate(templateId)             { return this.request('deleteTemplate', { template_id: templateId }); }

  // ── Campaigns ─────────────────────────────────
  async getCampaigns(filters = {})             { return this.request('getCampaigns', filters); }
  async createCampaign(data)                   { return this.request('createCampaign', data); }
  async updateCampaign(campaignId, data)       { return this.request('updateCampaign', { campaign_id: campaignId, ...data }); }
  async deleteCampaign(campaignId)             { return this.request('deleteCampaign', { campaign_id: campaignId }); }
  async executeCampaign(campaignId)            { return this.request('executeCampaign', { campaign_id: campaignId }); }

  // ── TextMeBot ─────────────────────────────────
  async testTextMeBot() { return this.request('testTextMeBot'); }

  // ── Analytics ─────────────────────────────────
  async getAnalytics(days = 7) { return this.request('getAnalytics', { days }); }

  // ── Audit ─────────────────────────────────────
  async getAuditLogs(limit = 50) { return this.request('getAuditLogs', { limit }); }
}

window.api = new WaApi();
