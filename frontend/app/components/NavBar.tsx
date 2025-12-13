'use client'
import Link from 'next/link'
export default function NavBar(){
    return (
        <nav style={{position:'sticky', top:0, backdropFilter:'blur(8px)', background:'#fff', borderBottom:'1px solid #e5e7eb', zIndex:50}}>
            <div className="container" style={{paddingTop:12, paddingBottom:12}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <Link href="/"><b>StrideSense</b> <span className="text-gray-600" style={{fontSize:12}}>(multi-framework)</span></Link>
                <div style={{display:'flex', gap:12}}>
                    <Link href="/dashboard">Dashboard</Link>
                </div>
                </div>
            </div>
        </nav>
    )
}