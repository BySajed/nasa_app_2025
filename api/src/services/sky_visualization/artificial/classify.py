from typing import Optional

def infer_category(name: str) -> Optional[str]:
    n = name.lower()
    if "iss" in n or "zarya" in n:
        return "station"
    if "starlink" in n:
        return "starlink"
    if "oneweb" in n:
        return "oneweb"
    if "geo" in n or "geosat" in n or "intelsat" in n:
        return "geo"
    if "tel" in n or "com" in n or "satcom" in n:
        return "telecom"
    if "obs" in n or "earth" in n or "sentinel" in n or "landsat" in n:
        return "observation"
    if "telescope" in n or "hubble" in n or "james" in n:
        return "telescope"
    # "scientifique" / "militaire" requiert méta Space-Track pour être fiable
    return None
