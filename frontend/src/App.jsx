import { Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import RoomPage from "./pages/roompage";  
import QuestionLibrary from "./pages/questionLibrary";


function App() {
  return(
    <>
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />  
      <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/room/:roomId" element={
          <ProtectedRoute>
              <RoomPage />
          </ProtectedRoute>
        } 
      />

      <Route path="/questions" element={
          <ProtectedRoute>
              <QuestionLibrary />
          </ProtectedRoute>
        }
      />
    </Routes>
    </>
  )
}

export default App;