from datetime import timedelta, datetime
from typing import List, Dict, Callable

def sample_time_series(
    start: datetime, horizon_minutes: int, step_seconds: int,
    sampler: Callable[[datetime], Dict]
) -> List[Dict]:
    steps = max(1, int(horizon_minutes*60 / max(1, step_seconds)))
    out: List[Dict] = []
    for i in range(steps+1):
        t = start + timedelta(seconds=i*step_seconds)
        out.append(sampler(t))
    return out
