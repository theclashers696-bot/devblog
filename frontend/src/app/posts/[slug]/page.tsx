'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Post } from '@/lib/types'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import CommentSection from '@/components/CommentSection'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { Eye, Clock, Tag, ArrowLeft, Edit, Trash2 } from 'lucide-react'

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, isAuthor } = useAuth()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchPost()
  }, [slug])

  const fetchPost = async () => {
    try {
      const res = await api.get(`/api/posts/${slug}`)
      setPost(res.data)
    } catch {
      router.push('/404')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return
    setDeleting(true)
    try {
      await api.delete(`/api/posts/${slug}`)
      router.push('/dashboard')
    } catch {
      alert('Failed to delete post')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="aspect-[16/9] bg-gray-200 rounded-2xl" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-4 bg-gray-200 rounded" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!post) return null

  const tags = post.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
  const isOwner = user?.id === post.author_id

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to articles
      </Link>

      <article>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/?tag=${encodeURIComponent(tag)}`}
                className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors font-medium"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </Link>
            ))}
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
          {post.title}
        </h1>

        <div className="flex items-center justify-between flex-wrap gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {post.author?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{post.author?.name}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.published_at
                    ? format(new Date(post.published_at), 'MMM d, yyyy')
                    : 'Draft'}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {post.view_count} views
                </span>
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <Link
                href={`/posts/${slug}/edit`}
                className="flex items-center gap-1.5 text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 text-sm border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        {post.cover_image && (
          <div className="mb-8 rounded-2xl overflow-hidden">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full object-cover max-h-96"
            />
          </div>
        )}

        <div
          className="article-content text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      <CommentSection slug={slug} />
    </div>
  )
}
