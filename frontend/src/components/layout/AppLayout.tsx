/**
 * AppLayout - Version moderne avec sidebar et header améliorés
 * Layout principal pour les vues authentifiées.
 * Structure: Sidebar (navigation) + Header (actions) + Outlet (contenu route).
 */
import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [sidebarWidth, setSidebarWidth] = useState(256) // 16rem = 256px

  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768
      setIsMobile(isMobileView)
      
      // On mobile, close sidebar when resizing to desktop
      if (!isMobileView && sidebarOpen) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sidebarOpen])

  // Écouter les changements de largeur du sidebar
  useEffect(() => {
    const handleSidebarChange = () => {
      const sidebar = document.querySelector('[data-sidebar-width]')
      if (sidebar) {
        const width = sidebar.getAttribute('data-sidebar-width')
        setSidebarWidth(width === 'collapsed' ? 64 : 256) // 4rem = 64px, 16rem = 256px
      }
    }

    // Observer les changements sur le sidebar
    const observer = new MutationObserver(handleSidebarChange)
    const sidebarElement = document.querySelector('[data-sidebar-width]')
    
    if (sidebarElement) {
      observer.observe(sidebarElement, { 
        attributes: true, 
        attributeFilter: ['data-sidebar-width'] 
      })
    }

    return () => {
      if (sidebarElement) {
        observer.disconnect()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - toujours visible sur desktop, overlay sur mobile */}
      <>
        {/* Sidebar pour desktop - FIXE */}
        <div className="hidden md:block fixed left-0 top-0 h-full z-50">
          <Sidebar />
        </div>
        
        {/* Sidebar pour mobile (overlay) */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
              <div className="fixed left-0 top-0 h-full w-64">
                <Sidebar />
              </div>
            </div>
          </>
        )}
      </>

      {/* Main content - avec padding dynamique selon la largeur du sidebar */}
      <div 
        className="flex-1 bg-background flex flex-col overflow-hidden transition-all duration-300"
        style={{ marginLeft: isMobile ? 0 : `${sidebarWidth}px` }}
      >
        {/* Header FIXE avec largeur dynamique */}
        <div 
          className="fixed top-0 right-0 z-40 transition-all duration-300"
          style={{ left: isMobile ? 0 : `${sidebarWidth}px` }}
        >
          <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>
        
        {/* Contenu principal avec padding pour le header */}
        <main className="flex-1 overflow-y-auto focus:outline-none pt-16">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="w-full mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
