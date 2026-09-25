export function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadData(key) {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : [];
}
