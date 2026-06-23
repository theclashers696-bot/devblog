package handlers

import (
        "database/sql"
        "fmt"
        "net/http"
        "regexp"
        "strings"
        "time"

        "blog-platform/database"
        "blog-platform/models"

        "github.com/gin-gonic/gin"
)

func scanPost(row *sql.Row) (*models.Post, error) {
        var p models.Post
        var author models.User
        var publishedAt sql.NullTime
        err := row.Scan(
                &p.ID, &p.Title, &p.Slug, &p.Content, &p.Excerpt,
                &p.CoverImage, &p.Status, &p.Tags, &p.AuthorID,
                &p.ViewCount, &publishedAt, &p.CreatedAt, &p.UpdatedAt,
                &author.ID, &author.Name, &author.Email, &author.Role, &author.Bio, &author.Avatar,
        )
        if err != nil {
                return nil, err
        }
        if publishedAt.Valid {
                p.PublishedAt = &publishedAt.Time
        }
        p.Author = &author
        return &p, nil
}

const postSelectQuery = `
SELECT p.id, p.title, p.slug, p.content, p.excerpt, p.cover_image, p.status, p.tags,
       p.author_id, p.view_count, p.published_at, p.created_at, p.updated_at,
       u.id, u.name, u.email, u.role, u.bio, u.avatar
FROM posts p JOIN users u ON p.author_id = u.id`

func GetPosts(c *gin.Context) {
        query := postSelectQuery + ` WHERE p.status = 'published'`
        args := []interface{}{}
        argN := 1

        if tag := c.Query("tag"); tag != "" {
                query += ` AND p.tags ILIKE $` + itoa(argN)
                args = append(args, "%"+tag+"%")
                argN++
        }
        if search := c.Query("search"); search != "" {
                query += ` AND (p.title ILIKE $` + itoa(argN) + ` OR p.excerpt ILIKE $` + itoa(argN+1) + `)`
                args = append(args, "%"+search+"%", "%"+search+"%")
                argN += 2
        }
        query += ` ORDER BY p.published_at DESC`

        rows, err := database.DB.Query(query, args...)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
                return
        }
        defer rows.Close()

        posts := []models.Post{}
        for rows.Next() {
                var p models.Post
                var author models.User
                var publishedAt sql.NullTime
                if err := rows.Scan(
                        &p.ID, &p.Title, &p.Slug, &p.Content, &p.Excerpt, &p.CoverImage,
                        &p.Status, &p.Tags, &p.AuthorID, &p.ViewCount, &publishedAt,
                        &p.CreatedAt, &p.UpdatedAt,
                        &author.ID, &author.Name, &author.Email, &author.Role, &author.Bio, &author.Avatar,
                ); err != nil {
                        continue
                }
                if publishedAt.Valid {
                        p.PublishedAt = &publishedAt.Time
                }
                p.Author = &author
                posts = append(posts, p)
        }
        c.JSON(http.StatusOK, posts)
}

func GetPost(c *gin.Context) {
        slug := c.Param("slug")
        row := database.DB.QueryRow(postSelectQuery+` WHERE p.slug = $1 AND p.status = 'published'`, slug)
        post, err := scanPost(row)
        if err == sql.ErrNoRows {
                c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
                return
        } else if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
                return
        }

        database.DB.Exec("UPDATE posts SET view_count = view_count + 1 WHERE id = $1", post.ID)

        rows, _ := database.DB.Query(`
                SELECT c.id, c.content, c.post_id, c.user_id, c.created_at, c.updated_at,
                       u.id, u.name, u.email, u.role, u.bio, u.avatar
                FROM comments c JOIN users u ON c.user_id = u.id
                WHERE c.post_id = $1 ORDER BY c.created_at ASC`, post.ID)
        defer rows.Close()

        for rows.Next() {
                var cm models.Comment
                var cu models.User
                rows.Scan(&cm.ID, &cm.Content, &cm.PostID, &cm.UserID, &cm.CreatedAt, &cm.UpdatedAt,
                        &cu.ID, &cu.Name, &cu.Email, &cu.Role, &cu.Bio, &cu.Avatar)
                cm.User = &cu
                post.Comments = append(post.Comments, cm)
        }

        c.JSON(http.StatusOK, post)
}

func GetMyPosts(c *gin.Context) {
        userID, _ := c.Get("user_id")
        rows, err := database.DB.Query(
                postSelectQuery+` WHERE p.author_id = $1 ORDER BY p.created_at DESC`, userID)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
                return
        }
        defer rows.Close()

        posts := []models.Post{}
        for rows.Next() {
                var p models.Post
                var author models.User
                var publishedAt sql.NullTime
                if err := rows.Scan(
                        &p.ID, &p.Title, &p.Slug, &p.Content, &p.Excerpt, &p.CoverImage,
                        &p.Status, &p.Tags, &p.AuthorID, &p.ViewCount, &publishedAt,
                        &p.CreatedAt, &p.UpdatedAt,
                        &author.ID, &author.Name, &author.Email, &author.Role, &author.Bio, &author.Avatar,
                ); err != nil {
                        continue
                }
                if publishedAt.Valid {
                        p.PublishedAt = &publishedAt.Time
                }
                p.Author = &author
                posts = append(posts, p)
        }
        c.JSON(http.StatusOK, posts)
}

