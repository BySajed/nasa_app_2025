import httpx
from typing import Dict, List, Tuple
from ...dependencies.settings import settings

def parse_tle_text(text: str) -> List[Tuple[str, str, str]]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    out: List[Tuple[str,str,str]] = []
    i = 0
    while i < len(lines) - 2:
        if lines[i][0].isalpha() and lines[i+1].startswith("1 ") and lines[i+2].startswith("2 "):
            out.append((lines[i], lines[i+1], lines[i+2]))
            i += 3
        else:
            i += 1
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
