const viewList = document.getElementById("view-list");
const viewAdd = document.getElementById("view-add");

const protectionBadge = document.getElementById("protection-badge");
const protectionLabel = protectionBadge.querySelector(".protection-label");
const countBadge = document.getElementById("site-count");
const siteListEl = document.getElementById("site-list");
const emptyState = document.getElementById("empty-state");

const addSiteBtn = document.getElementById("add-site-btn");
const addFirstSiteBtn = document.getElementById("add-first-site-btn");
const blockCurrentBtn = document.getElementById("block-current-btn");
const blockCurrentLabel = document.getElementById("block-current-label");
const toggleProtectionBtn = document.getElementById("toggle-protection-btn");
const toggleProtectionLabel = document.getElementById("toggle-protection-label");

const backBtn = document.getElementById("back-btn");
const cancelBtn = document.getElementById("cancel-btn");
const addForm = document.getElementById("add-form");
const siteInput = document.getElementById("site-input");

let currentTabDomain = null;

function normalizeDomain(raw) {
  let value = raw.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.replace(/^www\./, "");
  value = value.split("/")[0];
  return value;
}

function domainHue(domain) {
  let hash = 0;
  for (const char of domain) {
    hash = (hash * 31 + char.charCodeAt(0)) % 360;
  }
  return hash;
}

async function getState() {
  const { blockedSites = [], protectionEnabled = true } = await chrome.storage.local.get([
    "blockedSites",
    "protectionEnabled",
  ]);
  return { blockedSites, protectionEnabled };
}

async function setBlockedSites(sites) {
  await chrome.storage.local.set({ blockedSites: sites });
}

async function setProtectionEnabled(enabled) {
  await chrome.storage.local.set({ protectionEnabled: enabled });
}

function showView(view) {
  viewList.classList.toggle("hidden", view !== "list");
  viewAdd.classList.toggle("hidden", view !== "add");
}

function pluralSites(count) {
  return count === 1 ? "1 site" : `${count} sites`;
}

function renderSiteRow(domain, protectionEnabled) {
  const row = document.createElement("div");
  row.className = "site-row";

  const favicon = document.createElement("div");
  favicon.className = "site-favicon";
  favicon.textContent = domain[0].toUpperCase();
  const hue = domainHue(domain);
  favicon.style.background = `hsl(${hue} 70% 93%)`;
  favicon.style.color = `hsl(${hue} 50% 38%)`;

  const label = document.createElement("span");
  label.className = "site-domain";
  label.textContent = domain;

  const status = document.createElement("span");
  status.className = "status-pill" + (protectionEnabled ? "" : " paused");
  status.textContent = protectionEnabled ? "Bloqueado" : "Pausado";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-btn";
  deleteBtn.setAttribute("aria-label", `Remover ${domain}`);
  deleteBtn.innerHTML =
    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-8 0 1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12"/></svg>';
  deleteBtn.addEventListener("click", async () => {
    const { blockedSites } = await getState();
    const updated = blockedSites.filter((s) => s !== domain);
    await setBlockedSites(updated);
    await render();
  });

  row.appendChild(favicon);
  row.appendChild(label);
  row.appendChild(status);
  row.appendChild(deleteBtn);
  return row;
}

async function render() {
  const { blockedSites, protectionEnabled } = await getState();

  protectionBadge.classList.toggle("paused", !protectionEnabled);
  protectionLabel.textContent = protectionEnabled ? "Proteção ativa" : "Proteção pausada";

  countBadge.textContent = pluralSites(blockedSites.length);

  siteListEl.innerHTML = "";
  const hasSites = blockedSites.length > 0;
  emptyState.classList.toggle("hidden", hasSites);
  siteListEl.classList.toggle("hidden", !hasSites);
  toggleProtectionBtn.classList.toggle("hidden", !hasSites);
  addSiteBtn.classList.toggle("hidden", !hasSites);

  for (const domain of blockedSites) {
    siteListEl.appendChild(renderSiteRow(domain, protectionEnabled));
  }

  toggleProtectionLabel.textContent = protectionEnabled ? "Pausar bloqueio" : "Retomar bloqueio";

  updateBlockCurrentButton(blockedSites);
}

function updateBlockCurrentButton(blockedSites) {
  if (!currentTabDomain || blockedSites.includes(currentTabDomain)) {
    blockCurrentBtn.classList.add("hidden");
    return;
  }
  blockCurrentBtn.classList.remove("hidden");
  blockCurrentLabel.textContent = `Bloquear ${currentTabDomain}`;
}

async function addDomain(domain) {
  const { blockedSites } = await getState();
  if (!domain || blockedSites.includes(domain)) return;
  await setBlockedSites([...blockedSites, domain]);
}

async function detectCurrentTabDomain() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;
    const url = new URL(tab.url);
    if (!url.protocol.startsWith("http")) return;
    currentTabDomain = normalizeDomain(url.hostname);
  } catch {
    currentTabDomain = null;
  }
}

addSiteBtn.addEventListener("click", () => {
  siteInput.value = "";
  showView("add");
  siteInput.focus();
});

addFirstSiteBtn.addEventListener("click", () => {
  siteInput.value = "";
  showView("add");
  siteInput.focus();
});

blockCurrentBtn.addEventListener("click", async () => {
  if (!currentTabDomain) return;
  await addDomain(currentTabDomain);
  await render();
});

toggleProtectionBtn.addEventListener("click", async () => {
  const { protectionEnabled } = await getState();
  await setProtectionEnabled(!protectionEnabled);
  await render();
});

backBtn.addEventListener("click", () => showView("list"));
cancelBtn.addEventListener("click", () => showView("list"));

addForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const domain = normalizeDomain(siteInput.value);
  if (!domain) return;
  await addDomain(domain);
  showView("list");
  await render();
});

(async () => {
  await detectCurrentTabDomain();
  await render();
})();
