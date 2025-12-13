export default function Page({ title, subtitle, children }:{ title: string; subtitle?:string; children:React.ReactNode }){
    return (
        <div className="container">
            <div style={{marginBottom:24}}>
                <h1 style={{margin:0}}>{title}</h1>
                {subtitle && <p className="text-gray-600" style={{marginTop:6}}>{subtitle}</p>}
            </div>
        </div>
    )
}