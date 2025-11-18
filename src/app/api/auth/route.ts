import { UserRegister } from '@/presentation/controllers/user.controller'
import { NextRequest, NextResponse } from 'next/server'

export const POST = (req: NextRequest): Promise<NextResponse> =>
  UserRegister(req)
