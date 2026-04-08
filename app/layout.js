import './globals.css'
export const metadata = {
  title: 'Care Command Hub - KidShine Hawaii',
  description: 'Care Command Hub',
  authors: [{ name: 'Mark Murillo', url: 'https://www.linkedin.com/in/mark-murillo/' }],
  creator: 'Mark Murillo',
  publisher: 'KidShine Hawaii',
  generator: 'Next.js',
  applicationName: 'KidShine CCH',
  keywords: ['clinic', 'management', 'dental', 'pediatric'],

  
}
export default function RootLayout({ children }) {
  return (
<html lang="en">
        <head>
          <link rel="icon" type="image/png" href="/favicon.png" />
        </head>
        <body>{children}</body>
      </html>
  )
}
