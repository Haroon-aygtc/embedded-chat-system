import React from "react";
import { BrowserRouter } from "react-router-dom";
import Login from "../../../../src/pages/auth/login";

export default function LoginPageDemo() {
  return (
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
}
