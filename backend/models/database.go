package models

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var db *gorm.DB

// GetDB 获取数据库实例
func GetDB() *gorm.DB {
	return db
}

// InitDatabase 初始化数据库
func InitDatabase(driver, dsn string) error {
	// 确保数据目录存在（仅对SQLite）
	if driver == "sqlite" {
		if err := os.MkdirAll("./data", 0755); err != nil {
			return fmt.Errorf("failed to create data directory: %v", err)
		}
	}

	// 根据驱动类型连接数据库
	var err error
	switch driver {
	case "sqlite":
		db, err = gorm.Open(sqlite.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	case "mysql":
		db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	case "postgres":
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	default:
		return fmt.Errorf("unsupported database driver: %s", driver)
	}

	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	// 自动迁移表结构
	if err := db.AutoMigrate(&Session{}, &Record{}, &ReplaySession{}, &ReplayRecord{}, &PlaygroundSession{}, &PlaygroundRecord{}); err != nil {
		return fmt.Errorf("failed to migrate database: %v", err)
	}

	log.Printf("Database initialized successfully with driver: %s", driver)
	return nil
}
