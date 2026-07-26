const BLOCKED_PAGE = chrome.runtime.getURL("blocked.html");

async function getBlockedSites() {
  const { blockedSites = [] } = await chrome.storage.local.get("blockedSites");
  return blockedSites;
}

function domainToRule(domain, id) {
  return {
    id,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { url: BLOCKED_PAGE },
    },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: ["main_frame"],
    },
  };
}

async function syncRules() {
  const sites = await getBlockedSites();

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map((rule) => rule.id);

  const addRules = sites.map((domain, index) => domainToRule(domain, index + 1));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules,
  });
}

chrome.runtime.onInstalled.addListener(syncRules);
chrome.runtime.onStartup.addListener(syncRules);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.blockedSites) {
    syncRules();
  }
});
