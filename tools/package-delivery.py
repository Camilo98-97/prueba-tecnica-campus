"""Package source and documentation without local runtimes or dependencies."""
from pathlib import Path
import os
import zipfile

root = Path(__file__).resolve().parent.parent
output = root / "output"
output.mkdir(exist_ok=True)
excluded = {"node_modules", "bin", "obj", "dist", ".angular", ".git", "__pycache__"}
files = [root / "README.md", root / ".gitignore"]
for folder in ["frontend", "backend", "docs", "tools"]:
    for base, directories, names in os.walk(root / folder):
        directories[:] = [name for name in directories if name not in excluded]
        files.extend(Path(base) / name for name in names if name != "dotnet-install.ps1")
target = output / "Prueba_tecnica_Campus.zip"
with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(files):
        archive.write(path, path.relative_to(root))
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
print(f"{len(files)} files; {target.stat().st_size} bytes; {target}")
