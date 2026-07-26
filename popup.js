const form = document.getElementById("add-form");
const input = document.getElementById("site-input");
const list = document.getElementById("site-list");

function normalizeDomain(raw) {
  let value = raw.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.replace(/^www\./, "");
  value = value.split("/")[0];
  return value;
}

async function getBlockedSites() {
  const { blockedSites = [] } = await chrome.storage.local.get("blockedSites");
  return blockedSites;
}

async function setBlockedSites(sites) {
  await chrome.storage.local.set({ blockedSites: sites });
}

function render(sites) {
  list.innerHTML = "";

  if (sites.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "Nenhum site bloqueado ainda.";
    list.appendChild(empty);
    return;
  }

  for (const site of sites) {
    const li = document.createElement("li");

    const label = document.createElement("span");
    label.textContent = site;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✕";
    removeBtn.className = "remove-btn";
    removeBtn.addEventListener("click", async () => {
      const sites = await getBlockedSites();
      const updated = sites.filter((s) => s !== site);
      await setBlockedSites(updated);
      render(updated);
    });

    li.appendChild(label);
    li.appendChild(removeBtn);
    list.appendChild(li);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const domain = normalizeDomain(input.value);
  if (!domain) return;

  const sites = await getBlockedSites();
  if (!sites.includes(domain)) {
    sites.push(domain);
    await setBlockedSites(sites);
  }

  input.value = "";
  render(sites);
});

(async () => {
  render(await getBlockedSites());
})();
