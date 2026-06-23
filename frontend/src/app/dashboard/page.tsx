'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Post } from '@/lib/types'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  PenSquare, Eye, Edit, Trash2, BarChart2,
  FileText, CheckCircle2, Clock, PlusCircle
} from 'lucide-react'

export default function DashboardPage() {
  const { user, isAuthor, isLoading } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || !isAuthor)) {
      router.push('/login')
    }
  }, [user, isAuthor, isLoading])

  useEffect(() => {
    if (user && isAuthor) {
      fetchMyPosts()
    }
  }, [user])

  const fetchMyPosts = async () => {
    try {
      const res = await api.get('/api/posts/my/posts')
      setPosts(res.data || [])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (slug: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) return
    try {
      await api.delete(`/api/posts/${slug}`)
      setPosts((prev) => prev.filter((p) => p.slug !== slug))
    } catch {
      alert('Failed to delete post')
    }
  }

  if (isLoading) return null

  const published = posts.filter((p) => p.status === 'published')
  const drafts = posts.filter((p) => p.status === 'draft')
  const totalViews = published.reduce((sum, p) => sum + p.view_count, 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, {user?.name}</p>
        </div>
        <Link
          href="/posts/new"
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Post
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Published', value: published.length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Drafts', value: drafts.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Total Views', value: totalViews, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
            <div className={`${stat.bg} p-3 rounded-xl`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">All Posts</h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="flex-1 h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <PenSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No posts yet</p>
            <p className="text-gray-400 text-sm mb-4">Write your first article</p>
            <Link href="/posts/new" className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <PlusCircle className="w-4 h-4" /> Create Post
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <div key={post.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      post.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {post.status}
                    </span>
                    {post.tags && (
                      <span className="text-xs text-gray-400 truncate">
                        {post.tags.split(',')[0].trim()}
                      </span>
                    )}
                  </div>
                  <Link href={`/posts/${post.slug}`} className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate block">
                    {post.title}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(post.created_at), 'MMM d, yyyy')}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                  <Eye className="w-3.5 h-3.5" />
                  {post.view_count}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    href={`/posts/${post.slug}/edit`}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(post.slug)}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
