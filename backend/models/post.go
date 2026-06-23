package models

import "time"

type PostStatus string

const (
	StatusDraft     PostStatus = "draft"
	StatusPublished PostStatus = "published"
)

type Post struct {
	ID          int        `json:"id"`
	Title       string     `json:"title"`
	Slug        string     `json:"slug"`
	Content     string     `json:"content"`
	Excerpt     string     `json:"excerpt"`
	CoverImage  string     `json:"cover_image"`
	Status      PostStatus `json:"status"`
	Tags        string     `json:"tags"`
	AuthorID    int        `json:"author_id"`
	Author      *User      `json:"author,omitempty"`
	Comments    []Comment  `json:"comments,omitempty"`
	ViewCount   int        `json:"view_count"`
	PublishedAt *time.Time `json:"published_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type CreatePostRequest struct {
	Title      string     `json:"title" binding:"required,min=3"`
	Content    string     `json:"content" binding:"required"`
	Excerpt    string     `json:"excerpt"`
	CoverImage string     `json:"cover_image"`
	Status     PostStatus `json:"status"`
	Tags       string     `json:"tags"`
}

type UpdatePostRequest struct {
	Title      string     `json:"title"`
	Content    string     `json:"content"`
	Excerpt    string     `json:"excerpt"`
	CoverImage string     `json:"cover_image"`
	Status     PostStatus `json:"status"`
	Tags       string     `json:"tags"`
}
