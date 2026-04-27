import { useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { LoginScreen } from "./screens/Login";
import { Base } from "./screens/Base";
import { Dashboard } from "./screens/Dashboard";
import { Provider } from "./screens/Provider";
import { SubscriptionsScreen } from "./screens/SubscriptionsScreen";
import { ReviewsScreen } from "./screens/ReviewScreen";
import { FeatureProviderScreen } from "./screens/FeatureProviderScreen";
import { SecurityScreen } from "./screens/SecurityScreen";
import { Users } from "./screens/Users";
import { BannerScreen } from "./screens/BannerScreen";
import { ForgotPasswordScreen } from "./screens/ForgotPasswordScreen";
import { ResetPasswordScreen } from "./screens/ResetPasswordScreen";
import { InstallBanner } from "./components/PWA/InstallBanner";
import { DocumentationScreen } from "./screens/DocumentationScreen";

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
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/reset-password/:token" element={<ResetPasswordScreen />} />

        <Route element={<Base />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/provider" element={<Provider />} />
          <Route path="/subscriptions" element={<SubscriptionsScreen />} />
          <Route path="/moderation" element={<ReviewsScreen />} />
          <Route path="/feature" element={<FeatureProviderScreen />} />
          <Route path="/security" element={<SecurityScreen />} />
          <Route path="/users" element={<Users />} />
          <Route path="/banners" element={<BannerScreen />} />
          <Route path="/documentation" element={<DocumentationScreen />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
