const targetEl = document.getElementById("target-site");
const listEl = document.getElementById("site-list");

const params = new URLSearchParams(window.location.search);
const currentSite = params.get("site") || "";

if (currentSite) {
  targetEl.textContent = currentSite;
} else {
  targetEl.remove();
}

async function getBlockedSites() {
  const { blockedSites = [] } = await chrome.storage.local.get("blockedSites");
  return blockedSites;
}

function render(sites) {
  listEl.innerHTML = "";

  if (sites.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "Nenhum site bloqueado.";
    listEl.appendChild(empty);
    return;
  }

  for (const site of sites) {
    const li = document.createElement("li");
    li.textContent = site;
    if (site === currentSite) {
      li.classList.add("current");
    }
    listEl.appendChild(li);
  }
}

(async () => {
  render(await getBlockedSites());
})();
