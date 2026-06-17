import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, useLocation } from "react-router-dom";
import posthog from 'posthog-js'

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    capture_pageview: false,
})

function PostHogPageView() {
    const location = useLocation()
    useEffect(() => {
        posthog.capture('$pageview')
    }, [location])
    return null
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <PostHogPageView />
            <App />
        </BrowserRouter>
    </StrictMode>
)
