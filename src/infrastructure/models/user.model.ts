import z from 'zod'

export const BaseUserSchema = z.object({
  id: z.uuid(),
  email: z.email().nullable().default(null).optional(),
  name: z.string().min(2).max(100).optional(),
  password: z.string(),
  // Additional fields
  is_superuser: z.boolean().default(false),
  is_active: z.boolean().default(true),
  last_login: z.date().nullable().default(null),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
})

export const UserFormSchema = BaseUserSchema.omit({
  is_superuser: true,
  is_active: true,
  last_login: true,
  created_at: true,
  updated_at: true,
})
  .extend({
    name: z.string().min(2).max(100),
    email: z.email().optional(),
    password: z.string().min(6).max(100),
    confirm_password: z.string().min(6).max(100),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
  })

export const UserSchema = BaseUserSchema.omit({
  password: true,
})

export const UserLoginSchema = z.object({
  name: z.string().min(2).max(100),
  password: z.string().min(6).max(100),
})

export type User = z.infer<typeof UserSchema>
export type BaseUser = z.infer<typeof BaseUserSchema>
export type UserFormValues = z.infer<typeof UserFormSchema>
export type UserLoginValues = z.infer<typeof UserLoginSchema>