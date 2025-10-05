import asyncio
import logging
from typing import Dict, List, Sequence, Tuple

import httpx

from src.dependencies.settings import settings

logger = logging.getLogger("api")

_SAMPLE_TLES: List[Tuple[str, str, str]] = [
    (
        "ISS (ZARYA)",
        "1 25544U 98067A   24358.51667824  .00022300  00000-0  39512-3 0  9994",
        "2 25544  51.6401 349.8226 0004517  47.7892  39.3817 15.50339582436503",
    ),
    (
        "STARLINK-3227",
        "1 51462U 22098Q   24358.50788773  .00015348  00000-0  10977-2 0  9991",
        "2 51462  53.2168  71.7737 0001279  94.9774 265.1288 15.06466589177654",
    ),
    (
        "NOAA 20",
        "1 43013U 17073A   24358.28670797  .00000097  00000-0  64002-4 0  9993",
        "2 43013  98.7070  63.8737 0001316  61.3128 298.8040 14.19530925371765",
    ),
]


def parse_tle_text(text: str) -> List[Tuple[str, str, str]]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    out: List[Tuple[str, str, str]] = []
    i = 0
    while i < len(lines):
        name = None
        l1 = None
        l2 = None

        # Handle TLE blocks with explicit name line (line 0).
        if (
            i + 2 < len(lines)
            and lines[i + 1].startswith("1 ")
            and lines[i + 2].startswith("2 ")
        ):
            name = lines[i]
            l1 = lines[i + 1]
            l2 = lines[i + 2]
            i += 3
        # Handle blocks where the optional name line is absent.
        elif (
            i + 1 < len(lines)
            and lines[i].startswith("1 ")
            and lines[i + 1].startswith("2 ")
        ):
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


async def _fetch_one_catalog(client: httpx.AsyncClient, url: str) -> List[Tuple[str, str, str]]:
    try:
        resp = await client.get(url)
        resp.raise_for_status()
        return parse_tle_text(resp.text)
    except (httpx.RequestError, httpx.HTTPStatusError) as exc:
        logger.warning("CelesTrak fetch failed for %s: %s", url, exc)
        return []


def _fallback_sample_catalog() -> Dict[int, Tuple[str, str, str]]:
    out: Dict[int, Tuple[str, str, str]] = {}
    for name, l1, l2 in _SAMPLE_TLES:
        try:
            norad = int(l2.split()[1])
        except Exception:
            continue
        out[norad] = (name, l1, l2)
    return out


async def fetch_celestrak_all() -> Dict[int, Tuple[str, str, str]]:
    """
    Fusionne plusieurs groupes CelesTrak en mapping NORAD -> (name, l1, l2).
    """

    timeout = httpx.Timeout(10.0, connect=5.0)
    out: Dict[int, Tuple[str, str, str]] = {}

    catalog_urls: Sequence[str] = list(settings.CELESTRAK_URLS)

    async with httpx.AsyncClient(timeout=timeout) as client:
        tasks = [_fetch_one_catalog(client, url) for url in catalog_urls]
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for result in results:
                if isinstance(result, BaseException):
                    logger.warning("Unexpected error while fetching TLE catalog: %s", result)
                    continue
                for name, l1, l2 in result:
                    try:
                        norad = int(l2.split()[1])
                        out[norad] = (name, l1, l2)
                    except Exception:
                        continue

    if out:
        return out

    logger.error("Unable to download TLE catalogs; falling back to embedded sample data (%s entries)", len(_SAMPLE_TLES))
    fallback = _fallback_sample_catalog()
    if fallback:
        return fallback

    raise RuntimeError("No TLE data available")
