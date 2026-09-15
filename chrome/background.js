async function getState() {
  const { blockedSites = [], protectionEnabled = true } = await chrome.storage.local.get([
    "blockedSites",
    "protectionEnabled",
  ]);
  return { blockedSites, protectionEnabled };
}

function domainToRule(domain, id) {
  return {
    id,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { extensionPath: `/blocked.html?site=${encodeURIComponent(domain)}` },
    },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: ["main_frame"],
    },
  };
}

async function syncRules() {
  const { blockedSites, protectionEnabled } = await getState();

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map((rule) => rule.id);

  const addRules = protectionEnabled
    ? blockedSites.map((domain, index) => domainToRule(domain, index + 1))
    : [];

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules,
  });
}

chrome.runtime.onInstalled.addListener(syncRules);
chrome.runtime.onStartup.addListener(syncRules);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.blockedSites || changes.protectionEnabled)) {
    syncRules();
  }
});
