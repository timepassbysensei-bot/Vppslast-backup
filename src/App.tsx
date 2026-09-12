import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/providers/AuthProvider";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminRoute } from "@/routes/guards";

import { Home } from "@/routes/public/Home";
import { About } from "@/routes/public/About";
import { Academics } from "@/routes/public/Academics";
import { Notices } from "@/routes/public/Notices";
import { ClassNotices } from "@/routes/public/ClassNotices";
import { HomeworkPage } from "@/routes/public/Homework";
import { CalendarPage } from "@/routes/public/Calendar";
import { AchievementsPage } from "@/routes/public/Achievements";
import { BirthdaysPage } from "@/routes/public/Birthdays";
import { GalleryPage } from "@/routes/public/Gallery";
import { ResourcesPage } from "@/routes/public/Resources";
import { Admissions } from "@/routes/public/Admissions";
import { Contact } from "@/routes/public/Contact";
import { Privacy } from "@/routes/public/Privacy";
import { Terms } from "@/routes/public/Terms";
import { AccessibilityPage } from "@/routes/public/Accessibility";
import { NotFound } from "@/routes/public/NotFound";

import { Login } from "@/routes/admin/Login";
import { Signup } from "@/routes/admin/Signup";
import { Pending } from "@/routes/admin/Pending";
import { TeacherDashboard } from "@/routes/admin/TeacherDashboard";
import { PrincipalDashboard } from "@/routes/admin/PrincipalDashboard";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/academics" element={<Academics />} />
                <Route path="/notices" element={<Notices />} />
                <Route path="/class-notices" element={<ClassNotices />} />
                <Route path="/homework" element={<HomeworkPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/birthdays" element={<BirthdaysPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/admissions" element={<Admissions />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/accessibility" element={<AccessibilityPage />} />
              </Route>

              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin/signup" element={<Signup />} />
              <Route path="/admin/pending" element={<Pending />} />
              <Route
                path="/admin/teacher"
                element={
                  <AdminRoute need="staff">
                    <TeacherDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/principal"
                element={
                  <AdminRoute need="principal">
                    <PrincipalDashboard />
                  </AdminRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}
