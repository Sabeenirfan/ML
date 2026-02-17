/**
 * Simple file-based cart store for "missing ingredients" (FE-5).
 * Cart items are ingredients the user wants to buy.
 */
const fs = require('fs').promises;
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data', 'cart.json');

async function readAll() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeAll(items) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(items, null, 2), 'utf8');
}

async function list() {
  return await readAll();
}

async function add(item) {
  const items = await readAll();
  const maxId = items.reduce((m, it) => Math.max(m, it.id || 0), 0);
  const newItem = Object.assign({ id: maxId + 1 }, item);
  items.push(newItem);
  await writeAll(items);
  return newItem;
}

async function addMany(newItems) {
  const items = await readAll();
  const maxId = items.reduce((m, it) => Math.max(m, it.id || 0), 0);
  let nextId = maxId + 1;
  for (const item of newItems) {
    items.push(Object.assign({ id: nextId++ }, item));
  }
  await writeAll(items);
  return items.slice(-newItems.length);
}

async function remove(id) {
  let items = await readAll();
  const before = items.length;
  items = items.filter(i => i.id !== id);
  if (items.length === before) return false;
  await writeAll(items);
  return true;
}

async function clear() {
  await writeAll([]);
  return true;
}

module.exports = {
  list,
  add,
  addMany,
  remove,
  clear,
};
