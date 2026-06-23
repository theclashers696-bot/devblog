'use client'

import { useState, useEffect } from 'react'
import { Comment } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { Trash2, MessageCircle, Send } from 'lucide-react'
import Link from 'next/link'

interface Props {
  slug: string
}

export default function CommentSection({ slug }: Props) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [slug])

  const fetchComments = async () => {
    try {
      const res = await api.get(`/api/posts/${slug}/comments`)
      setComments(res.data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const res = await api.post(`/api/posts/${slug}/comments`, { content })
      setComments((prev) => [...prev, res.data])
      setContent('')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this comment?')) return
    try {
      await api.delete(`/api/posts/comments/${id}`)
      setComments((prev) => prev.filter((c) => c.id !== id))
    } catch {
      alert('Failed to delete comment')
    }
  }

  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        Comments ({comments.length})
      </h2>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 rounded-xl text-center border border-gray-200">
          <p className="text-gray-600 text-sm">
            <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link> to leave a comment.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {comment.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900">{comment.user?.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                      {user?.id === comment.user_id && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
