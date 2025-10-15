import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import './styles.css'
import { ThemeProvider } from './theme'

import Encoding from './pages/Encoding'
import Strings from './pages/Strings'
import Compare from './pages/Compare'
import Security from './pages/Security'
import DataTools from './pages/DataTools'
import Misc from './pages/Misc'
import Contact from './pages/Contact'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Encoding /> },
      { path: 'strings', element: <Strings /> },
      { path: 'compare', element: <Compare /> },
      { path: 'security', element: <Security /> },
      { path: 'data', element: <DataTools /> },
      { path: 'misc', element: <Misc /> },
      { path: 'contact', element: <Contact /> },
    ]
  }
], { basename: import.meta.env.BASE_URL })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
)
