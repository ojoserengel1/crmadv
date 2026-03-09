const payload = {
  body: {
    instanceName: "ia-trabalhista-90f1b8",
    message: {
      sender_pn: "554797094291@s.whatsapp.net",
      text: "teste webhook direto",
      fromMe: false,
      messageid: "test-manual-005",
      messageTimestamp: 1772815437000
    }
  }
}

fetch("https://crm.grupoadv.com.br/api/webhook/whatsapp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
})
.then(r => r.json())
.then(data => console.log("Resposta:", JSON.stringify(data)))
.catch(err => console.error("Erro:", err.message))
