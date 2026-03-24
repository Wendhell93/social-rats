import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { PeriodProvider } from "./contexts/PeriodContext";
import { AreaFilterProvider } from "./contexts/AreaFilterContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminRoute } from "./components/AdminRoute";
import { AuthenticatedRoute } from "./components/AuthenticatedRoute";
import Dashboard from "./pages/Dashboard";
import Creators from "./pages/Creators";
import CreatorProfile from "./pages/CreatorProfile";
import Posts from "./pages/Posts";
import NewPost from "./pages/NewPost";
import EditPost from "./pages/EditPost";
import Ranking from "./pages/Ranking";
import Awards from "./pages/Awards";
import Settings from "./pages/Settings";
import ScoreSpaces from "./pages/ScoreSpaces";
import CreationSchool from "./pages/CreationSchool";
import MyProfile from "./pages/MyProfile";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PeriodProvider>
        <AreaFilterProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/creators" element={<Creators />} />
                    <Route path="/creators/:id" element={<CreatorProfile />} />
                    <Route path="/posts" element={<Posts />} />
                    <Route path="/posts/new" element={<AuthenticatedRoute><NewPost /></AuthenticatedRoute>} />
                    <Route path="/posts/:id/edit" element={<AuthenticatedRoute><EditPost /></AuthenticatedRoute>} />
                    <Route path="/meu-perfil" element={<AuthenticatedRoute><MyProfile /></AuthenticatedRoute>} />
                    <Route path="/ranking" element={<Ranking />} />
                    <Route path="/awards" element={<Awards />} />
                    <Route path="/quero-pontuar" element={<ScoreSpaces />} />
                    <Route path="/escola-de-criacao" element={<CreationSchool />} />
                    <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </BrowserRouter>
        </AreaFilterProvider>
      </PeriodProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
