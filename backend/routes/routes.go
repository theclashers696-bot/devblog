package routes

import (
	"blog-platform/handlers"
	"blog-platform/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")

	auth := api.Group("/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
		auth.GET("/me", middleware.AuthRequired(), handlers.GetMe)
	}

	posts := api.Group("/posts")
	{
		posts.GET("", handlers.GetPosts)
		posts.GET("/:slug", handlers.GetPost)
		posts.GET("/:slug/comments", handlers.GetComments)

		protected := posts.Group("")
		protected.Use(middleware.AuthRequired())
		{
			protected.POST("/:slug/comments", handlers.CreateComment)
			protected.DELETE("/comments/:id", handlers.DeleteComment)
		}

		authorOnly := posts.Group("")
		authorOnly.Use(middleware.AuthRequired(), middleware.AuthorRequired())
		{
			authorOnly.POST("", handlers.CreatePost)
			authorOnly.PUT("/:slug", handlers.UpdatePost)
			authorOnly.DELETE("/:slug", handlers.DeletePost)
			authorOnly.GET("/my/posts", handlers.GetMyPosts)
		}
	}
}
