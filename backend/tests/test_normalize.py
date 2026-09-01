from app.normalize import clamp_score, normalize_resume


def test_normalize_fills_missing_keys():
    out = normalize_resume({})
    assert set(out.keys()) == {
        "name", "title", "contact", "summary", "skills",
        "experience", "projects", "education",
    }
    assert out["contact"] == {"email": "", "phone": "", "location": "", "links": []}
    assert out["skills"] == [] and out["experience"] == []


def test_normalize_coerces_bad_types():
    out = normalize_resume(
        {
            "name": 123,  # not a string
            "skills": "oops",  # not a list
            "experience": [
                {"role": "Eng", "bullets": ["a", None, 5, ""]},  # mixed junk in bullets
                "not-a-dict",
            ],
        }
    )
    assert out["name"] == "123"
    assert out["skills"] == []
    assert len(out["experience"]) == 1  # the string entry dropped
    assert out["experience"][0]["bullets"] == ["a", "5"]  # None and "" dropped, 5 coerced


def test_normalize_handles_non_dict_input():
    assert normalize_resume(None)["name"] == ""
    assert normalize_resume("garbage")["experience"] == []


def test_clamp_score():
    assert clamp_score(150) == 100
    assert clamp_score(-5) == 0
    assert clamp_score(67) == 67
    assert clamp_score("80") == 80
    assert clamp_score(None) is None
    assert clamp_score("abc") is None
