const fs = require('fs').promises;
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data', 'groceries.json');

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

async function findById(id) {
  const items = await readAll();
  return items.find(i => i.id === id);
}

async function add(item) {
  const items = await readAll();
  const maxId = items.reduce((m, it) => Math.max(m, it.id || 0), 0);
  const newItem = Object.assign({ id: maxId + 1 }, item);
  items.push(newItem);
  await writeAll(items);
  return newItem;
}

async function remove(id) {
  let items = await readAll();
  const before = items.length;
  items = items.filter(i => i.id !== id);
  if (items.length === before) return false; // nothing removed
  await writeAll(items);
  return true;
}

async function update(id, updates) {
  const items = await readAll();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  items[idx] = Object.assign({}, items[idx], updates, { id });
  await writeAll(items);
  return items[idx];
}

module.exports = {
  list,
  findById,
  add,
  remove,
  update,
};
