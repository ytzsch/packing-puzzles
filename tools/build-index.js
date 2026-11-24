// Builds puzzles/index.json (the list on the home page) from every puzzle file in puzzles/.
// Runs on GitHub before each deploy, so uploading a puzzle file is all that's needed.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'puzzles');
const list = [];
for (const f of fs.readdirSync(dir).sort()) {
  if (!f.endsWith('.json') || f === 'index.json') continue;
  try {
    const p = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const id = f.slice(0, -5);
    const ch = p.challenges || [];
    list.push({ id, name: p.name || id, w: p.w, h: p.h, mask: p.mask, pieces: p.pieces.length, many: !!p.many, level: p.level || null,
      tray: ch.filter(c => c.type === 'tray').length, shape: ch.filter(c => c.type === 'shape').length, created: p.created || '' });
  } catch (e) { console.error('Skipped ' + f + ': ' + e.message); }
}
list.sort((a, b) => (a.created || '').localeCompare(b.created || ''));
fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(list));
console.log(list.length + ' puzzles listed');
