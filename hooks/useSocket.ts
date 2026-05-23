"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/lib/store";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function useSocket() {
  const { authToken } = useAuthStore();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!authToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Initialize Low-Latency Socket.IO Client
    const socket = io(SOCKET_URL, {
      auth: { token: authToken },
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err.message);
      setConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [authToken]);

  return {
    socket: socketRef.current,
    connected,
  };
}
