import './globals.css'

export const metadata = {
  title: 'Agente de Qualificação',
  description: 'CRM + IA de Qualificação para Advogados',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
