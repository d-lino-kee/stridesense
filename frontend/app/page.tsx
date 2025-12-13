import Page from '../components/Page'
import RecommendationCard from '../components/Recommendation/RecommendationCard'


export default function HomePage(){
    return (
    <Page title="Run smarter." subtitle="React + Redux + TS + Next.js shell with an AngularJS micro-app">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24}}>
            <div>
                <p className="text-gray-700">Tell us how you're feeling — jog, light, mid, or marathon prep — and we'll recommend the right route with predicted soreness.</p>
                <div style={{display:'flex', gap:12, marginTop:16}}>
                    <a className="btn" href="/dashboard">Go to Dashboard</a>
                </div>
            </div>
            <div className="border rounded-2xl bg-white p-6 shadow-sm">
                <RecommendationCard result={{ route:{ route_id:1, name:'Lake Loop', distance_km:8.2, elevation_gain:120}, predicted_soreness:3, rationale:'Demo card' }} />
            </div>
        </div>
    </Page>
    )
}