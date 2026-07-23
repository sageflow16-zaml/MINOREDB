"""Semantic version bump script.

Usage:
    python scripts/bump_version.py patch   # 1.1.0 -> 1.1.1
    python scripts/bump_version.py minor   # 1.1.0 -> 1.2.0
    python scripts/bump_version.py major   # 1.1.0 -> 2.0.0

Updates VERSION file and APP_VERSION in backend/src/core/config.py.
"""

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
VERSION_FILE = ROOT / "VERSION"
MAIN_PY = ROOT / "backend" / "src" / "main.py"


def read_version() -> tuple[int, int, int]:
    raw = VERSION_FILE.read_text().strip()
    parts = raw.split(".")
    return tuple(int(p) for p in parts)  # type: ignore


def write_version(major: int, minor: int, patch: int) -> None:
    new_ver = f"{major}.{minor}.{patch}"
    VERSION_FILE.write_text(new_ver + "\n")
    # Update APP_VERSION in main.py
    content = MAIN_PY.read_text()
    content = re.sub(
        r'APP_VERSION\s*=\s*"[^"]+"',
        f'APP_VERSION = "{new_ver}"',
        content,
    )
    MAIN_PY.write_text(content)
    print(f"Version bumped to {new_ver}")


def main() -> None:
    if len(sys.argv) != 2 or sys.argv[1] not in ("patch", "minor", "major"):
        print(__doc__)
        sys.exit(1)

    major, minor, patch = read_version()
    part = sys.argv[1]

    if part == "patch":
        patch += 1
    elif part == "minor":
        minor += 1
        patch = 0
    elif part == "major":
        major += 1
        minor = 0
        patch = 0

    write_version(major, minor, patch)


if __name__ == "__main__":
    main()
