import { addReport, addLink } from "../services/indexer";
import { ConfidenceLevel, ActorType, Actor, ThreatReport, GraphLink } from "../../../../packages/shared-types";

// Load JavaScript services safely
const store = require("../services/store");
const graphStore = require("../services/graph_store");
const reputationStore = require("../services/reputation_store");
const rewardStore = require("../services/reward_store");
const { extractEntities } = require("../services/entity_extractor");
const { createIntelligence } = require("../services/pipeline");

export interface BotResponse {
  text: string;
  reply_markup?: {
    inline_keyboard?: Array<Array<{ text: string; callback_data: string }>>;
  };
}

/**
 * Renders the main menu inline keyboard markup
 */
export function getMainMenuMarkup() {
  return {
    inline_keyboard: [
      [
        { text: "📝 Submit Report", callback_data: "menu_report" },
        { text: "🔍 Search Entity", callback_data: "menu_query" }
      ],
      [
        { text: "🏆 My Rewards", callback_data: "menu_rewards" },
        { text: "📊 System Stats", callback_data: "menu_stats" }
      ],
      [
        { text: "⛓ TON Chain Status", callback_data: "menu_chain" }
      ]
    ]
  };
}

/**
 * Handle Telegram text commands and interactive messages
 */
export function handleCommand(input: string, fromUser?: { id: number; username?: string }): BotResponse {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const argsText = parts.slice(1).join(" ");
  const userId = fromUser ? `tg_${fromUser.id}` : "user_1";
  const userHandle = fromUser?.username ? `@${fromUser.username}` : userId;

  // 1. HELP / START MENU
  if (cmd === "/start" || cmd === "/help" || cmd === "/menu") {
    const text = `🤖 <b>VINDEX VAULT — TON Security Core</b>\n` +
      `Welcome to VindexVault, the decentralized threat intelligence and security coordination network for TON.\n\n` +
      `🛡️ <b>This chat is the entire interface.</b> You can perform all system tasks here:\n\n` +
      `• <b>Submit Reports:</b> Send <code>/report &lt;text&gt;</code>. We will auto-extract suspect wallets, URLs, domains, and handles.\n` +
      `• <b>Lookup Entities:</b> Send <code>/query &lt;entity&gt;</code> to scan for risk profiles and graph connections.\n` +
      `• <b>Link Threat Actors:</b> Send <code>/link &lt;from&gt; &lt;to&gt; &lt;relation&gt;</code> to index organizational mappings.\n` +
      `• <b>Track Stats & Rewards:</b> Check your reputation, rewards, and system-wide metrics.\n\n` +
      `💡 <i>Quick Actions: Use the menu buttons below to query details:</i>`;
    return { text, reply_markup: getMainMenuMarkup() };
  }

  // 2. REPORT SUBMISSION
  if (cmd === "/report") {
    if (!argsText) {
      return {
        text: `⚠️ <b>How to Submit a Threat Report:</b>\n\n` +
          `Provide details about the phishing campaign, scam bot, malicious mini-app, or suspect wallet.\n\n` +
          `📝 <b>Example:</b>\n` +
          `<code>/report Impersonating Tonkeeper at https://fake-tonkeeper-claim.org, developer handle is @scammer_ton, wallet address EQDt...</code>\n\n` +
          `<i>Our pipeline will automatically extract the entities, score the threat level, update your reputation, and distribute VINDEX rewards.</i>`
      };
    }

    // Extract suspect entities
    const entities = extractEntities(argsText);
    const suspects: Actor[] = [];

    // Map extracted elements to suspects list
    entities.wallets.forEach((w: string) => suspects.push({ id: w, type: ActorType.WALLET }));
    entities.domains.forEach((d: string) => suspects.push({ id: d, type: ActorType.DOMAIN }));
    entities.telegrams.forEach((t: string) => {
      const type = t.toLowerCase().endsWith("bot") ? ActorType.BOT : ActorType.TELEGRAM_USER;
      suspects.push({ id: t, type, handle: t });
    });
    entities.urls.forEach((u: string) => suspects.push({ id: u, type: ActorType.MINI_APP }));

    if (suspects.length === 0) {
      return {
        text: `⚠️ <b>Submission Ignored:</b>\n` +
          `No queryable suspect entities (wallets, domains, telegram handles, URLs) were found in your report text.\n\n` +
          `Please include specific details (e.g. <code>https://scam.org</code> or wallet address starting with <code>EQ</code>) so we can index them.`
      };
    }

    // Build evidence list
    const evidence = entities.urls.map((u: string, idx: number) => ({
      id: `ev_url_${Date.now()}_${idx}`,
      type: "url" as const,
      uri: u,
      timestamp: Date.now()
    }));
    entities.hashes.forEach((h: string, idx: number) => {
      evidence.push({
        id: `ev_hash_${Date.now()}_${idx}`,
        type: "log" as const,
        uri: h,
        timestamp: Date.now()
      });
    });

    const confidence = suspects.length > 2 ? ConfidenceLevel.HIGH : (suspects.length > 0 ? ConfidenceLevel.MEDIUM : ConfidenceLevel.LOW);

    const report: ThreatReport = {
      id: "r_" + Date.now(),
      title: argsText.substring(0, 40) + (argsText.length > 40 ? "..." : ""),
      description: argsText,
      reporter: {
        id: userId,
        type: ActorType.TELEGRAM_USER,
        handle: userHandle
      },
      suspects,
      evidence,
      confidence,
      tags: ["telegram_submission"],
      createdAt: Date.now()
    };

    // Ingest into pipeline
    addReport(report);
    const enriched = createIntelligence(report);

    // Render detailed result card
    let suspectsList = suspects.map(s => `• <code>${s.id}</code> (<i>${s.type}</i>)`).join("\n");
    let text = `✅ <b>Threat Report Registered Successfully</b>\n` +
      `Report ID: <code>${enriched.id}</code>\n` +
      `Threat Score: <b>${enriched.score}/100</b> (Status: <code>${enriched.status}</code>)\n\n` +
      `👥 <b>Extracted Suspects:</b>\n${suspectsList}\n\n` +
      `📈 <b>Contributor Reputation Impact:</b>\n` +
      `• User: <code>${userId}</code> (<i>${userHandle}</i>)\n` +
      `• Delta: <b>+${enriched.reputationImpact.delta}</b>\n` +
      `• Total Reputation: <b>${enriched.reputationImpact.reputation}</b>\n\n` +
      `🏆 <b>Reward Details:</b>\n` +
      `• Reward ID: <code>${enriched.reward.id}</code>\n` +
      `• Disbursed: <b>${enriched.reward.amount} VINDEX</b>\n\n` +
      `⛓ <b>TON Chain Anchoring:</b>\n` +
      `• Anchor Hash: <code>${enriched.anchor.hash}</code>\n` +
      `• Simulated Tx: <code>${enriched.chain.id}</code>`;

    return { text };
  }

  // 3. QUERY ENTITY
  if (cmd === "/query") {
    if (!argsText) {
      return {
        text: `🔍 <b>Search Threat Intel Database:</b>\n\n` +
          `Search for security profiles, threat scores, and link associations for any wallet, handle, or domain.\n\n` +
          `📝 <b>Example:</b>\n` +
          `• <code>/query EQDt...</code>\n` +
          `• <code>/query @scam_bot</code>\n` +
          `• <code>/query phish-ton.com</code>`
      };
    }

    const queryEntity = argsText.trim();
    const allReports = store.all() || [];
    const allGraph = graphStore.all() || { nodes: [], edges: [] };

    // Search matches in intelligence reports
    const matchedReports = allReports.filter((record: any) => {
      const matchSuspect = record.suspects?.some((s: any) => s.id.toLowerCase() === queryEntity.toLowerCase());
      const matchReporter = record.reporter?.id.toLowerCase() === queryEntity.toLowerCase() || record.reporter?.handle?.toLowerCase() === queryEntity.toLowerCase();
      return matchSuspect || matchReporter || record.id.toLowerCase() === queryEntity.toLowerCase();
    });

    // Search graph relations
    const matchingEdges = allGraph.edges.filter((e: any) => 
      e.from?.toLowerCase() === queryEntity.toLowerCase() || 
      e.to?.toLowerCase() === queryEntity.toLowerCase()
    );

    if (matchedReports.length === 0 && matchingEdges.length === 0) {
      return {
        text: `🟢 <b>Threat Profile:</b> <code>${queryEntity}</code>\n` +
          `Status: <b>CLEAN / UNKNOWN</b>\n` +
          `Risk Score: <b>0/100</b>\n\n` +
          `No records or active graph relationships discovered for this entity in the threat network. Please submit a report if you detect suspicious activity.`
      };
    }

    // Compute compound threat score based on all reports
    let compoundScore = 0;
    matchedReports.forEach((r: any) => {
      if (r.score > compoundScore) compoundScore = r.score;
    });

    // Heuristics for severity levels
    let statusLabel = "🔴 <b>HIGH RISK / SCAM SUSPECT</b>";
    if (compoundScore < 50) {
      statusLabel = "🟡 <b>LOW/MODERATE SUSPECT</b>";
    } else if (compoundScore < 80) {
      statusLabel = "🟠 <b>MEDIUM RISK / PROBABLE FRAUD</b>";
    }

    let reportList = matchedReports.map((r: any) => 
      `• Report <code>${r.id}</code>: "${r.title}" (Score: <b>${r.score}</b>, Status: <i>${r.status}</i>)`
    ).join("\n");

    let edgesList = matchingEdges.map((e: any) => 
      `• Link: <code>${e.from}</code> ➔ [<i>${e.type || "associated_with"}</i>] ➔ <code>${e.to}</code>`
    ).join("\n");

    let text = `🔍 <b>Threat Profile Report:</b> <code>${queryEntity}</code>\n` +
      `Status: ${statusLabel}\n` +
      `Composite Threat Score: <b>${compoundScore}/100</b>\n\n` +
      `📋 <b>Associated Reports (${matchedReports.length}):</b>\n` + (reportList || "<i>None</i>") + `\n\n` +
      `🕸 <b>Graph Relationships (${matchingEdges.length}):</b>\n` + (edgesList || "<i>None</i>");

    return { text };
  }

  // 4. LINK ENTITIES
  if (cmd === "/link") {
    if (parts.length < 3) {
      return {
        text: `⚠️ <b>Link Threat Actors:</b>\n\n` +
          `Create a directional graph relation between two suspects (e.g. revealing bot networks or controlling entities).\n\n` +
          `📝 <b>Usage:</b>\n` +
          `<code>/link &lt;fromEntity&gt; &lt;toEntity&gt; [relation]</code>\n\n` +
          `• <b>Relations:</b> <code>impersonates</code>, <code>controls</code>, <code>hosts</code>, <code>paid_by</code>, <code>associated_with</code> (default)`
      };
    }

    const from = parts[1];
    const to = parts[2];
    const rawRelation = parts[3] || "associated_with";
    
    const validRelations = ["impersonates", "controls", "hosts", "paid_by", "associated_with"];
    const relation = validRelations.includes(rawRelation) ? rawRelation : "associated_with";

    // Track in indexer
    addLink({
      from,
      to,
      relation: relation as any,
      weight: 1
    });

    // Commit to persistent graph
    graphStore.addEdge({
      from,
      to,
      type: relation
    });

    // Create implicit nodes if they don't exist
    graphStore.addNode({ id: from, type: "actor", label: "actor" });
    graphStore.addNode({ id: to, type: "actor", label: "actor" });

    return {
      text: `🕸 <b>Graph Connection Indexed:</b>\n\n` +
        `• <b>Source:</b> <code>${from}</code>\n` +
        `• <b>Target:</b> <code>${to}</code>\n` +
        `• <b>Relationship:</b> <code>${relation}</code>\n\n` +
        `The relationship graph is updated immediately.`
    };
  }

  // 5. REPUTATION STATUS
  if (cmd === "/reputation") {
    const targetUser = argsText.trim() || userId;
    const score = reputationStore.get(targetUser);

    return {
      text: `🏆 <b>Reputation Ledger Status:</b>\n\n` +
        `• Contributor: <code>${targetUser}</code>\n` +
        `• Score: <b>${score} Points</b>\n` +
        `• Status: <i>${score >= 20 ? "Verified Security Auditor" : (score >= 10 ? "Trusted Reporter" : "Contributor")}</i>`
    };
  }

  // 6. REWARDS EARNED
  if (cmd === "/rewards") {
    const targetUser = argsText.trim() || userId;
    const allRewards = rewardStore.all ? (rewardStore.all() || []) : [];
    const userRewards = allRewards.filter((rw: any) => rw.userId === targetUser);
    const totalAmount = userRewards.reduce((sum: number, rw: any) => sum + rw.amount, 0);

    let list = userRewards.map((rw: any) => 
      `• <code>${rw.id}</code>: <b>+${rw.amount} VINDEX</b> (Report: <code>${rw.reportId}</code>)`
    ).slice(-5).join("\n"); // Show last 5 rewards

    return {
      text: `🏆 <b>VINDEX Token Reward Statement:</b>\n\n` +
        `• Contributor: <code>${targetUser}</code>\n` +
        `• Accumulated Rewards: <b>${totalAmount} VINDEX</b>\n\n` +
        `📝 <b>Latest Rewards (up to 5):</b>\n` + (list || "<i>No rewards disbursed yet.</i>")
    };
  }

  // 7. SYSTEM METRICS
  if (cmd === "/stats") {
    const allReports = store.all() || [];
    const allGraph = graphStore.all() || { nodes: [], edges: [] };
    const avgScore = allReports.length > 0 
      ? Math.round(allReports.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / allReports.length)
      : 0;

    const uniqueContributors = new Set(allReports.map((r: any) => r.reporter?.id)).size;

    return {
      text: `📊 <b>VindexVault Global Security Metrics</b>\n` +
        `┌─────────────────────────────────┐\n` +
        `• Threat Intelligence Cases: <b>${allReports.length}</b>\n` +
        `• Unique Contributor Nodes: <b>${uniqueContributors}</b>\n` +
        `• Graph Nodes Tracked: <b>${allGraph.nodes.length}</b>\n` +
        `• Indexed Edge Relations: <b>${allGraph.edges.length}</b>\n` +
        `• Average Campaign Score: <b>${avgScore}/100</b>\n` +
        `└─────────────────────────────────┘\n` +
        `💡 <i>VindexVault represents a decentralized network monitoring TON-ecosystem threats.</i>`
    };
  }

  // 8. BLOCKCHAIN PACKET ANCHORING
  if (cmd === "/chain") {
    const allReports = store.all() || [];
    const anchored = allReports.filter((r: any) => r.anchor?.hash);

    let latestHash = "N/A";
    let latestTx = "N/A";
    if (anchored.length > 0) {
      const top = anchored[anchored.length - 1];
      latestHash = top.anchor?.hash || "N/A";
      latestTx = top.chain?.id || "N/A";
    }

    return {
      text: `⛓ <b>Simulated TON Registry Status</b>\n\n` +
        `• Anchor Contract: <code>EQB_VindexRegistry_Tonnet_v1</code>\n` +
        `• Anchored Reports: <b>${anchored.length} / ${allReports.length}</b>\n` +
        `• Latest Committed Root: <code>${latestHash}</code>\n` +
        `• Latest Transaction Hash: <code>${latestTx}</code>\n\n` +
        `<i>Tamper-evidence anchoring is computed automatically when reports are scored and added to the intelligence index.</i>`
    };
  }

  return { text: `❓ <b>Unknown command:</b> <code>${cmd}</code>\nType <code>/help</code> or <code>/menu</code> to display available options.` };
}

/**
 * Handle Telegram interactive callbacks (button clicks)
 */
export function handleCallbackQuery(data: string, fromUser: { id: number; username?: string }): BotResponse {
  const userId = `tg_${fromUser.id}`;
  const userHandle = fromUser.username ? `@${fromUser.username}` : userId;

  if (data === "menu_start") {
    return handleCommand("/start", fromUser);
  }

  if (data === "menu_report") {
    return handleCommand("/report", fromUser);
  }

  if (data === "menu_query") {
    return handleCommand("/query", fromUser);
  }

  if (data === "menu_rewards") {
    return handleCommand("/rewards", fromUser);
  }

  if (data === "menu_stats") {
    return handleCommand("/stats", fromUser);
  }

  if (data === "menu_chain") {
    return handleCommand("/chain", fromUser);
  }

  return { text: `⚠️ Selected action <code>${data}</code> is unrecognized.` };
}
