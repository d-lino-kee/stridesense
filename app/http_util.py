"""Small HTTP helper with an SSL-verification fallback.

Some local/corporate Python installs can't resolve a CA bundle, so outbound
HTTPS fails with CERTIFICATE_VERIFY_FAILED even though the host is reachable.
We first try a normal verified request; if (and only if) SSL verification
fails, we retry once without verification so local development keeps working.
"""

from __future__ import annotations

import requests


def request(method: str, url: str, **kwargs) -> requests.Response:
    try:
        return requests.request(method, url, **kwargs)
    except requests.exceptions.SSLError:
        try:
            import urllib3

            urllib3.disable_warnings()
        except Exception:
            pass
        kwargs["verify"] = False
        return requests.request(method, url, **kwargs)


def get(url: str, **kwargs) -> requests.Response:
    return request("GET", url, **kwargs)


def post(url: str, **kwargs) -> requests.Response:
    return request("POST", url, **kwargs)
