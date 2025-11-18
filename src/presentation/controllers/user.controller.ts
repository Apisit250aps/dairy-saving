import { User, UserFormSchema } from '@/infrastructure/models/user.model'
import {
  createUser,
  getUserExists,
} from '@/infrastructure/use-cases/user.usecase'
import { NextRequest, NextResponse } from 'next/server'

export async function UserRegister(
  req: NextRequest
): Promise<NextResponse<ApiResponse<User>>> {
  try {
    const data = await req.json()
    const parsed = await UserFormSchema.safeParseAsync(data)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid user data',
          error: JSON.stringify(parsed.error.format()),
        },
        { status: 400 }
      )
    }

    const exists = await getUserExists({
      filter: { $or: [{ id: parsed.data.id }, { name: parsed.data.name }] },
    })
    if (exists) {
      return NextResponse.json(
        {
          success: false,
          message: 'User with this ID or name already exists',
        },
        { status: 409 }
      )
    }

    // Proceed to create user
    const user = await createUser(parsed.data)
    if (user) {
      return NextResponse.json(
        {
          success: true,
          message: 'User registered successfully',
          data: user,
        },
        { status: 201 }
      )
    }

    throw new Error('User creation failed')
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'User registration failed',
        error: (error as Error).message,
      },
      { status: 500 }
    )
  }
}