import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import NavBar from '../components/NavBar'

export const metadata: Metadata = { title: 'StrideSense', description: 'Multi-framework frontend' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <Providers>
                    <NavBar />
                    {children}
                    <footer style={{borderTop:'1px solid #e5e7eb', marginTop: 24}}>
                        <div style={{maxWidth: 1152, margin: '0 auto', padding: '16px', fontSize: 12, color:'#6b7280', display:'flex', justifyContent:'space-between'}}>
                            <div>© {new Date().getFullYear()} StrideSense</div>
                            <div style={{display:'flex', gap:12}}>
                                <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Docs</a>
                            </div>
                        </div>
                    </footer>
                </Providers>
            </body>
        </html>
    )
}