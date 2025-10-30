import React from 'react'
import { Nav } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Sidebar = () => {
  const location = useLocation()
  const { user } = useAuth()

  const menuItems = [
    { path: '/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
    { path: '/bookings', icon: 'fas fa-calendar-check', label: 'Bookings' },
    { path: '/work-orders', icon: 'fas fa-clipboard-list', label: 'Work Orders' },
    { path: '/vehicles', icon: 'fas fa-car', label: 'Vehicles' },
    { path: '/services', icon: 'fas fa-tools', label: 'Services' },
  ]

  // Add Users menu for admin and cashier
  if (user?.role === 'admin' || user?.role === 'cashier') {
    menuItems.push({ path: '/users', icon: 'fas fa-users', label: 'Users' })
  }

  return (
    <div className="p-3">
      <div className="text-center mb-4">
        <h4 className="text-white mb-0">
          <i className="fas fa-wrench me-2"></i>
          Workshop
        </h4>
        <small className="text-white-50">Management System</small>
      </div>
      
      <Nav className="flex-column">
        {menuItems.map((item) => (
          <Nav.Link
            key={item.path}
            as={Link}
            to={item.path}
            className={location.pathname === item.path ? 'active' : ''}
          >
            <i className={`${item.icon} me-2`}></i>
            {item.label}
          </Nav.Link>
        ))}
      </Nav>
    </div>
  )
}

export default Sidebar