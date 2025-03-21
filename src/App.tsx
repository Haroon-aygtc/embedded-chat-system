import { Suspense } from "react";
import { Routes, Route, useRoutes } from "react-router-dom";
import routes from "tempo-routes";
import AppRoutes from "@/routes";
import { AuthProvider } from "@/context/AuthContext";
import ErrorBoundary from "@/components/ui/error-boundary";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2  border-primary"></div>
            </div>
          }
        >
          <div className="app-container">
            {/* For the tempo routes */}
            {import.meta.env.VITE_TEMPO && useRoutes(routes)}

            <Routes>
              {/* Add this before any catchall route */}
              {import.meta.env.VITE_TEMPO && <Route path="/tempobook/*" />}

              {/* Your existing routes */}
              <Route path="/*" element={<AppRoutes />} />
            </Routes>
          </div>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
