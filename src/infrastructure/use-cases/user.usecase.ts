import { hashPassword, verifyPassword } from '@/lib/encrypts'
import { usersCollection } from '../repositories/user.repository'
import {
  BaseUser,
  BaseUserSchema,
  User,
  UserFormValues,
  UserLoginSchema,
  UserLoginValues,
} from '../models/user.model'
import z from 'zod'
import { Filter } from 'mongodb'
import { omit } from 'lodash'


export async function createUser(
  data: BaseUser | UserFormValues
): Promise<User | null> {
  try {
    const users = await usersCollection()
    //
    const parsed = await BaseUserSchema.transform(async (data) => ({
      ...data,
      password: await hashPassword(data.password),
    })).safeParseAsync(data)
    // Validate parsed data
    if (!parsed.success) {
      throw new Error('Invalid user data')
    }
    // Check if user with same id or name exists
    const exists = await users.findOne({
      $or: [{ id: parsed.data.id }, { name: parsed.data.name }],
    })

    if (exists) {
      throw new Error('User with this ID or name already exists')
    }

    const result = await users.insertOne(parsed.data)
    if (result.acknowledged) {
      const user = await users.findOne(
        { id: parsed.data.id },
        { projection: { password: 0, _id: 0 } }
      )
      return user
    }
    return null
  } catch (error) {
    throw error
  }
}

export async function updateUser(
  id: string,
  data: Partial<BaseUser | UserFormValues>
): Promise<User | null> {
  {
    try {
      const users = await usersCollection()
      const parsed = await BaseUserSchema.partial()
        .omit({
          id: true,
        })
        .extend({
          password: z
            .string()
            .optional()
            .nullable()
            .transform(async (val) => {
              if (val === null || val === undefined || val === '')
                return undefined
              const hashed = await hashPassword(val)
              return hashed
            })
            .refine((val) => val !== null && val !== '', {
              message: 'Password must not be null or empty',
              path: [],
            }),
        })
        .transform(async (data) => ({
          ...data,
          updated_at: new Date(),
        }))
        .safeParseAsync(data)

      if (!parsed.success) {
        throw new Error('Invalid user data for update')
      }

      const exists = await users.findOne({
        $or: [{ id }, { name: parsed.data.name }],
      })

      if (exists && exists.id !== id) {
        throw new Error('Another user with this name already exists')
      }

      const update = await users.findOneAndUpdate(
        { id },
        { $set: parsed.data },
        { returnDocument: 'after', projection: { password: 0, _id: 0 } }
      )

      return update
    } catch (error) {
      throw error
    }
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const users = await usersCollection()
    const result = await users.deleteOne({ id })
    return result.acknowledged && result.deletedCount > 0
  } catch (error) {
    throw error
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const users = await usersCollection()
    const user = await users.findOne(
      { id },
      { projection: { password: 0, _id: 0 } }
    )
    return user
  } catch (error) {
    throw error
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const users = await usersCollection()
    const user = await users.findOne(
      { email },
      { projection: { password: 0, _id: 0 } }
    )
    return user
  } catch (error) {
    throw error
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const users = await usersCollection()
    const allUsers = await users
      .find({}, { projection: { password: 0, _id: 0 } })
      .toArray()
    return allUsers
  } catch (error) {
    throw error
  }
}

export async function getUserExists({
  filter,
}: Filter<BaseUser>): Promise<boolean> {
  try {
    const users = await usersCollection()
    const exists = await users.findOne<BaseUser>(filter)
    return exists !== null
  } catch (error) {
    throw error
  }
}

export async function userLogin(
  credentials: UserLoginValues
): Promise<User | null> {
  try {
    const parsed = await UserLoginSchema.safeParseAsync(credentials)
    if (!parsed.success) {
      throw new Error('Invalid login credentials')
    }

    const users = await usersCollection()
    const user = await users.findOne({
      $and: [{ name: parsed.data.name }, { is_active: true }],
      projection: { _id: 0 },
    })

    if (!user) {
      throw new Error('User not found or inactive')
    }

    const isPasswordValid = await verifyPassword(
      user.password,
      parsed.data.password
    )

    if (!isPasswordValid) {
      throw new Error('Invalid password')
    }

    await users.findOneAndUpdate(
      { id: user.id },
      { $set: { last_login: new Date() } }
    )

    return omit(user, ['password', '_id']) 
  } catch (error) {
    throw error
  }
}
