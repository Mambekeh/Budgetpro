import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function PersonalLayout() {
  return (
    <>
      <Navbar />
      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
}
