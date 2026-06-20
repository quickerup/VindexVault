import assert from "assert";
import worker from "./index";

async function runTests() {
  console.log("=== STARTING INTEGRATION TESTS FOR TELEGRAM BOT WORKER ===");
  const env = { TELEGRAM_BOT_TOKEN: "MOCK_TOKEN" };
  const ctx = {};

  // 1. Test GET / dashboard endpoint
  {
    console.log("Testing GET / status page...");
    const req = new Request("http://localhost/", { method: "GET" });
    const res = await worker.fetch(req, env, ctx);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("VindexVault"), "Dashboard missing title");
    assert.ok(html.includes("NODE_VERIFIED_TON_TESTNET"), "Dashboard missing node info");
    console.log("✔ GET / status page passes");
  }

  // 2. Test GET /setWebhook with default token
  {
    console.log("Testing GET /setWebhook...");
    const req = new Request("http://localhost/setWebhook", { method: "GET" });
    const res = await worker.fetch(req, env, ctx);
    // Since env.TELEGRAM_BOT_TOKEN is "MOCK_TOKEN", it returns 400 bad config
    assert.strictEqual(res.status, 400);
    console.log("✔ GET /setWebhook behaves correctly when unconfigured");
  }

  // 3. Test Simulate /start
  {
    console.log("Testing Simulate /start...");
    const req = new Request("http://localhost/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          text: "/start",
          from: { id: 12345, username: "alice_test" },
          chat: { id: 12345 }
        }
      })
    });
    const res = await worker.fetch(req, env, ctx);
    assert.strictEqual(res.status, 200);
    const body = await res.json() as any;
    assert.strictEqual(body.method, "sendMessage");
    assert.strictEqual(body.chat_id, 12345);
    assert.ok(body.text.includes("VINDEX VAULT"), "Start response missing heading");
    assert.ok(body.reply_markup?.inline_keyboard, "Start response missing menu buttons");
    console.log("✔ Simulate /start passes");
  }

  // 4. Test Simulate /report (empty arguments)
  {
    console.log("Testing Simulate /report (empty)...");
    const req = new Request("http://localhost/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          text: "/report",
          from: { id: 12345, username: "alice_test" },
          chat: { id: 12345 }
        }
      })
    });
    const res = await worker.fetch(req, env, ctx);
    const body = await res.json() as any;
    assert.ok(body.text.includes("How to Submit a Threat Report"), "Empty report response missing instructions");
    console.log("✔ Simulate /report (empty) passes");
  }

  // 5. Test Simulate /report with actual content (entities auto-extraction)
  let reportId = "";
  let suspectWallet = "EQA1234567890123456789012345678901234567_ABCD";
  let suspectDomain = "scam-tonkeeper-claim.org";
  {
    console.log("Testing Simulate /report with mock entities...");
    const req = new Request("http://localhost/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          text: `/report Phishing portal claiming free awards on https://${suspectDomain}. Scammer wallet is ${suspectWallet}. Dev handle: @scammer_ton_support`,
          from: { id: 12345, username: "alice_test" },
          chat: { id: 12345 }
        }
      })
    });
    const res = await worker.fetch(req, env, ctx);
    const body = await res.json() as any;
    assert.strictEqual(body.method, "sendMessage");
    assert.ok(body.text.includes("Threat Report Registered Successfully"), "Failed report registration");
    assert.ok(body.text.includes(suspectWallet), "Wallet not extracted in report output");
    assert.ok(body.text.includes(suspectDomain), "Domain not extracted in report output");
    assert.ok(body.text.includes("@scammer_ton_support"), "Telegram handle not extracted");
    assert.ok(body.text.includes("VINDEX"), "Rewards section missing in output");

    // Capture the generated report ID
    const match = body.text.match(/Report ID: <code>(r_\d+)<\/code>/);
    assert.ok(match, "Could not extract Report ID from response");
    reportId = match[1];
    console.log(`✔ Simulate /report passes (Created Report: ${reportId})`);
  }

  // 6. Test Simulate /query <entity> (matching suspect wallet)
  {
    console.log(`Testing Simulate /query for wallet: ${suspectWallet}...`);
    const req = new Request("http://localhost/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          text: `/query ${suspectWallet}`,
          from: { id: 12345, username: "alice_test" },
          chat: { id: 12345 }
        }
      })
    });
    const res = await worker.fetch(req, env, ctx);
    const body = await res.json() as any;
    assert.ok(body.text.includes("Threat Profile Report"), "Query missing header");
    assert.ok(body.text.includes("HIGH RISK"), "Threat status is clean but should be high risk");
    assert.ok(body.text.includes(reportId), "Query output missing associated report ID");
    console.log("✔ Simulate /query (wallet) passes");
  }

  // 7. Test Simulate /link <from> <to> <relation>
  {
    console.log("Testing Simulate /link...");
    const req = new Request("http://localhost/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          text: `/link @scammer_ton_support ${suspectWallet} controls`,
          from: { id: 12345, username: "alice_test" },
          chat: { id: 12345 }
        }
      })
    });
    const res = await worker.fetch(req, env, ctx);
    const body = await res.json() as any;
    assert.ok(body.text.includes("Graph Connection Indexed"), "Link command did not index connection");
    assert.ok(body.text.includes("controls"), "Incorrect relationship saved");
    console.log("✔ Simulate /link passes");
  }

  // 8. Test Simulate /query <entity> after link (check updated graph connections)
  {
    console.log(`Testing Simulate /query after linking to verify graph relation...`);
    const req = new Request("http://localhost/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          text: `/query @scammer_ton_support`,
          from: { id: 12345, username: "alice_test" },
          chat: { id: 12345 }
        }
      })
    });
    const res = await worker.fetch(req, env, ctx);
    const body = await res.json() as any;
    assert.ok(body.text.includes("Graph Relationships"), "Graph relationships category missing");
    assert.ok(body.text.includes("controls"), "Relationship edge does not display in query profile");
    console.log("✔ Simulate /query after linking displays graph edges correctly");
  }

  // 9. Test Simulate /reputation
  {
    console.log("Testing Simulate /reputation...");
    const req = new Request("http://localhost/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          text: "/reputation",
          from: { id: 12345, username: "alice_test" },
          chat: { id: 12345 }
        }
      })
    });
    const res = await worker.fetch(req, env, ctx);
    const body = await res.json() as any;
    assert.ok(body.text.includes("Reputation Ledger Status"), "Reputation missing header");
    assert.ok(body.text.includes("tg_12345"), "Reputation user ID incorrect");
    console.log("✔ Simulate /reputation passes");
  }

  // 10. Test Simulate /rewards
  {
    console.log("Testing Simulate /rewards...");
    const req = new Request("http://localhost/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          text: "/rewards",
          from: { id: 12345, username: "alice_test" },
          chat: { id: 12345 }
        }
      })
    });
    const res = await worker.fetch(req, env, ctx);
    const body = await res.json() as any;
    assert.ok(body.text.includes("VINDEX Token Reward Statement"), "Rewards missing header");
    assert.ok(body.text.includes("Accumulated Rewards"), "Rewards statement missing totals");
    console.log("✔ Simulate /rewards passes");
  }

  // 11. Test Simulate /stats
  {
    console.log("Testing Simulate /stats...");
    const req = new Request("http://localhost/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          text: "/stats",
          from: { id: 12345, username: "alice_test" },
          chat: { id: 12345 }
        }
      })
    });
    const res = await worker.fetch(req, env, ctx);
    const body = await res.json() as any;
    assert.ok(body.text.includes("VindexVault Global Security Metrics"), "Stats missing header");
    assert.ok(body.text.includes("Threat Intelligence Cases"), "Stats missing metrics list");
    console.log("✔ Simulate /stats passes");
  }

  // 12. Test Simulate /chain
  {
    console.log("Testing Simulate /chain...");
    const req = new Request("http://localhost/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          text: "/chain",
          from: { id: 12345, username: "alice_test" },
          chat: { id: 12345 }
        }
      })
    });
    const res = await worker.fetch(req, env, ctx);
    const body = await res.json() as any;
    assert.ok(body.text.includes("Simulated TON Registry Status"), "Chain missing header");
    assert.ok(body.text.includes("EQB_VindexRegistry_Tonnet_v1"), "Registry address mismatched");
    console.log("✔ Simulate /chain passes");
  }

  // 13. Test Simulate Callback query (button press)
  {
    console.log("Testing Simulate Callback Query...");
    const req = new Request("http://localhost/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query: {
          id: "cb_9999",
          from: { id: 12345, username: "alice_test" },
          message: {
            message_id: 1001,
            chat: { id: 12345 }
          },
          data: "menu_stats"
        }
      })
    });
    const res = await worker.fetch(req, env, ctx);
    const body = await res.json() as any;
    assert.strictEqual(body.method, "editMessageText");
    assert.strictEqual(body.chat_id, 12345);
    assert.strictEqual(body.message_id, 1001);
    assert.ok(body.text.includes("VindexVault Global Security Metrics"), "Callback query menu_stats response invalid");
    console.log("✔ Simulate Callback Query (menu_stats) passes");
  }

  console.log("=== ALL BOT-WORKER INTEGRATION TESTS PASSED ===");
}

runTests().catch(err => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
