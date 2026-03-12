import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { PeriodProvider } from "./contexts/PeriodContext";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PeriodProvider>
    <Toaster />
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/creators/:id" element={<CreatorProfile />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/posts/new" element={<NewPost />} />
          <Route path="/posts/:id/edit" element={<EditPost />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/awards" element={<Awards />} />
          <Route path="/quero-pontuar" element={<ScoreSpaces />} />
          <Route path="/escola-de-criacao" element={<CreationSchool />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
    </PeriodProvider>
  </QueryClientProvider>
);

export default App;

