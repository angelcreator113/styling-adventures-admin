export function getClientId() {
  let id = localStorage.getItem("clientId");
  if (!id) {
    id = "anon-" + crypto.randomUUID();
    localStorage.setItem("clientId", id);
  }
  return id;
}
