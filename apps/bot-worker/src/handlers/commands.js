
const { addReport, addLink } = require("../services/indexer");
const { createIntelligence } = require("../services/pipeline");

const { ConfidenceLevel, ActorType } = require("../_vendor/shared-types");

function handleCommand(input) {
  const parts = input.trim().split(" ");
  const cmd = parts[0];

  if (cmd === "/report") {
    const report = {
      id: "r_" + Date.now(),
      title: parts.slice(1).join(" "),
      description: "auto-generated report",
      reporter: {
        id: "user_1",
        type: ActorType.TELEGRAM_USER
      },
      suspects: [],
      evidence: [],
      confidence: ConfidenceLevel.LOW,
      tags: [],
      createdAt: Date.now()
    };

    addReport(report);
    return createIntelligence(report);
  }

  if (cmd === "/link") {
    return addLink({
      from: parts[1],
      to: parts[2],
      relation: "associated_with",
      weight: 1
    });
  }

  return "UNKNOWN_COMMAND";
}

module.exports = { handleCommand };
