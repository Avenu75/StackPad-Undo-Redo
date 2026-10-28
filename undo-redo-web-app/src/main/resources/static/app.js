const editor = document.getElementById("editor");
const undoBtn = document.getElementById("undo-btn");
const redoBtn = document.getElementById("redo-btn");
const clearBtn = document.getElementById("clear-btn");
const historyBtn = document.getElementById("history-btn");
const modal = document.getElementById("history-modal");
const saveStatus = document.getElementById("save-status");
const wordCount = document.getElementById("word-count");
const toast = document.getElementById("toast");

let timer = null;
let lastSavedText = "";
let requestQueue = Promise.resolve();

async function api(path, body) {
  const options = { method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" } };
  if (body !== undefined) options.body = JSON.stringify(body);
  const response = await fetch("/api/editor" + path, options);
  if (!response.ok) throw new Error("Request failed");
  return response.json();
}

function updateCounts() {
  const text = editor.value;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  wordCount.textContent = `${words} ${words === 1 ? "word" : "words"} · ${text.length} characters`;
}

function updateButtons(state) {
  undoBtn.disabled = !state.canUndo;
  redoBtn.disabled = !state.canRedo;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), 1800);
}

function queueSave(text) {
  requestQueue = requestQueue.then(async () => {
    const state = await api("/change", { text });
    lastSavedText = text;
    updateButtons(state);
    saveStatus.textContent = "All changes saved";
  }).catch(() => {
    saveStatus.textContent = "Connection issue — try again";
  });
  return requestQueue;
}

function scheduleSave() {
  updateCounts();
  saveStatus.textContent = "Saving…";
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (editor.value !== lastSavedText) queueSave(editor.value);
  }, 350);
}

async function flushPendingSave() {
  clearTimeout(timer);
  if (editor.value !== lastSavedText) await queueSave(editor.value);
  else await requestQueue;
}

async function doUndo() {
  await flushPendingSave();
  try {
    const state = await api("/undo", {});
    editor.value = state.text;
    lastSavedText = state.text;
    updateCounts();
    updateButtons(state);
    saveStatus.textContent = "Undo complete";
  } catch { showToast("Could not undo. Check your connection."); }
}

async function doRedo() {
  await flushPendingSave();
  try {
    const state = await api("/redo", {});
    editor.value = state.text;
    lastSavedText = state.text;
    updateCounts();
    updateButtons(state);
    saveStatus.textContent = "Redo complete";
  } catch { showToast("Could not redo. Check your connection."); }
}

editor.addEventListener("input", scheduleSave);
undoBtn.addEventListener("click", doUndo);
redoBtn.addEventListener("click", doRedo);

clearBtn.addEventListener("click", async () => {
  await flushPendingSave();
  try {
    const state = await api("/clear", {});
    editor.value = state.text;
    lastSavedText = state.text;
    updateCounts();
    updateButtons(state);
    saveStatus.textContent = "Editor cleared";
    showToast("Text cleared — you can still undo it.");
  } catch { showToast("Could not clear the editor."); }
});

async function showHistory() {
  await flushPendingSave();
  try {
    const data = await api("/history");
    renderHistory("undo-history", data.undoHistory);
    renderHistory("redo-history", data.redoHistory);
    document.getElementById("undo-count").textContent = data.undoHistory.length;
    document.getElementById("redo-count").textContent = data.redoHistory.length;
    modal.classList.remove("hidden");
  } catch { showToast("Could not load history."); }
}

function renderHistory(id, items) {
  const list = document.getElementById(id);
  list.replaceChildren();
  const reversed = [...items].reverse();
  if (!reversed.length) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = "No saved states yet";
    list.appendChild(li);
    return;
  }
  reversed.forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
  });
}

historyBtn.addEventListener("click", showHistory);
document.getElementById("close-history").addEventListener("click", () => modal.classList.add("hidden"));
modal.addEventListener("click", event => { if (event.target === modal) modal.classList.add("hidden"); });

document.addEventListener("keydown", event => {
  const modifier = event.ctrlKey || event.metaKey;
  if (modifier && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) doRedo(); else doUndo();
  } else if (modifier && event.key.toLowerCase() === "y") {
    event.preventDefault();
    doRedo();
  }
});

(async function init() {
  try {
    const state = await api("");
    editor.value = state.text;
    lastSavedText = state.text;
    updateCounts();
    updateButtons(state);
  } catch {
    saveStatus.textContent = "Unable to connect to Java backend";
  }
})();
