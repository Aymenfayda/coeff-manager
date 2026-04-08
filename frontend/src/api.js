const BASE = "/api";

async function handleResponse(r) {
  if (!r.ok) {
    let msg;
    try { const j = await r.json(); msg = j.error || JSON.stringify(j); }
    catch { msg = await r.text().catch(() => "HTTP " + r.status); }
    throw new Error(msg || "HTTP " + r.status);
  }
  return r.json();
}

function networkError(e) {
  if (e.message === "Failed to fetch") {
    throw new Error("Cannot reach server. Is CoeffManager running?");
  }
  throw e;
}

export const api = {
  async get(path) {
    return fetch(BASE + path).then(handleResponse).catch(networkError);
  },
  async post(path, body) {
    return fetch(BASE + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(handleResponse).catch(networkError);
  },
  async put(path, body) {
    return fetch(BASE + path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(handleResponse).catch(networkError);
  },
  async delete(path) {
    return fetch(BASE + path, { method: "DELETE" })
      .then(handleResponse).catch(networkError);
  },
  async upload(path, formData) {
    return fetch(BASE + path, { method: "POST", body: formData })
      .then(handleResponse).catch(networkError);
  },
  exportUrl(path) { return BASE + path; },
};
