package handlers

// PaginatedResponse 分页响应格式
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	Size       int         `json:"size"`
	TotalPages int         `json:"total_pages"`
}
