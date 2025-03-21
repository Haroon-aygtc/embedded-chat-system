import { Suspense } from "react";
import { Routes, Route, useRoutes } from "react-router-dom";
import routes from "tempo-routes";
import AppRoutes from "@/routes";
import { AuthProvider } from "@/context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<p>Loading...</p>}>
        <div className="app-container">
          {/* For the tempo routes */}
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}

          <Routes>
            {/* Add this before any catchall route */}
            {import.meta.env.VITE_TEMPO === "true" && (
              <Route path="/tempobook/*" />
            )}

            {/* Your existing routes */}
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
        </div>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
