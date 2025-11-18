import NextAuth from 'next-auth'
import Credential from 'next-auth/providers/credentials'
import { UserLoginValues } from './infrastructure/models/user.model'
import { userLogin } from './infrastructure/use-case/user.usecase'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credential({
      name: 'Credentials',
      credentials: {
        name: { label: 'Name', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { name, password } = credentials as UserLoginValues

        const user = await userLogin({ name, password })

        if (user) {
          return {
            id: user.id,
            name: user.name,
            email: user.email || null,
            is_active: user.is_active,
            is_superuser: user.is_superuser,
          }
        }
        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email || null
        token.is_superuser = user.is_superuser
        token.is_active = user.is_active
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string | null
        session.user.is_superuser = token.is_superuser as boolean
        session.user.is_active = token.is_active as boolean
      }
      return session
    },
  },
})
