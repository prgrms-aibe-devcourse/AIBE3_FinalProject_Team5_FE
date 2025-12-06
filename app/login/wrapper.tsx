"use client";

import { Suspense } from "react";
import LoginView from "./view";

export default function LoginPageWrapper() {
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}
