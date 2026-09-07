from __future__ import annotations

from server.argv_builder import build_research_argv
from server.models import Depth, ResearchRequest


def test_argv_quick_mapping():
    req = ResearchRequest(
        topic="AI coding agents",
        days=7,
        depth=Depth.quick,
    )
    argv = build_research_argv(req)
    assert argv[0] == "AI coding agents"
    assert "--days=7" in argv
    assert "--quick" in argv
    assert "--deep" not in argv
    assert "--emit=json" in argv
    assert "--json-profile=agent" in argv
    assert "--no-browser-cookies" in argv


def test_argv_deep_and_search():
    req = ResearchRequest(
        topic="topic",
        depth=Depth.deep,
        search=["reddit", "hackernews", "github"],
        subreddits=["laravel", "PHP"],
        x_handle="@cursor_ai",
        github_user="anthropics",
        verify_freshness=True,
        hiring_signals=True,
    )
    argv = build_research_argv(req)
    assert "--deep" in argv
    assert "--search=reddit,hackernews,github" in argv
    assert "--subreddits=laravel,PHP" in argv
    assert "--x-handle=cursor_ai" in argv
    assert "--github-user=anthropics" in argv
    assert "--verify-freshness" in argv
    assert "--hiring-signals" in argv


def test_topic_with_shell_metacharacters_is_plain_argv_value():
    dangerous = 'x"; rm -rf /; echo "'
    req = ResearchRequest(topic=dangerous, days=3, depth=Depth.quick)
    argv = build_research_argv(req)
    assert argv[0] == dangerous
    assert all(not item.startswith("rm ") for item in argv)
    joined = " ".join(argv)
    # Still present as data, but not executed as shell — runner uses shell=False.
    assert dangerous in argv
