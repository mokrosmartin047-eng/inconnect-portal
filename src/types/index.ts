export type UserRole = 'accountant' | 'client'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  content: string
  file_url: string | null
  file_name: string | null
  is_read: boolean
  created_at: string
  sender?: Profile
}

export interface Document {
  id: string
  name: string
  file_path: string
  file_size: number
  file_type: string
  category: 'invoice' | 'contract' | 'receipt' | 'ticket' | 'other'
  uploaded_by: string
  created_at: string
  uploader?: Profile
}
