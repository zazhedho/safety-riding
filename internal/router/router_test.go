package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func BenchmarkHealthCheck(b *testing.B) {
	// Switch to release mode to avoid debug logs during benchmark
	gin.SetMode(gin.ReleaseMode)

	// Initialize routes (this includes middlewares)
	r := NewRoutes()

	// Create a request
	req, _ := http.NewRequest("GET", "/healthcheck", nil)

	// Reset timer to ignore setup time
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		w := httptest.NewRecorder()
		r.App.ServeHTTP(w, req)
	}
}
