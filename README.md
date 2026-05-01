# WA Flow Manager

Portal profesional para gestionar WhatsApp usando TextMeBot API.  
Frontend estático (GitHub Pages) + Backend serverless (Google Apps Script + Google Sheets).

## 🚀 Despliegue rápido

### Paso 1: Google Apps Script

1. Abre [Google Apps Script](https://script.google.com)
2. Crea un nuevo proyecto llamado "WA Flow Manager"
3. Copia el contenido de cada archivo `.gs` de la carpeta `apps-script/`:
   - `Code.gs` — Router principal
   - `Config.gs` — Configuración y setupDatabase
   - `SheetsService.gs` — CRUD genérico
   - `TextMeBotService.gs` — Integración TextMeBot
   - `AutomationEngine.gs` — Motor de reglas
   - `Scheduler.gs` — Programador de mensajes
   - `CampaignService.gs` — Gestión de campañas
   - `TemplateService.gs` — Plantillas
   - `AnalyticsService.gs` — Analítica
   - `AuditService.gs` — Logs de auditoría

4. En `Config.gs`, verifica que `SPREADSHEET_ID` tenga el ID de tu Google Sheet:
   ```
   var SPREADSHEET_ID = '1kB2zeGAX8MGnFLMVnP68wOueE4KZnZ621xAizC0BwI4';
   ```

5. Despliega como Web App:
   - Click en **Implementar** → **Nueva implementación**
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Acceso: **Cualquier persona**
   - Click en **Implementar**
   - **Copia la URL** de la Web App

6. Configura PropertiesService (opcional desde el editor de Apps Script):
   - Archivo → Propiedades del proyecto → Propiedades del script
   - Agrega: `TEXTMEBOT_API_KEY` = tu API key
   - Agrega: `APP_SECRET_TOKEN` = un token secreto que tú elijas

### Paso 2: Frontend en GitHub Pages

1. Sube los archivos del frontend al repositorio `wa-flow-manager`:
   - `index.html`
   - `src/styles.css`
   - `src/api.js`
   - `src/app.js`
   - `src/components/*.js` (11 archivos)

2. En GitHub → Settings → Pages → Source: `main` branch → `/` (root)
3. Tu portal estará en: `https://oficinabot175-cloud.github.io/wa-flow-manager/`

### Paso 3: Configuración inicial

1. Abre el portal en tu navegador
2. Ve a **Configuración** (⚙️)
3. Pega la **URL de tu Web App** de Apps Script
4. Define un **APP_SECRET_TOKEN**
5. Click en **Test conexión** para verificar
6. Click en **Ejecutar setupDatabase** para crear todas las hojas
7. Ingresa tu **TextMeBot API Key** y guárdala
8. Click en **Test TextMeBot** para verificar

### Paso 4: Webhook de TextMeBot

1. Configura tu webhook en TextMeBot abriendo en el navegador:
   ```
   https://api.textmebot.com/webhook.php?apikey=TU_API_KEY
   ```
2. Ingresa la URL de tu Web App de Apps Script como webhook URL
3. Los mensajes entrantes se guardarán automáticamente en Google Sheets

## 📁 Estructura

```
├── index.html                    # Portal principal
├── src/
│   ├── styles.css               # Design system
│   ├── api.js                   # API client
│   ├── app.js                   # SPA controller
│   └── components/
│       ├── dashboard.js         # Dashboard con métricas
│       ├── inbox.js             # Bandeja de entrada
│       ├── conversations.js     # Vista de chat
│       ├── send.js              # Envío manual
│       ├── scheduler.js         # Programador
│       ├── automations.js       # Reglas automáticas
│       ├── campaigns.js         # Campañas masivas
│       ├── templates.js         # Plantillas
│       ├── contacts.js          # Directorio de contactos
│       ├── analytics.js         # Analítica
│       └── settings.js          # Configuración
├── apps-script/                  # Backend (no va a GitHub Pages)
│   ├── Code.gs
│   ├── Config.gs
│   ├── SheetsService.gs
│   ├── TextMeBotService.gs
│   ├── AutomationEngine.gs
│   ├── Scheduler.gs
│   ├── CampaignService.gs
│   ├── TemplateService.gs
│   ├── AnalyticsService.gs
│   └── AuditService.gs
└── README.md
```

## 📊 Google Sheets (10 hojas)

| Hoja | Propósito |
|------|-----------|
| Settings | Configuraciones del sistema |
| Contacts | Directorio de contactos |
| Inbox | Mensajes recibidos |
| Outbox | Mensajes enviados |
| ScheduledMessages | Programaciones |
| AutomationRules | Reglas automáticas |
| Conversations | Metadatos de conversaciones |
| Campaigns | Campañas masivas |
| Templates | Plantillas de mensajes |
| AuditLogs | Registro de auditoría |

## 🤖 Reglas de ejemplo incluidas

| Regla | Keyword | Respuesta |
|-------|---------|-----------|
| Saludo | hola | Hola {{whatsapp_name}}, gracias por escribir... |
| Precios | precio | Te compartimos la información de precios... |
| Ayuda | ayuda | Puedes escribirnos tu consulta... |
| Asesor | asesor | Hemos registrado tu solicitud... (marca needs-human) |
| Baja | stop | Ya no te enviaremos más mensajes (marca DNC) |

## 🔐 Seguridad

- API Key de TextMeBot guardada en `PropertiesService` (nunca en frontend)
- `APP_SECRET_TOKEN` protege endpoints sensibles
- Token guardado en `sessionStorage` (se borra al cerrar pestaña)
- Inputs sanitizados en backend
- Rate limiting configurable
- Audit logs para trazabilidad

## 📌 Notas

- **No usa AppSheet, IA, ni Groq**
- Frontend 100% estático, compatible con GitHub Pages
- Backend 100% en Google Apps Script
- Base de datos en Google Sheets
- Motor de reglas determinístico por palabras clave