func CreatePost(c *gin.Context) {
        userID, _ := c.Get("user_id")

        var req models.CreatePostRequest
        if err := c.ShouldBindJSON(&req); err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
                return
        }

        slug := generateSlug(req.Title)
        var existingID int
        if err := database.DB.QueryRow("SELECT id FROM posts WHERE slug = $1", slug).Scan(&existingID); err == nil {
                slug = slug + "-" + time.Now().Format("20060102150405")
        }

        status := req.Status
        if status != models.StatusDraft && status != models.StatusPublished {
                status = models.StatusDraft
        }

        var publishedAt interface{}
        if status == models.StatusPublished {
                publishedAt = time.Now()
        }

        var post models.Post
        var author models.User
        var pAt sql.NullTime

        err := database.DB.QueryRow(`
                WITH inserted AS (
                        INSERT INTO posts (title, slug, content, excerpt, cover_image, status, tags, author_id, published_at)
                        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                        RETURNING id, title, slug, content, excerpt, cover_image, status, tags, author_id, view_count, published_at, created_at, updated_at
                )
                SELECT i.id,i.title,i.slug,i.content,i.excerpt,i.cover_image,i.status,i.tags,i.author_id,
                       i.view_count,i.published_at,i.created_at,i.updated_at,
                       u.id,u.name,u.email,u.role,u.bio,u.avatar
                FROM inserted i JOIN users u ON i.author_id = u.id`,
                req.Title, slug, req.Content, req.Excerpt, req.CoverImage, string(status), req.Tags, userID, publishedAt,
        ).Scan(
                &post.ID, &post.Title, &post.Slug, &post.Content, &post.Excerpt, &post.CoverImage,
                &post.Status, &post.Tags, &post.AuthorID, &post.ViewCount, &pAt,
                &post.CreatedAt, &post.UpdatedAt,
                &author.ID, &author.Name, &author.Email, &author.Role, &author.Bio, &author.Avatar,
        )

        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
                return
        }
        if pAt.Valid {
                post.PublishedAt = &pAt.Time
        }
        post.Author = &author
        c.JSON(http.StatusCreated, post)
}

func UpdatePost(c *gin.Context) {
        userID, _ := c.Get("user_id")
        slug := c.Param("slug")

        var post models.Post
        err := database.DB.QueryRow(
                `SELECT id, author_id, status, published_at FROM posts WHERE slug = $1`, slug,
        ).Scan(&post.ID, &post.AuthorID, &post.Status, &post.PublishedAt)

        if err == sql.ErrNoRows {
                c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
                return
        }
        if post.AuthorID != userID.(int) {
                c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to edit this post"})
                return
        }

        var req models.UpdatePostRequest
        if err := c.ShouldBindJSON(&req); err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
                return
        }

        setClauses := []string{}
        args := []interface{}{}
        n := 1

        if req.Title != "" {
                setClauses = append(setClauses, "title = $"+itoa(n))
                args = append(args, req.Title)
                n++
        }
        if req.Content != "" {
                setClauses = append(setClauses, "content = $"+itoa(n))
                args = append(args, req.Content)
                n++
        }
        if req.Excerpt != "" {
                setClauses = append(setClauses, "excerpt = $"+itoa(n))
                args = append(args, req.Excerpt)
                n++
        }
        if req.CoverImage != "" {
                setClauses = append(setClauses, "cover_image = $"+itoa(n))
                args = append(args, req.CoverImage)
                n++
        }
        if req.Tags != "" {
                setClauses = append(setClauses, "tags = $"+itoa(n))
                args = append(args, req.Tags)
                n++
        }
        if req.Status != "" {
                setClauses = append(setClauses, "status = $"+itoa(n))
                args = append(args, string(req.Status))
                n++
                if req.Status == models.StatusPublished && post.PublishedAt == nil {
                        setClauses = append(setClauses, "published_at = $"+itoa(n))
                        args = append(args, time.Now())
                        n++
                }
        }
        setClauses = append(setClauses, "updated_at = NOW()")
        args = append(args, post.ID)

        updateSQL := "UPDATE posts SET " + strings.Join(setClauses, ", ") + " WHERE id = $" + itoa(n)
        if _, err := database.DB.Exec(updateSQL, args...); err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
                return
        }

        row := database.DB.QueryRow(postSelectQuery+` WHERE p.id = $1`, post.ID)
        updated, err := scanPost(row)
        if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated post"})
                return
        }
        c.JSON(http.StatusOK, updated)
}

func DeletePost(c *gin.Context) {
        userID, _ := c.Get("user_id")
        slug := c.Param("slug")

        var postID, authorID int
        err := database.DB.QueryRow(`SELECT id, author_id FROM posts WHERE slug = $1`, slug).Scan(&postID, &authorID)
        if err == sql.ErrNoRows {
                c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
                return
        }
        if authorID != userID.(int) {
                c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to delete this post"})
                return
        }

        database.DB.Exec(`DELETE FROM posts WHERE id = $1`, postID)
        c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}

func generateSlug(title string) string {
        slug := strings.ToLower(title)
        re := regexp.MustCompile(`[^a-z0-9\s-]`)
        slug = re.ReplaceAllString(slug, "")
        re2 := regexp.MustCompile(`\s+`)
        slug = re2.ReplaceAllString(slug, "-")
        return strings.Trim(slug, "-")
}

func itoa(n int) string {
        return fmt.Sprintf("%d", n)
}
