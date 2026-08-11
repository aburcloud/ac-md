package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"mdview/internal/app"
)

const Version = "1.0.0"
const Publisher = "AburMD Software"

func main() {
	var showVersion bool
	var showHelp bool

	flag.BoolVar(&showVersion, "version", false, "Print version information")
	flag.BoolVar(&showVersion, "v", false, "Print version information (short)")
	flag.BoolVar(&showHelp, "help", false, "Print help and usage information")
	flag.BoolVar(&showHelp, "h", false, "Print help and usage information (short)")

	flag.Usage = func() {
		fmt.Printf("AburMD v%s - Minimalist Markdown Document Reader & Editor\n", Version)
		fmt.Printf("Copyright (c) 2026 %s. All rights reserved.\n\n", Publisher)
		fmt.Println("Usage:")
		fmt.Println("  aburmd [options] [file.md...]")
		fmt.Println("\nOptions:")
		flag.PrintDefaults()
		fmt.Println("\nExamples:")
		fmt.Println("  aburmd")
		fmt.Println("  aburmd README.md")
		fmt.Println("  aburmd \"C:\\Docs\\architecture.md\" \"C:\\Docs\\deployment.md\"")
	}

	flag.Parse()

	if showHelp {
		flag.Usage()
		os.Exit(0)
	}

	if showVersion {
		fmt.Printf("AburMD v%s (%s)\n", Version, Publisher)
		os.Exit(0)
	}

	initialPath := ""
	if flag.NArg() > 0 {
		initialPath = flag.Arg(0)
		if !filepath.IsAbs(initialPath) {
			if abs, err := filepath.Abs(initialPath); err == nil {
				initialPath = abs
			}
		}
	}

	application, err := app.NewApp(initialPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error initializing AburMD: %v\n", err)
		os.Exit(1)
	}

	application.Run()
}
