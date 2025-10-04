import httpx
from typing import Dict, List, Tuple
from ...dependencies.settings import settings

def parse_tle_text(text: str) -> List[Tuple[str, str, str]]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    out: List[Tuple[str, str, str]] = []
    i = 0
    while i < len(lines):
        name = None
        l1 = None
        l2 = None

        # Handle TLE blocks with explicit name line (line 0).
        if i + 2 < len(lines) and lines[i + 1].startswith("1 ") and lines[i + 2].startswith("2 "):
            name = lines[i]
            l1 = lines[i + 1]
            l2 = lines[i + 2]
            i += 3
        # Handle blocks where the optional name line is absent.
        elif i + 1 < len(lines) and lines[i].startswith("1 ") and lines[i + 1].startswith("2 "):
            l1 = lines[i]
            l2 = lines[i + 1]
            sat_num = l1[2:7].strip() if len(l1) >= 7 else l1[2:].strip()
            name = f"NORAD {sat_num}" if sat_num else "NORAD UNKNOWN"
            i += 2
        else:
            i += 1
            continue

        out.append((name, l1, l2))
    return out

async def fetch_celestrak_all() -> Dict[int, Tuple[str,str,str]]:
    """Fusionne plusieurs groupes CelesTrak en mapping NORAD -> (name, l1, l2)."""
    out: Dict[int, Tuple[str,str,str]] = {}
    async with httpx.AsyncClient(timeout=30) as client:
        for url in settings.CELESTRAK_URLS:
            r = await client.get(url)
            r.raise_for_status()
            for name, l1, l2 in parse_tle_text(r.text):
                try:
                    norad = int(l2.split()[1])
                    out[norad] = (name, l1, l2)
                except Exception:
                    continue
    return out
