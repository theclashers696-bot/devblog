import Link from 'next/link'
import { Post } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { Eye, MessageCircle, Clock } from 'lucide-react'

interface Props {
  post: Post
}

export default function PostCard({ post }: Props) {
  const tags = post.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : []

  return (
    <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col">
      {post.cover_image && (
        <Link href={`/posts/${post.slug}`}>
          <div className="aspect-[16/9] overflow-hidden bg-gray-100">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}

      <div className="p-5 flex flex-col flex-1">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/?tag=${encodeURIComponent(tag)}`}
                className="text-xs bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full hover:bg-blue-100 transition-colors font-medium"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        <Link href={`/posts/${post.slug}`}>
          <h2 className="text-lg font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h2>
        </Link>

        {post.excerpt && (
          <p className="text-gray-500 text-sm line-clamp-3 mb-4 leading-relaxed flex-1">{post.excerpt}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
              {post.author?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700">{post.author?.name}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {post.view_count}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.published_at
                ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                : 'Draft'}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
