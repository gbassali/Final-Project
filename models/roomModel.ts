import prisma from "./prismaClient";
import { Room, Prisma } from "../generated/prisma/client";

export type CreateRoomInput = Prisma.RoomCreateInput;
export type UpdateRoomInput = Prisma.RoomUpdateInput;

export async function createRoom(input: CreateRoomInput): Promise<Room> {
  return prisma.room.create({ data: input });
}

export async function getRoomById(id: number): Promise<Room | null> {
  return prisma.room.findUnique({ where: { id } });
}

export async function listRooms(): Promise<Room[]> {
  return prisma.room.findMany({ orderBy: { name: "asc" } });
}

export async function updateRoom(
  id: number,
  data: UpdateRoomInput
): Promise<Room> {
  return prisma.room.update({
    where: { id },
    data,
  });
}

export async function deleteRoom(id: number): Promise<Room> {
  return prisma.room.delete({ where: { id } });
}
