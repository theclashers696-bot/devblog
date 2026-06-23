package handlers

import (
	"database/sql"
	"net/http"

	"blog-platform/database"
	"blog-platform/models"

	"github.com/gin-gonic/gin"
)

func GetComments(c *gin.Context) {
	slug := c.Param("slug")

	var postID int
	err := database.DB.QueryRow(
		`SELECT id FROM posts WHERE slug = $1 AND status = 'published'`, slug,
	).Scan(&postID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	rows, err := database.DB.Query(`
		SELECT c.id, c.content, c.post_id, c.user_id, c.created_at, c.updated_at,
		       u.id, u.name, u.email, u.role, u.bio, u.avatar
		FROM comments c JOIN users u ON c.user_id = u.id
		WHERE c.post_id = $1 ORDER BY c.created_at ASC`, postID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}
	defer rows.Close()

	comments := []models.Comment{}
	for rows.Next() {
		var cm models.Comment
		var cu models.User
		rows.Scan(&cm.ID, &cm.Content, &cm.PostID, &cm.UserID, &cm.CreatedAt, &cm.UpdatedAt,
			&cu.ID, &cu.Name, &cu.Email, &cu.Role, &cu.Bio, &cu.Avatar)
		cm.User = &cu
		comments = append(comments, cm)
	}
	c.JSON(http.StatusOK, comments)
}

func CreateComment(c *gin.Context) {
	userID, _ := c.Get("user_id")
	slug := c.Param("slug")

	var postID int
	err := database.DB.QueryRow(
		`SELECT id FROM posts WHERE slug = $1 AND status = 'published'`, slug,
	).Scan(&postID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	var req models.CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var cm models.Comment
	var cu models.User
	err = database.DB.QueryRow(`
		WITH ins AS (
			INSERT INTO comments (content, post_id, user_id) VALUES ($1, $2, $3)
			RETURNING id, content, post_id, user_id, created_at, updated_at
		)
		SELECT i.id, i.content, i.post_id, i.user_id, i.created_at, i.updated_at,
		       u.id, u.name, u.email, u.role, u.bio, u.avatar
		FROM ins i JOIN users u ON i.user_id = u.id`,
		req.Content, postID, userID,
	).Scan(&cm.ID, &cm.Content, &cm.PostID, &cm.UserID, &cm.CreatedAt, &cm.UpdatedAt,
		&cu.ID, &cu.Name, &cu.Email, &cu.Role, &cu.Bio, &cu.Avatar)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
		return
	}
	cm.User = &cu
	c.JSON(http.StatusCreated, cm)
}

func DeleteComment(c *gin.Context) {
	userID, _ := c.Get("user_id")
	commentID := c.Param("id")

	var cmUserID int
	err := database.DB.QueryRow(`SELECT user_id FROM comments WHERE id = $1`, commentID).Scan(&cmUserID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}
	if cmUserID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to delete this comment"})
		return
	}

	database.DB.Exec(`DELETE FROM comments WHERE id = $1`, commentID)
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}
