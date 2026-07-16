"""
RelatoriosESG — Dev Server launcher
Press the green Run button in PyCharm to start (or restart) the Next.js dev server.
"""

import subprocess
import sys
import os
import shutil

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = 3000


def kill_port(port):
    """Kill any process listening on the given port (Windows)."""
    try:
        result = subprocess.run(
            f'netstat -ano | findstr "LISTENING" | findstr ":{port}"',
            shell=True, capture_output=True, text=True
        )
        for line in result.stdout.splitlines():
            parts = line.split()
            if parts:
                pid = parts[-1]
                if pid.isdigit() and pid != "0":
                    subprocess.run(f"taskkill /F /PID {pid}", shell=True,
                                   capture_output=True)
                    print(f"Stopped existing server (PID {pid})")
    except Exception as e:
        print(f"Warning: could not check port {port}: {e}")


def wsl_path(windows_path):
    """Convert a Windows path to a WSL path."""
    result = subprocess.run(
        ["wsl", "wslpath", windows_path.replace("\\", "/")],
        capture_output=True, text=True
    )
    return result.stdout.strip()


def run_dev():
    kill_port(PORT)

    print(f"\nStarting Next.js dev server at http://localhost:{PORT} ...\n")

    # Try native Windows npm first (npm is a .cmd file — requires shell=True on Windows)
    if shutil.which("npm"):
        subprocess.run("npm run dev", cwd=PROJECT_DIR, shell=True)
        return

    # Fall back to WSL
    if shutil.which("wsl"):
        wsl_dir = wsl_path(PROJECT_DIR)
        subprocess.run(
            ["wsl", "bash", "-c", f'cd "{wsl_dir}" && npm run dev'],
        )
        return

    print("ERROR: npm not found on Windows PATH and wsl not available.")
    print("Please install Node.js for Windows or run 'npm run dev' manually in a WSL terminal.")
    sys.exit(1)


if __name__ == "__main__":
    run_dev()
