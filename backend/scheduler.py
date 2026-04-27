"""APScheduler setup for automated draw execution (T1 daily, T2 weekly).

Draws also remain executable on-demand via admin endpoint for demos.
"""
import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from draws_logic import DrawAlreadyExecutedError, execute_draw

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


async def _run_draw_safely(draw_id: str) -> None:
    try:
        result = await execute_draw(draw_id)
        logger.info(
            "[scheduler] executed %s: winner=%s total_entries=%s",
            draw_id,
            result.get("winner"),
            result.get("total_entries"),
        )
    except DrawAlreadyExecutedError as exc:
        logger.info("[scheduler] skipped %s: %s", draw_id, exc)
    except Exception as exc:
        logger.exception("[scheduler] error running %s: %s", draw_id, exc)


def start_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return
    sched = AsyncIOScheduler(timezone="UTC")
    # T1 — Daily 20:00 UTC
    sched.add_job(
        lambda: asyncio.create_task(_run_draw_safely("T1_DAILY_FLASH")),
        CronTrigger(hour=20, minute=0, timezone="UTC"),
        id="t1_daily_flash",
        replace_existing=True,
    )
    # T2 — Sunday 20:00 UTC (day_of_week=0 is Monday in APScheduler; use "sun")
    sched.add_job(
        lambda: asyncio.create_task(_run_draw_safely("T2_WEEKLY_STAKES")),
        CronTrigger(day_of_week="sun", hour=20, minute=0, timezone="UTC"),
        id="t2_weekly_stakes",
        replace_existing=True,
    )
    sched.start()
    _scheduler = sched
    logger.info("APScheduler started (T1 daily 20:00 UTC, T2 Sun 20:00 UTC)")


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
