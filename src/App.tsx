import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import PageGuard from "./components/PageGuard";
import PageSkeleton from "./components/PageSkeleton";
import { useTheme } from "./hooks/useTheme";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const StudentList = lazy(() => import("./pages/StudentList"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const StudentEdit = lazy(() => import("./pages/StudentEdit"));
const FeeManagement = lazy(() => import("./pages/FeeCollection"));
const Attendance = lazy(() => import("./pages/Attendance"));
const StudentAttendance = lazy(() => import("./pages/StudentAttendance"));
const IncomeManagement = lazy(() => import("./pages/IncomeManagement"));
const ExpenseManagement = lazy(() => import("./pages/ExpenseManagement"));
const SalaryManagement = lazy(() => import("./pages/SalaryManagement"));
const Cashbook = lazy(() => import("./pages/Cashbook"));
const MonthlyClosing = lazy(() => import("./pages/MonthlyClosing"));
const ExamManagement = lazy(() => import("./pages/ExamManagement"));
const NoticeBoard = lazy(() => import("./pages/NoticeBoard"));
const LibraryPage = lazy(() => import("./pages/Library"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const StudentPaymentHistory = lazy(() => import("./pages/StudentPaymentHistory"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const WhatsAppMessaging = lazy(() => import("./pages/WhatsAppMessaging"));
const BiometricAttendance = lazy(() => import("./pages/BiometricAttendance"));
const ParentPortal = lazy(() => import("./pages/ParentPortal"));
const ParentLogin = lazy(() => import("./pages/ParentLogin"));
const StudentLogin = lazy(() => import("./pages/StudentLogin"));
const StudentPortal = lazy(() => import("./pages/StudentPortal"));
const StudentRegister = lazy(() => import("./pages/StudentRegister"));
const IdCard = lazy(() => import("./pages/IdCard"));
const ClassRoutine = lazy(() => import("./pages/ClassRoutine"));
const Syllabus = lazy(() => import("./pages/Syllabus"));
const Assignments = lazy(() => import("./pages/Assignments"));
const ExamRoutine = lazy(() => import("./pages/ExamRoutine"));
const AdmitCard = lazy(() => import("./pages/AdmitCard"));
const Marksheet = lazy(() => import("./pages/Marksheet"));
const TeacherGradeEntry = lazy(() => import("./pages/TeacherGradeEntry"));
const Hostel = lazy(() => import("./pages/Hostel"));
const Inventory = lazy(() => import("./pages/Inventory"));
const HifzTracking = lazy(() => import("./pages/HifzTracking"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => {
  // Initialize theme class on <html> from localStorage
  useTheme();

  return (
  <BrowserRouter>
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/signup"
        element={
          <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
            <Signup />
          </Suspense>
        }
      />
      <Route
        path="/student-login"
        element={
          <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
            <StudentLogin />
          </Suspense>
        }
      />
      <Route
        path="/student-portal"
        element={
          <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
            <StudentPortal />
          </Suspense>
        }
      />
      <Route
        path="/student-register"
        element={
          <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
            <StudentRegister />
          </Suspense>
        }
      />
      <Route
        path="/parent-login"
        element={
          <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
            <ParentLogin />
          </Suspense>
        }
      />
      <Route
        path="/parent"
        element={
          <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
            <ParentPortal />
          </Suspense>
        }
      />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<PageSkeleton showTable rows={5} />}>
                <Routes>
                  <Route path="/" element={<PageGuard pageKey="dashboard"><Dashboard /></PageGuard>} />
                  <Route path="/students" element={<PageGuard pageKey="students"><StudentList /></PageGuard>} />
                  <Route path="/students/new" element={<PageGuard pageKey="students"><StudentEdit /></PageGuard>} />
                  <Route path="/students/:id" element={<PageGuard pageKey="students"><StudentProfile /></PageGuard>} />
                  <Route path="/students/:id/edit" element={<PageGuard pageKey="students"><StudentEdit /></PageGuard>} />
                  <Route path="/attendance" element={<PageGuard pageKey="staff_attendance"><Attendance /></PageGuard>} />
                  <Route path="/student-attendance" element={<PageGuard pageKey="student_attendance"><StudentAttendance /></PageGuard>} />
                  <Route path="/fees" element={<PageGuard pageKey="fees"><FeeManagement /></PageGuard>} />
                  <Route path="/income" element={<PageGuard pageKey="income"><IncomeManagement /></PageGuard>} />
                  <Route path="/expense" element={<PageGuard pageKey="expense"><ExpenseManagement /></PageGuard>} />
                  <Route path="/salary" element={<PageGuard pageKey="salary"><SalaryManagement /></PageGuard>} />
                  <Route path="/cashbook" element={<PageGuard pageKey="cashbook"><Cashbook /></PageGuard>} />
                  <Route path="/monthly-closing" element={<PageGuard pageKey="cashbook"><MonthlyClosing /></PageGuard>} />
                  <Route path="/exams" element={<PageGuard pageKey="exams"><ExamManagement /></PageGuard>} />
                  <Route path="/notices" element={<PageGuard pageKey="notices"><NoticeBoard /></PageGuard>} />
                  <Route path="/library" element={<PageGuard pageKey="library"><LibraryPage /></PageGuard>} />
                  <Route path="/reports" element={<PageGuard pageKey="reports"><Reports /></PageGuard>} />
                  <Route path="/settings" element={<PageGuard pageKey="settings"><Settings /></PageGuard>} />
                  <Route path="/student-payment-history" element={<PageGuard pageKey="payment_history"><StudentPaymentHistory /></PageGuard>} />
                  <Route path="/whatsapp" element={<PageGuard pageKey="whatsapp_messaging"><WhatsAppMessaging /></PageGuard>} />
                  <Route path="/biometric-attendance" element={<PageGuard pageKey="biometric_attendance"><BiometricAttendance /></PageGuard>} />
                  <Route path="/id-card" element={<PageGuard pageKey="id_card"><IdCard /></PageGuard>} />
                  <Route path="/class-routine" element={<PageGuard pageKey="class_routine"><ClassRoutine /></PageGuard>} />
                  <Route path="/syllabus" element={<PageGuard pageKey="syllabus"><Syllabus /></PageGuard>} />
                  <Route path="/assignments" element={<PageGuard pageKey="assignments"><Assignments /></PageGuard>} />
                  <Route path="/exam-routine" element={<PageGuard pageKey="exam_routine"><ExamRoutine /></PageGuard>} />
                  <Route path="/admit-card" element={<PageGuard pageKey="admit_card"><AdmitCard /></PageGuard>} />
                  <Route path="/marksheet" element={<PageGuard pageKey="marksheet"><Marksheet /></PageGuard>} />
                  <Route path="/teacher-grade-entry" element={<PageGuard pageKey="teacher_grade_entry"><TeacherGradeEntry /></PageGuard>} />
                  <Route path="/hostel" element={<PageGuard pageKey="hostel"><Hostel /></PageGuard>} />
                  <Route path="/inventory" element={<PageGuard pageKey="inventory"><Inventory /></PageGuard>} />
                  <Route path="/hifz" element={<PageGuard pageKey="hifz_tracking"><HifzTracking /></PageGuard>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>
  );
};

export default App;