import './globals.css'
export const metadata = {
  title: 'CMS - KidShine Hawaii',
  description: 'Clinic Management Portal',
  authors: [{ name: 'Mark Murillo', url: 'https://www.linkedin.com/in/mark-murillo/' }],
  creator: 'Mark Murillo',
  publisher: 'KidShine Hawaii',
  generator: 'Next.js',
  applicationName: 'KidShine CMS',
  keywords: ['clinic', 'management', 'dental', 'pediatric'],

  
}
export default function RootLayout({ children }) {
  return (
<html lang="en">
        <head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
        </head>
        <body>{children}</body>
      </html>
  )
}
