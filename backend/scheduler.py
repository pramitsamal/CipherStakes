"""APScheduler setup for automated draw execution.

Three draw cadences:
- T1 Daily Flash     — every day at 20:00 UTC
- T2 Weekly Stakes   — every Sunday at 20:00 UTC
- T3 Bi-Weekly Ride  — every alternate Monday at 20:00 UTC (week='*/2')

All three call the same draw-execution function; for demos use the admin
endpoint `POST /api/draws/admin/run/{draw_id}` to trigger on-demand.
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
        name="T1 Daily Flash",
        replace_existing=True,
    )
    # T2 — Sunday 20:00 UTC
    sched.add_job(
        lambda: asyncio.create_task(_run_draw_safely("T2_WEEKLY_STAKES")),
        CronTrigger(day_of_week="sun", hour=20, minute=0, timezone="UTC"),
        id="t2_weekly_stakes",
        name="T2 Weekly Stakes",
        replace_existing=True,
    )
    # T3 — Bi-weekly Monday 20:00 UTC (every 2nd ISO week)
    sched.add_job(
        lambda: asyncio.create_task(_run_draw_safely("T3_BIWEEKLY_RIDE")),
        CronTrigger(
            day_of_week="mon",
            hour=20,
            minute=0,
            week="*/2",
            timezone="UTC",
        ),
        id="t3_biweekly_ride",
        name="T3 Bi-Weekly Ride",
        replace_existing=True,
    )

    sched.start()
    _scheduler = sched
    for job in sched.get_jobs():
        logger.info(
            "[scheduler] registered job %s (%s) next_run=%s",
            job.id,
            job.name,
            job.next_run_time,
        )
    logger.info(
        "APScheduler started with 3 jobs: T1 (daily 20:00 UTC), "
        "T2 (Sun 20:00 UTC), T3 (alt Mondays 20:00 UTC)"
    )


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
