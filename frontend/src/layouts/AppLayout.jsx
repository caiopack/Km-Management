import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import logo from '../assets/cse.png'; // ajuste conforme sua estrutura

export default function AppLayout() {
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 800);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 800);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="d-flex vh-100">
      {/* Mobile Navbar + Offcanvas */}
      {!isDesktop && (
        <>
          <nav className="navbar navbar-dark bg-sidebar fixed-top d-lg-none">
            <div className="container-fluid d-flex justify-content-between align-items-center px-3">
              <img
                src={logo}
                alt="CSE Manager"
                className="navbar-brand mb-0"
                style={{ maxHeight: 55, objectFit: 'contain' }}
              />
              <button
                className="btn btn-outline-light"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasSidebar"
                aria-controls="offcanvasSidebar"
              >
                <i className="bi bi-list"></i>
              </button>
            </div>
          </nav>

          <div
            className="offcanvas offcanvas-start bg-sidebar text-white"
            id="offcanvasSidebar"
            tabIndex="-1"
          >
            <div className="offcanvas-header">
              <h5 className="offcanvas-title">Menu</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="offcanvas"
                aria-label="Close"
              />
            </div>
            <div className="offcanvas-body p-0">
              <Sidebar onLogout={handleLogout} mobileClose={true} />
            </div>
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      {isDesktop && (
        <aside className="bg-sidebar text-white" style={{ width: '240px' }}>
          <Sidebar onLogout={handleLogout} mobileClose={false} />
        </aside>
      )}

      {/* Main Content */}
      <main className={`flex-grow-1 bg-main text-white p-4${!isDesktop ? ' mt-5' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}
