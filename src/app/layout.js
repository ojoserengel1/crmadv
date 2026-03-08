import './globals.css'

export const metadata = {
  title: 'Grupo ADV',
  description: 'CRM + IA de Qualificação para Advogados',
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
