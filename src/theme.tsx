import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const ThemeCtx = createContext<{theme: Theme, toggle: ()=>void}>({theme: 'light', toggle: ()=>{}})

export function ThemeProvider({ children }: {children: React.ReactNode}) {
  const [theme, setTheme] = useState<Theme>(()=>{
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(()=>{
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])
  function toggle(){ setTheme(t => t === 'dark' ? 'light' : 'dark') }
  return <ThemeCtx.Provider value={{theme, toggle}}>{children}</ThemeCtx.Provider>
}
export function useTheme(){ return useContext(ThemeCtx) }
