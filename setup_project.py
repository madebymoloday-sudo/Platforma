#!/usr/bin/env python3
import os
import json

base = "/Users/pavelgulo/Desktop/Platformа"

# Все файлы проекта
all_files = {}

# Backend основные файлы
all_files.update({
    "backend/tsconfig.json": json.dumps({
        "compilerOptions": {
            "target": "ES2020",
            "module": "commonjs",
            "lib": ["ES2020"],
            "outDir": "./dist",
            "rootDir": "./src",
            "strict": True,
            "esModuleInterop": True,
            "skipLibCheck": True,
            "forceConsistentCasingInFileNames": True,
            "resolveJsonModule": True,
            "moduleResolution": "node"
        },
        "include": ["src/**/*"],
        "exclude": ["node_modules", "dist"]
    }, indent=2),
})

print(f"Creating {len(all_files)} files...")
for path, content in all_files.items():
    full_path = os.path.join(base, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ {path}")

print("Done!")
