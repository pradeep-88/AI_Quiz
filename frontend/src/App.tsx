import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { connect } from './socket/socket'
import { useSocketEvents } from './hooks/useSocketEvents'
import { Navbar } from './components/layout/Navbar'
import { Background } from './components/layout/Background'
import { ToastContainer } from './components/layout/Toast'
import { AppRoutes } from './routes/AppRoutes'

function AppLayout() {
  useSocketEvents()

  useEffect(() => {
    connect()
  }, [])

  return (
    <Background>
      <Navbar />
      <main className="relative">
        <AppRoutes />
      </main>
      <ToastContainer />
    </Background>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
