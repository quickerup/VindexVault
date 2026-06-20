function extractEntities(text = "") {
  return {
    urls: [...new Set(text.match(/https?:\/\/\S+/gi) || [])],
    domains: [...new Set(text.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi) || [])],
    telegrams: [...new Set(text.match(/@[a-zA-Z0-9_]{4,}/g) || [])],
    hashes: [...new Set(text.match(/\b[a-fA-F0-9]{32,64}\b/g) || [])],

    // TON/EVM style addresses (rough first pass)
    wallets: [...new Set(
      text.match(/\b(?:EQ|UQ)[A-Za-z0-9_-]{20,}\b|\b0x[a-fA-F0-9]{40}\b/g) || []
    )]
  };
}

module.exports = { extractEntities };
