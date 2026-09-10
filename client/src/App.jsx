import { useState } from 'react'
import Dashboard from './features/dashboard/Dashboard'
import Login from './features/auth/Login'
import Register from './features/auth/Register'

function App() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [staff, setStaff] = useState(null)

  function changeAuthPage(nextPage) {
    window.setTimeout(() => {
      setIsRegistering(nextPage)
    }, 120)
  }

  if (staff) {
    return (
      <main className="h-dvh w-screen overflow-hidden bg-[#f5f7fb]">
        <Dashboard staff={staff} onLogout={() => setStaff(null)} />
      </main>
    )
  }

  return (
    <main className="h-dvh w-screen overflow-hidden bg-[#f5f7fb]">
      {isRegistering ? (
        <Register onLogin={() => changeAuthPage(false)} />
      ) : (
        <Login onRegister={() => changeAuthPage(true)} onLogin={setStaff} />
      )}
    </main>
  )
}

export default App
