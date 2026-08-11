package settings

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
)

type Settings struct {
	Theme              string `json:"theme"`                // "light", "dark", "system"
	Accent             string `json:"accent"`               // "orange", "amber", "red", "blue", "indigo", "violet", "green", "cyan"
	OpenLinksExternal  bool   `json:"open_links_external"`  // default true
	RenderRawHTML      bool   `json:"render_raw_html"`      // default false
	ShowOutline        bool   `json:"show_outline"`         // default true
	RestoreSession     bool   `json:"restore_session"`      // default true
	FontSize           int    `json:"font_size"`            // default 16
	ReadingWidth       int    `json:"reading_width"`        // default 900
}

func DefaultSettings() *Settings {
	return &Settings{
		Theme:             "dark",
		Accent:            "orange",
		OpenLinksExternal: true,
		RenderRawHTML:     false,
		ShowOutline:       true,
		RestoreSession:    true,
		FontSize:          16,
		ReadingWidth:      900,
	}
}

func GetSettingsPath() (string, error) {
	var baseDir string
	if runtime.GOOS == "windows" {
		baseDir = os.Getenv("APPDATA")
		if baseDir == "" {
			baseDir = "."
		}
	} else {
		userConfig, err := os.UserConfigDir()
		if err == nil {
			baseDir = userConfig
		} else {
			baseDir = os.Getenv("HOME")
		}
	}

	dir := filepath.Join(baseDir, "AburMD")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}
	return filepath.Join(dir, "settings.json"), nil
}

func LoadSettings() (*Settings, error) {
	st := DefaultSettings()
	path, err := GetSettingsPath()
	if err != nil {
		return st, err
	}

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			_ = SaveSettings(st)
		}
		return st, nil
	}

	if err := json.Unmarshal(data, st); err != nil {
		return st, nil
	}

	return st, nil
}

func SaveSettings(st *Settings) error {
	path, err := GetSettingsPath()
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(st, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}
