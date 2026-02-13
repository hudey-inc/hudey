"""Job queue repository tests — verify the durable queue logic."""

from unittest.mock import patch


def test_enqueue_creates_job(mock_sb):
    """enqueue() inserts a row into campaign_jobs."""
    from backend.db.repositories.job_repo import enqueue

    mock_sb.seed_table("campaign_jobs", [{"id": "job-1", "campaign_id": "c1", "status": "queued"}])
    job_id = enqueue("c1")
    assert job_id is not None


def test_enqueue_returns_none_without_db():
    """enqueue() returns None when Supabase is unavailable."""
    from backend.db.repositories.job_repo import enqueue

    with patch("backend.db.repositories.job_repo.get_supabase", return_value=None):
        result = enqueue("c1")
    assert result is None


def test_claim_next_returns_none_without_db():
    """claim_next() returns None when Supabase is unavailable."""
    from backend.db.repositories.job_repo import claim_next

    with patch("backend.db.repositories.job_repo.get_supabase", return_value=None):
        result = claim_next()
    assert result is None


def test_complete_marks_job_done(mock_sb):
    """complete() updates job status to completed."""
    from backend.db.repositories.job_repo import complete

    mock_sb.seed_table("campaign_jobs", [{"id": "job-1", "status": "running"}])
    result = complete("job-1")
    assert result is True


def test_fail_requeues_under_max_attempts(mock_sb):
    """fail() re-queues if attempts < max_attempts."""
    from backend.db.repositories.job_repo import fail

    mock_sb.seed_table("campaign_jobs", [
        {"id": "job-1", "status": "running", "attempts": 1, "max_attempts": 3}
    ])
    result = fail("job-1", "some error")
    assert result is True


def test_get_job_for_campaign(mock_sb):
    """get_job_for_campaign() returns the job row."""
    from backend.db.repositories.job_repo import get_job_for_campaign

    mock_sb.seed_table("campaign_jobs", [
        {"id": "job-1", "campaign_id": "c1", "status": "queued"}
    ])
    job = get_job_for_campaign("c1")
    assert job is not None
    assert job["campaign_id"] == "c1"


def test_get_job_returns_none_without_db():
    """get_job_for_campaign() returns None when DB is unavailable."""
    from backend.db.repositories.job_repo import get_job_for_campaign

    with patch("backend.db.repositories.job_repo.get_supabase", return_value=None):
        job = get_job_for_campaign("nonexistent")
    assert job is None
