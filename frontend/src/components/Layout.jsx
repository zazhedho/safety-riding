import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import Sidebar from './Sidebar'
import Header from './Header'

const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen)
  }

  // Add/remove a class on the body to prevent scrolling when the sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add('sidebar-is-open')
    } else {
      document.body.classList.remove('sidebar-is-open')
    }
    // Cleanup function
    return () => {
      document.body.classList.remove('sidebar-is-open')
    }
  }, [isSidebarOpen])

  const currentYear = new Date().getFullYear();
  const copyrightYear = currentYear > 2018 ? `2018-${currentYear}` : '2018';

  return (
    <div className={`layout-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <aside className="sidebar">
        <Sidebar />
      </aside>

      {/* Overlay for mobile, closes sidebar on click */}
      <div className="sidebar-overlay" onClick={toggleSidebar}></div>

      <div className="main-container d-flex flex-column">
        <Header toggleSidebar={toggleSidebar} />
        <main className="main-content flex-grow-1">
          <Container fluid className="p-4">
            <Outlet />
          </Container>
        </main>
        <footer className="footer mt-auto py-3 bg-light">
          <div className="container text-center">
            <span className="text-muted">© {copyrightYear} ZZ Family | <a href="https://www.linkedin.com/in/zaidus-zhuhur/" target="_blank" rel="noopener noreferrer">Help Center</a></span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default Layout
