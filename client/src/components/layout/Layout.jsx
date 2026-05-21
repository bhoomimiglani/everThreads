import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import CartSidebar from '../cart/CartSidebar'
import AnnouncementBar from './AnnouncementBar'

export default function Layout() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <CartSidebar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
