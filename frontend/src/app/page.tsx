'use client'

import { useEffect, useState } from 'react'
import { Post } from '@/lib/types'
import api from '@/lib/api'
import PostCard from '@/components/PostCard'
import { Search, TrendingUp, Tag } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const tagFilter = searchParams.get('tag')

  useEffect(() => {
    fetchPosts()
  }, [tagFilter])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (tagFilter) params.tag = tagFilter
      if (search) params.search = search
      const res = await api.get('/api/posts', { params })
      setPosts(res.data || [])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPosts()
  }

  const clearTag = () => router.push('/')

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Stories for{' '}
          <span className="text-blue-600">Developers</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Discover tutorials, insights, and ideas from our community of developers.
        </p>

        <form onSubmit={handleSearch} className="mt-6 max-w-lg mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {tagFilter && (
        <div className="flex items-center gap-2 mb-6">
          <Tag className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-gray-600">Filtered by tag:</span>
          <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-sm font-medium">{tagFilter}</span>
          <button onClick={clearTag} className="text-gray-400 hover:text-gray-600 text-sm underline">Clear</button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-500">Latest articles</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="aspect-[16/9] bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-5 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-4/5" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No articles yet</h3>
          <p className="text-gray-400">Be the first to share something great.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
