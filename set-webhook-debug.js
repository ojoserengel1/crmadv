// TROCA: aponta para debug (para capturar payload de imagem/áudio)
// Depois rode novamente com url: '.../api/webhook/whatsapp' para restaurar

const URL_DEBUG = 'https://crm.grupoadv.com.br/api/debug/webhook'
const URL_MAIN  = 'https://crm.grupoadv.com.br/api/webhook/whatsapp'

const args = process.argv[2]
const url = args === 'restore' ? URL_MAIN : URL_DEBUG

fetch('https://grupoadv.uazapi.com/webhook', {
  method: 'POST',
  headers: {
    'token': '5c869095-cb06-4217-9853-278fc2d6b8be',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ url, events: ['messages'], enabled: true })
})
.then(r => r.json())
.then(data => console.log('Webhook agora aponta para:', url, '\nResposta:', JSON.stringify(data, null, 2)))
.catch(err => console.error('Erro:', err.message))
