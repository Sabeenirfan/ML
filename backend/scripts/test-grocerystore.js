const store = require('../src/shared/groceryStore');

async function run() {
  console.log('Initial list:');
  console.log(await store.list());

  console.log('\nAdding an item:');
  const added = await store.add({ name: 'Apples', category: 'Produce', quantity: 8, unit: 'pcs', price: 0.5 });
  console.log(added);

  console.log('\nList after add:');
  console.log(await store.list());

  console.log('\nUpdating the new item quantity to 10:');
  const updated = await store.update(added.id, { quantity: 10 });
  console.log(updated);

  console.log('\nRemoving the new item:');
  const removed = await store.remove(added.id);
  console.log('removed?', removed);

  console.log('\nFinal list:');
  console.log(await store.list());
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
