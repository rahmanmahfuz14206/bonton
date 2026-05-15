import express from "express";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    maxHttpBufferSize: 1e8, // 100MB max file size
    cors: {
      origin: "*",
    },
  });

  const PORT = process.env.PORT || 3000;

  // Track the host of the common room
  let commonRoomHost: string | null = null;
  const COMMON_ROOM_ID = "common";

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", ({ isHost }: { isHost: boolean }) => {
      socket.join(COMMON_ROOM_ID);
      console.log(`User ${socket.id} joined as ${isHost ? 'Host' : 'Viewer'}`);

      if (isHost) {
        commonRoomHost = socket.id;
        io.to(COMMON_ROOM_ID).emit("host-status", { active: true });
      } else {
        socket.emit("host-status", { active: commonRoomHost !== null });
      }
    });

    socket.on("file-relay", ({ file }: { file: any }) => {
      if (commonRoomHost !== socket.id) {
        console.warn(`Unauthorized file relay attempt by ${socket.id}`);
        return;
      }

      console.log(`Relaying file: ${file.name}`);
      socket.to(COMMON_ROOM_ID).emit("file-received", file);
    });

    socket.on("disconnecting", () => {
      if (commonRoomHost === socket.id) {
        console.log(`Host ${socket.id} disconnected`);
        commonRoomHost = null;
        io.to(COMMON_ROOM_ID).emit("host-status", { active: false });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
