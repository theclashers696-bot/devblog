'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import dynamic from 'next/dynamic'
import { Save, Send, ArrowLeft, Image } from 'lucide-react'
import Link from 'next/link'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false })

export default function NewPostPage() {
  const { user, isAuthor, isLoading } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    cover_image: '',
    tags: '',
    status: 'draft' as 'draft' | 'published',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoading && (!user || !isAuthor)) {
      router.push('/login')
    }
  }, [user, isAuthor, isLoading])

  const handleSubmit = async (status: 'draft' | 'published') => {
    setError('')
    setSaving(true)
    try {
      const res = await api.post('/api/posts', { ...form, status })
      router.push(status === 'published' ? `/posts/${res.data.slug}` : '/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={saving || !form.title || !form.content}
            className="flex items-center gap-1.5 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit('published')}
            disabled={saving || !form.title || !form.content}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
            {saving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Article title..."
          className="w-full text-3xl font-bold border-0 border-b border-gray-200 pb-3 focus:outline-none focus:border-blue-500 bg-transparent placeholder-gray-300"
        />

        <input
          type="text"
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          placeholder="Short description (shown in article cards)..."
          className="w-full text-gray-600 border-0 border-b border-gray-100 pb-3 focus:outline-none focus:border-blue-400 bg-transparent text-sm placeholder-gray-300"
        />

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="url"
              value={form.cover_image}
              onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
              placeholder="Cover image URL (optional)..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="Tags (comma separated)..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {form.cover_image && (
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <img src={form.cover_image} alt="Cover preview" className="w-full object-cover max-h-48" />
          </div>
        )}

        <RichTextEditor
          content={form.content}
          onChange={(html) => setForm({ ...form, content: html })}
        />
      </div>
    </div>
  )
}
