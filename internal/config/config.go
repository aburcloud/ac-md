package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Config struct {
	Theme        string `json:"theme"`        // "light", "dark", "auto"
	AccentColor  string `json:"accent_color"` // e.g. "#2563eb"
	FontSize     int    `json:"font_size"`    // default 16
	FontFamily   string `json:"font_family"`  // default system UI
	ReadingWidth int    `json:"reading_width"`// default 900 (px)
	LineNumbers  bool   `json:"line_numbers"` // default false
	AutoReload   bool   `json:"auto_reload"`  // default true
	ZoomLevel    float64 `json:"zoom_level"`   // default 1.0
}

func DefaultConfig() *Config {
	return &Config{
		Theme:        "auto",
		AccentColor:  "#2563eb",
		FontSize:     16,
		FontFamily:   "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		ReadingWidth: 900,
		LineNumbers:  false,
		AutoReload:   true,
		ZoomLevel:    1.0,
	}
}

func GetConfigPath() (string, error) {
	appDataDir, err := os.UserConfigDir()
	if err != nil {
		appDataDir = os.Getenv("APPDATA")
		if appDataDir == "" {
			appDataDir = "."
		}
	}
	dir := filepath.Join(appDataDir, "MDView")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}
	return filepath.Join(dir, "config.json"), nil
}

func LoadConfig() (*Config, error) {
	cfg := DefaultConfig()
	path, err := GetConfigPath()
	if err != nil {
		return cfg, err
	}

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			_ = SaveConfig(cfg)
		}
		return cfg, nil
	}

	if err := json.Unmarshal(data, cfg); err != nil {
		return cfg, nil
	}

	return cfg, nil
}

func SaveConfig(cfg *Config) error {
	path, err := GetConfigPath()
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}
