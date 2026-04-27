import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes' // <--- Import
import { GlobalLoadingProvider } from './context/GlobalLoadingContext'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light"> {}
      <QueryClientProvider client={queryClient}>
        <GlobalLoadingProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GlobalLoadingProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
