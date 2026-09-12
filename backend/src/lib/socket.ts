import { Server } from "socket.io"

let io: Server | null = null

export function setIo(server: any) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)

    socket.on("join-kitchen", () => {
      socket.join("kitchen")
      console.log("Client joined kitchen room:", socket.id)
    })

    socket.on("order-status-update", (data) => {
      io?.to("kitchen").emit("order-updated", data)
    })

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id)
    })
  })

  return io
}

export function getIo(): Server {
  if (!io) {
    throw new Error("Socket.IO not initialized")
  }
  return io
}
