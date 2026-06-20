import { handleCommand, handleCallbackQuery } from "./handlers/commands.ts";

// Load JavaScript services safely
const store = require("./services/store");
const graphStore = require("./services/graph_store");

/**
 * Cloudflare Worker Default Fetch Handler
 */
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 1. GET /: Premium HTML Status Dashboard
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      const allReports = store.all() || [];
      const allGraph = graphStore.all() || { nodes: [], edges: [] };
      const anchored = allReports.filter((r: any) => r.anchor?.hash);

      const latestReportsHtml = allReports
        .slice(-5)
        .reverse()
        .map((r: any) => `
          <div class="activity-card">
            <span class="badge ${r.status === 'high_confidence' ? 'badge-high' : 'badge-med'}">${r.status}</span>
            <div class="activity-info">
              <strong>${escapeHtml(r.title)}</strong>
              <small>ID: ${r.id} | Score: ${r.score} | Anchored: ${r.anchor ? 'Yes' : 'No'}</small>
            </div>
          </div>
        `).join("") || `<div class="no-activity">No reports recorded in intelligence ledger.</div>`;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VindexVault • Network Node Status</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090b11;
      --card-bg: #111422;
      --border: #1d233a;
      --text: #e2e8f0;
      --text-muted: #64748b;
      --primary: #0088cc;
      --primary-glow: rgba(0, 136, 204, 0.15);
      --success: #10b981;
      --high-risk: #ef4444;
      --med-risk: #f59e0b;
      --glow-color: rgba(16, 185, 129, 0.4);
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Outfit', sans-serif;
      line-height: 1.5;
      padding: 2rem 1rem;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .container {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1.5rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      font-size: 2rem;
    }

    .brand h1 {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #e2e8f0 0%, #0088cc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .node-badge {
      background: var(--primary-glow);
      border: 1px solid var(--primary);
      padding: 0.35rem 0.8rem;
      border-radius: 9999px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: var(--primary);
    }

    .status-panel {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
    }

    .status-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .pulse {
      width: 12px;
      height: 12px;
      background: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 0 0 var(--glow-color);
      animation: pulse-anim 2s infinite;
    }

    @keyframes pulse-anim {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 var(--glow-color);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      }
    }

    .status-text h3 {
      font-size: 1.15rem;
      font-weight: 600;
    }

    .status-text p {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .webhook-link {
      background: #1e293b;
      color: var(--text);
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      border: 1px solid var(--border);
      transition: all 0.2s;
    }

    .webhook-link:hover {
      background: var(--primary);
      border-color: var(--primary);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      text-align: center;
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-card h4 {
      color: var(--text-muted);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .stat-card .value {
      font-size: 2.25rem;
      font-weight: 700;
      color: var(--text);
      font-family: 'JetBrains Mono', monospace;
    }

    .layout-split {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 2rem;
    }

    @media (max-width: 768px) {
      .layout-split {
        grid-template-columns: 1fr;
      }
    }

    .panel {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.5rem;
    }

    .panel h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.75rem;
    }

    .activity-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #161a2e;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 0.85rem;
      margin-bottom: 0.75rem;
    }

    .badge {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-family: 'JetBrains Mono', monospace;
    }

    .badge-high {
      background: rgba(239, 68, 68, 0.15);
      color: var(--high-risk);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .badge-med {
      background: rgba(245, 158, 11, 0.15);
      color: var(--med-risk);
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .activity-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .activity-info strong {
      font-size: 0.95rem;
    }

    .activity-info small {
      color: var(--text-muted);
      font-size: 0.8rem;
      font-family: 'JetBrains Mono', monospace;
    }

    .no-activity {
      text-align: center;
      color: var(--text-muted);
      padding: 2rem 0;
      font-style: italic;
    }

    .endpoints-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .endpoint-card {
      background: #0f121d;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 0.85rem;
    }

    .endpoint-card code {
      font-family: 'JetBrains Mono', monospace;
      color: var(--primary);
      font-size: 0.9rem;
      font-weight: 700;
    }

    .endpoint-card p {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    footer {
      text-align: center;
      margin-top: 4rem;
      color: var(--text-muted);
      font-size: 0.8rem;
      border-top: 1px solid var(--border);
      padding-top: 1.5rem;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <span class="logo-icon">🛡️</span>
        <h1>VindexVault</h1>
      </div>
      <div class="node-badge">NODE_VERIFIED_TON_TESTNET</div>
    </header>

    <div class="status-panel">
      <div class="status-left">
        <div class="pulse"></div>
        <div class="status-text">
          <h3>Network Ingestion Node Active</h3>
          <p>Cloudflare Workers edge coordination layer is operational.</p>
        </div>
      </div>
      <a href="/setWebhook" class="webhook-link">Set Telegram Webhook</a>
    </div>

    <div class="grid">
      <div class="stat-card">
        <h4>Intelligence Reports</h4>
        <div class="value">${allReports.length}</div>
      </div>
      <div class="stat-card">
        <h4>Graph Edges</h4>
        <div class="value">${allGraph.edges.length}</div>
      </div>
      <div class="stat-card">
        <h4>TON Anchors</h4>
        <div class="value">${anchored.length}</div>
      </div>
    </div>

    <div class="layout-split">
      <div class="panel">
        <h2>Latest Threat Ingestion</h2>
        <div class="activity-container">
          ${latestReportsHtml}
        </div>
      </div>

      <div class="panel">
        <h2>Ingestion API Endpoints</h2>
        <div class="endpoints-list">
          <div class="endpoint-card">
            <code>POST /webhook</code>
            <p>Handles updates forwarded from Telegram API webhooks.</p>
          </div>
          <div class="endpoint-card">
            <code>POST /simulate</code>
            <p>Mock terminal integration for executing chat diagnostics.</p>
          </div>
          <div class="endpoint-card">
            <code>GET /setWebhook</code>
            <p>Registers the worker URL with Telegram bot API.</p>
          </div>
        </div>
      </div>
    </div>

    <footer>
      VindexVault v1.0.0 • Distributed Cybersecurity Intelligence Network
    </footer>
  </div>
</body>
</html>`;
      return new Response(html, {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }

    // 2. GET /setWebhook: Register webhook with Telegram API
    if (request.method === "GET" && url.pathname === "/setWebhook") {
      const botToken = env.TELEGRAM_BOT_TOKEN || "MOCK_TOKEN";
      if (botToken === "MOCK_TOKEN") {
        return new Response("Error: TELEGRAM_BOT_TOKEN environment variable is not configured.", { status: 400 });
      }

      // Automatically construct the webhook URL from this request
      const targetWebhookUrl = `${url.protocol}//${url.host}/webhook`;
      const registerUrl = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(targetWebhookUrl)}&allowed_updates=["message","callback_query"]`;

      try {
        const response = await fetch(registerUrl);
        const result = await response.text();
        return new Response(`Webhook registration response: ${result}`, { status: 200 });
      } catch (err: any) {
        return new Response(`Failed to register webhook: ${err.message}`, { status: 500 });
      }
    }

    // 3. POST /webhook or POST /: Webhook payload receiver
    if (request.method === "POST" && (url.pathname === "/webhook" || url.pathname === "/" || url.pathname === "/webhook/")) {
      let body: any;
      try {
        body = await request.json();
      } catch (err) {
        return new Response("Invalid JSON payload", { status: 400 });
      }

      const responsePayload = processTelegramUpdate(body);
      if (responsePayload) {
        return new Response(JSON.stringify(responsePayload), {
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response("OK", { status: 200 });
    }

    // 4. POST /simulate: Local test framework endpoint
    if (request.method === "POST" && url.pathname === "/simulate") {
      let body: any;
      try {
        body = await request.json();
      } catch (err) {
        return new Response("Invalid JSON payload", { status: 400 });
      }

      const responsePayload = processTelegramUpdate(body);
      return new Response(JSON.stringify(responsePayload || { status: "ignored" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Endpoint Not Found", { status: 404 });
  }
};

/**
 * Processes the Telegram update structure and resolves a direct webhook response payload
 */
function processTelegramUpdate(update: any): any | null {
  // 1. Text Message Update
  if (update.message) {
    const text = update.message.text || "";
    const fromUser = update.message.from;
    const chatId = update.message.chat.id;

    // Trigger command handlers (treat standard text without / as report submissions)
    let commandInput = text;
    if (text && !text.startsWith("/")) {
      commandInput = `/report ${text}`;
    }

    const res = handleCommand(commandInput, fromUser);

    return {
      method: "sendMessage",
      chat_id: chatId,
      text: res.text,
      parse_mode: "HTML",
      reply_markup: res.reply_markup
    };
  }

  // 2. Callback Query Update (Interactive Menu Button Press)
  if (update.callback_query) {
    const data = update.callback_query.data || "";
    const fromUser = update.callback_query.from;
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;

    const res = handleCallbackQuery(data, fromUser);

    return {
      method: "editMessageText",
      chat_id: chatId,
      message_id: messageId,
      text: res.text,
      parse_mode: "HTML",
      reply_markup: res.reply_markup
    };
  }

  return null;
}

/**
 * Helper to escape HTML characters safely
 */
function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
