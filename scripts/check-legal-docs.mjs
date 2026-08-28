import https from 'https';

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdWVicW1sdGtzeXpub3ZobHdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjM5NDE5NywiZXhwIjoyMTAxOTcwMTk3fQ.fQA4JVYOoEAuTltYvqNBeYArVKK6N9Zfz7fZiNXMoQs';

const options = {
  hostname: 'jfuebqmltksyznovhlwa.supabase.co',
  path: '/rest/v1/legal_documents?select=slug,title,version,is_published,is_mandatory,updated_at&order=created_at',
  method: 'GET',
  headers: {
    'apikey': serviceKey,
    'Authorization': 'Bearer ' + serviceKey,
  }
};

const r = https.request(options, (res) => {
  let d = '';
  res.on('data', chunk => d += chunk);
  res.on('end', () => {
    const docs = JSON.parse(d);
    console.log('Total documentos no banco:', docs.length);
    console.log('');
    docs.forEach(doc => {
      const status = doc.is_published ? '🟢 Publicado' : '🔴 Rascunho';
      const mandatory = doc.is_mandatory ? '⚠️ Obrigatório' : 'Opcional';
      console.log(`  [${doc.slug}] v${doc.version} — ${status} — ${mandatory}`);
      console.log(`    ${doc.title}`);
    });
  });
});
r.on('error', e => console.error(e.message));
r.end();
