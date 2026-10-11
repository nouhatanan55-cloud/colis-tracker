import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import ChatBox from "./Chatbot";

export default function AdminLayout() {
  return (
    <div className="wrap">
      <div className="dash">
        <Sidebar />

        <div className="main">
          <Outlet />
        </div>
      </div>

      <ChatBox />
    </div>
  );
}