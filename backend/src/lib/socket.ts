import { Server } from "socket.io"
import { verify } from "jsonwebtoken"
import { db } from "../db"
import { orders, users } from "../db/schema"
import { eq } from "drizzle-orm"

let io: Server | null = null

export function setIo(server: any) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)

    socket.on("join-kitchen", async () => {
      try {
        const token = socket.handshake.auth?.token
        const decoded = verify(token, process.env.JWT_SECRET!) as { userId: number }
        const user = await db.query.users.findFirst({ where: eq(users.id, decoded.userId) })
        if (user?.role !== "merchant") return socket.emit("access-denied")
        socket.join("kitchen")
        console.log("Merchant joined kitchen room:", socket.id)
      } catch {
        socket.emit("access-denied")
      }
    })

    socket.on("join-tracking", async (trackingToken: string) => {
      if (typeof trackingToken !== "string" || trackingToken.length > 32) return socket.emit("access-denied")
      const order = await db.query.orders.findFirst({ where: eq(orders.trackingToken, trackingToken) })
      if (!order) return socket.emit("access-denied")
      socket.join(`track:${trackingToken}`)
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
