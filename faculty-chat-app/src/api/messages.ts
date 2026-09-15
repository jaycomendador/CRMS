import { API_BASE } from "../config";

export interface Message {
  _id: string;
  facultyId: string;
  department: string;
  sender: "admin" | "faculty" | "ai";
  senderName: string;
  text: string;
  room?: string;
  createdAt: string;
  readByFaculty: boolean;
  readByAdmin: boolean;
  emailDispatched?: boolean;
}

// ── Department-scoped chat (faculty only see their own department) ──

export async function fetchMessages(department: string): Promise<Message[]> {
  const encoded = encodeURIComponent(department);
  const res = await fetch(`${API_BASE}/api/messages/department/${encoded}`);
  if (!res.ok) throw new Error("Could not load messages");
  return res.json();
}

export async function sendMessage(
  facultyId: string,
  department: string,
  text: string,
  senderName: string,
  senderEmail: string
): Promise<Message> {
  const encoded = encodeURIComponent(department);
  const res = await fetch(`${API_BASE}/api/messages/department/${encoded}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      facultyId,
      sender: "faculty",
      senderName,
      senderEmail,
      text,
    }),
  });
  if (!res.ok) {
    const d = await res.json();
    throw new Error(d.message || "Failed to send");
  }
  return res.json();
}

export async function markRead(department: string) {
  const encoded = encodeURIComponent(department);
  await fetch(`${API_BASE}/api/messages/department/${encoded}/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reader: "faculty" }),
  });
}
