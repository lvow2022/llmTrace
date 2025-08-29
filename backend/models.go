package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var db *gorm.DB

// initDatabase 初始化数据库
func initDatabase() error {
	cfg := GetConfig()

	// 确保数据目录存在（仅对SQLite）
	if cfg.Database.Driver == "sqlite" {
		if err := os.MkdirAll("./data", 0755); err != nil {
			return fmt.Errorf("failed to create data directory: %v", err)
		}
	}

	// 根据驱动类型连接数据库
	var err error
	switch cfg.Database.Driver {
	case "sqlite":
		db, err = gorm.Open(sqlite.Open(cfg.Database.DSN), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	case "mysql":
		db, err = gorm.Open(mysql.Open(cfg.Database.DSN), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	case "postgres":
		db, err = gorm.Open(postgres.Open(cfg.Database.DSN), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	default:
		return fmt.Errorf("unsupported database driver: %s", cfg.Database.Driver)
	}

	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	// 自动迁移表结构
	if err := db.AutoMigrate(&Session{}, &Record{}); err != nil {
		return fmt.Errorf("failed to migrate database: %v", err)
	}

	log.Printf("Database initialized successfully with driver: %s", cfg.Database.Driver)
	return nil
}

// saveTraceData 保存埋点数据
func saveTraceData(trace *TraceRequest) error {
	// 开始事务
	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 检查或创建会话
	if err := ensureSession(tx, trace.SessionID); err != nil {
		tx.Rollback()
		return err
	}

	// 序列化数据
	requestJSON, err := json.Marshal(trace.Request)
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to marshal request: %v", err)
	}

	var responseJSON []byte
	if trace.Response != nil {
		responseJSON, err = json.Marshal(trace.Response)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to marshal response: %v", err)
		}
	}

	var metadataJSON []byte
	if trace.Metadata != nil {
		metadataJSON, err = json.Marshal(trace.Metadata)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to marshal metadata: %v", err)
		}
	}

	// 创建记录
	record := &Record{
		ID:         uuid.New().String(),
		SessionID:  trace.SessionID,
		TurnNumber: trace.TurnNumber,
		Request:    string(requestJSON),
		Response:   string(responseJSON),
		Status:     trace.Status,
		ErrorMsg:   trace.ErrorMessage,
		Metadata:   string(metadataJSON),
	}

	if err := tx.Create(record).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to create record: %v", err)
	}

	// 提交事务
	return tx.Commit().Error
}

// ensureSession 确保会话存在
func ensureSession(tx *gorm.DB, sessionID string) error {
	var count int64
	if err := tx.Model(&Session{}).Where("id = ?", sessionID).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check session: %v", err)
	}

	if count == 0 {
		// 会话不存在，创建新会话
		session := &Session{
			ID:   sessionID,
			Name: fmt.Sprintf("对话-%s", time.Now().Format("2006-01-02 15:04:05")),
		}
		if err := tx.Create(session).Error; err != nil {
			return fmt.Errorf("failed to create session: %v", err)
		}
	}
	return nil
}

// getSessions 获取会话列表
func getSessions(page, size int) (*PaginatedResponse, error) {
	var total int64
	if err := db.Model(&Session{}).Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count sessions: %v", err)
	}

	var sessions []Session
	offset := (page - 1) * size
	if err := db.Order("created_at DESC").Offset(offset).Limit(size).Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to query sessions: %v", err)
	}

	totalPages := int((total + int64(size) - 1) / int64(size))

	return &PaginatedResponse{
		Data:       sessions,
		Total:      int(total),
		Page:       page,
		Size:       size,
		TotalPages: totalPages,
	}, nil
}

// getSessionRecords 获取会话记录
func getSessionRecords(sessionID string, page, size int) (*PaginatedResponse, error) {
	var total int64
	if err := db.Model(&Record{}).Where("session_id = ?", sessionID).Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count records: %v", err)
	}

	var records []Record
	offset := (page - 1) * size
	if err := db.Where("session_id = ?", sessionID).
		Order("turn_number ASC, created_at ASC").
		Offset(offset).Limit(size).Find(&records).Error; err != nil {
		return nil, fmt.Errorf("failed to query records: %v", err)
	}

	totalPages := int((total + int64(size) - 1) / int64(size))

	return &PaginatedResponse{
		Data:       records,
		Total:      int(total),
		Page:       page,
		Size:       size,
		TotalPages: totalPages,
	}, nil
}

// getRecord 获取单条记录
func getRecord(recordID string) (*Record, error) {
	var record Record
	if err := db.Where("id = ?", recordID).First(&record).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get record: %v", err)
	}
	return &record, nil
}

// deleteRecord 删除记录
func deleteRecord(recordID string) error {
	result := db.Where("id = ?", recordID).Delete(&Record{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete record: %v", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("record not found")
	}
	return nil
}
