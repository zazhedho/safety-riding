import React from 'react'
import { Navbar, Nav, Dropdown, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <Navbar bg="white" expand="lg" className="px-4 py-3">
      <Button
        variant="outline-primary"
        className="d-md-none me-3"
        onClick={toggleSidebar}
      >
        <i className="fas fa-bars"></i>
      </Button>
      
      <Navbar.Brand className="d-md-none">
        <i className="fas fa-wrench me-2"></i>
        Workshop
      </Navbar.Brand>

      <Navbar.Toggle />
      <Navbar.Collapse>
        <Nav className="ms-auto">
          <Dropdown align="end">
            <Dropdown.Toggle variant="outline-primary" id="user-dropdown">
              <i className="fas fa-user-circle me-2"></i>
              {user?.name}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as={Link} to="/profile">
                <i className="fas fa-user me-2"></i>
                Profile
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout}>
                <i className="fas fa-sign-out-alt me-2"></i>
                Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

export default Header