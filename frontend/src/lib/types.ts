export type Role = 'author' | 'reader'
export type PostStatus = 'draft' | 'published'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  bio: string
  avatar: string
  created_at: string
}

export interface Post {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string
  cover_image: string
  status: PostStatus
  tags: string
  author_id: number
  author: User
  comments: Comment[]
  view_count: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Comment {
  id: number
  content: string
  post_id: number
  user_id: number
  user: User
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  token: string
  user: User
}
