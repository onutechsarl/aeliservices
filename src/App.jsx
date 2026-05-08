import React, { useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Composants critiques (on peut les laisser en import classique ou lazy)
import { InstallBanner } from './components/PWA/InstallBanner';
import { Loading } from './components/global/Loading';

// --- IMPORTATIONS DYNAMIQUES (LAZY LOADING) ---

const LoginScreen = lazy(() => import('./screens/LoginScreen').then(m => ({ default: m.LoginScreen })));
const ForgotPasswordScreen = lazy(() => import('./screens/ForgotPasswordScreen').then(m => ({ default: m.ForgotPasswordScreen })));
const RegisterScreen = lazy(() => import('./screens/RegisterScreen').then(m => ({ default: m.RegisterScreen })));
const OtpScreen = lazy(() => import('./screens/OtpScreen').then(m => ({ default: m.OtpScreen })));
const Base = lazy(() => import('./screens/Base').then(m => ({ default: m.Base })));
const HomeScreen = lazy(() => import('./screens/HomeScreen').then(m => ({ default: m.HomeScreen })));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen').then(m => ({ default: m.ProfileScreen })));
const SearchScreen = lazy(() => import('./screens/SearchScreen').then(m => ({ default: m.SearchScreen })));
const ProviderScreen = lazy(() => import('./screens/ProviderScreen').then(m => ({ default: m.ProviderScreen })));
const RegistrationProviderScreen = lazy(() => import('./screens/RegistrationProviderScreen').then(m => ({ default: m.RegistrationProviderScreen })));
const AddCategorycreen = lazy(() => import('./screens/AddCategory').then(m => ({ default: m.AddCategorycreen })));
const AddServiceScreen = lazy(() => import('./screens/AddServiceScreen').then(m => ({ default: m.AddServiceScreen })));
const SubscriptionScreen = lazy(() => import('./screens/SubscriptionScreen').then(m => ({ default: m.SubscriptionScreen })));
const ResetPasswordScreen = lazy(() => import('./screens/ResetPasswordScreen').then(m => ({ default: m.ResetPasswordScreen })));
const PaymentCallbackHandlerScreen = lazy(() => import('./screens/PaymentCallbackHandlerScreen').then(m => ({ default: m.PaymentCallbackHandlerScreen })));

function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err =>
        console.log('Service Worker registration failed:', err)
      );
    }
  }, []);

  return (
    <>
      <InstallBanner />
      
      {/* Le Suspense est crucial ici. Il englobe toutes les routes. */}
      {/* Tu peux remplacer le fallback par un vrai composant de Loader/Spinner */}
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center">
         <Loading/>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path='/forgot-password' element={<ForgotPasswordScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/otp" element={<OtpScreen />} />
          <Route path="/become-service-provider" element={<RegistrationProviderScreen />} />
          <Route path="/add-category" element={<AddCategorycreen />} />
          <Route path="/add-service" element={<AddServiceScreen />} />
          <Route path="/reset-password/:token" element={<ResetPasswordScreen />} />
          <Route path="/callback" element={<PaymentCallbackHandlerScreen />} />
          <Route path="/p/:slug" element={<ProviderScreen />} />

          {/* Routes avec Layout de Base */}
          <Route element={<Base />}>
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/search" element={<SearchScreen />} />
            <Route path="/provider" element={<ProviderScreen />} />
            <Route path="/consult-provider" element={<ProviderScreen />} />
            <Route path="/consult-provider/:slug" element={<ProviderScreen />} />
            <Route path="/subscription" element={<SubscriptionScreen />} />
          </Route>
        </Routes>
      </Suspense>

      {/* Il est souvent plus propre de mettre le ToastContainer au niveau de App */}
      <ToastContainer position="bottom-center" />
    </>
  )
}

export default App;