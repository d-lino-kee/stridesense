'use client'
import Script from 'next/script'
import React from 'react'

export default function LegacyPlanner() {
    return (
        <>
            <Script src = "https://ajax.googleapis.com/ajax/libs/angularjs/1.8.3/angular.min.js" strategy="afterInteractive" />
            <Script src="/legacy/legacy-app.js" strategy="afterInteractive" />
            <legacy-planner />
        </>
    )
}