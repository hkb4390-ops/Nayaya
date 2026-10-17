import { Outlet, Route, Routes } from "react-router-dom";
import { AppHeader } from "./components/AppHeader";
import { BottomNavigation } from "./components/BottomNavigation";
import { AllCoursesPage } from "./pages/AllCoursesPage";
import { CourseDetailsPage } from "./pages/CourseDetailsPage";
import { DeveloperPage } from "./pages/DeveloperPage";
import { HomePage } from "./pages/HomePage";
import { InspectPage } from "./pages/InspectPage";
import { MyCoursesPage } from "./pages/MyCoursesPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PdfPage } from "./pages/PdfPage";
import { TestsPage } from "./pages/TestsPage";
import { VideoPage } from "./pages/VideoPage";

function Layout() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<AllCoursesPage />} />
        <Route path="/course/:courseId" element={<CourseDetailsPage />} />
        <Route path="/my-courses" element={<MyCoursesPage />} />
        <Route path="/tests" element={<TestsPage />} />
        <Route path="/developer" element={<DeveloperPage />} />
        <Route path="/video/:videoId" element={<VideoPage />} />
        <Route path="/pdf" element={<PdfPage />} />
        <Route path="/inspect" element={<InspectPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
