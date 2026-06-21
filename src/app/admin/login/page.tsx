import { Suspense } from "react";
import LoginForm from "./LoginForm";

// Strona jest server component — LoginForm (client) owinięty w Suspense
export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}