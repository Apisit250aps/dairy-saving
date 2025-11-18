import { connect } from '@/lib/client'
import { Collection } from 'mongodb'
import { BaseUser } from '../models/user.model'

let _users: Collection<BaseUser> | null = null

export async function usersCollection(): Promise<Collection<BaseUser>> {
  if (!_users) {
    const db = await connect()
    _users = db.collection<BaseUser>('users')
    await _users.createIndexes([
      { key: { name: 1 }, unique: true, name: 'uniq_name' },
      { key: { id: 1 }, unique: true, name: 'uniq_id' },
    ])
  }
  return _users
}
