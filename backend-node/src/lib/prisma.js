import { PrismaClient } from '@prisma/client'

// Instancia unica compartida por todo el proceso (reemplaza al Pool de pg).
export const prisma = new PrismaClient()
