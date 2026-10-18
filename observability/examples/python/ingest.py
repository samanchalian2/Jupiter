"""Standard-library backend example. No Jupiter modules/cookies; never print secrets.

Use a scoped SERVER credential from a trusted secret store/environment. This is
an integration example, not a durable SDK: a process crash loses its memory queue.
"""
import datetime
import http.client
import json
import os
import random
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None  # Never forward a bearer credential to a redirect target.


def send_batch(endpoint, token, events, opener=None):
    parsed = urllib.parse.urlsplit(endpoint)
    local = parsed.hostname in ("localhost", "127.0.0.1", "::1")
    if (parsed.username is not None or parsed.password is not None or parsed.query or parsed.fragment or
            not parsed.netloc or parsed.scheme != "https" and not (
                local and parsed.scheme == "http" and os.getenv("OBSERVABILITY_ALLOW_LOCAL_HTTP") == "1")):
        raise ValueError("INVALID_ENDPOINT")
    if len(token) < 32 or not 1 <= len(events) <= 50:
        raise ValueError("INVALID_CONFIGURATION")
    pending = {event["eventId"]: json.loads(json.dumps(event, ensure_ascii=False)) for event in events}
    if len(pending) != len(events):
        raise ValueError("DUPLICATE_BATCH_ID")
    result = {"ACCEPTED": 0, "DUPLICATE": 0, "REJECTED": 0}
    transport = opener or urllib.request.build_opener(NoRedirect())
    delay = 0.0
    for attempt in range(5):
        if not pending:
            return result
        if delay:
            time.sleep(delay)
        body = json.dumps({"events": list(pending.values())}, ensure_ascii=False).encode("utf-8")
        if len(body) > 524288 or any(len(json.dumps(event, ensure_ascii=False).encode("utf-8")) > 16384 for event in pending.values()):
            raise ValueError("PAYLOAD_TOO_LARGE")
        request = urllib.request.Request(endpoint.rstrip("/") + "/events/batch", data=body,
                                         headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"})
        delay = min(30.0, 2 ** attempt + random.random())
        try:
            with transport.open(request, timeout=10) as response:
                raw = response.read(262145)
                if len(raw) > 262144:
                    raise ValueError("RESPONSE_TOO_LARGE")
                ack = json.loads(raw)
                rows = ack.get("acknowledgements") if isinstance(ack, dict) and ack.get("schemaVersion") == "1.1" else None
                if not isinstance(rows, list):
                    continue
                seen = set()
                valid = True
                for row in rows:
                    if not isinstance(row, dict) or not isinstance(row.get("eventId"), str) or row["eventId"] not in pending or row["eventId"] in seen or row.get("status") not in (*result, "RETRYABLE"):
                        valid = False
                        break
                    seen.add(row["eventId"])
                if not valid:
                    continue
                for row in rows:
                    status = row["status"]
                    if status != "RETRYABLE":
                        result[status] += 1
                        del pending[row["eventId"]]
        except urllib.error.HTTPError as error:
            try:
                if error.code != 429 and not 500 <= error.code <= 599:
                    raise ValueError("INGESTION_REJECTED") from None
                wait = error.headers.get("Retry-After", "")
                if wait.isdigit():
                    delay = min(30.0, max(0.0, float(wait)))
            finally:
                error.close()
        except (OSError, http.client.HTTPException, json.JSONDecodeError, UnicodeError):
            pass  # Bounded retry; retain original IDs and payload, including timestamp.
    if pending:
        raise ValueError("RETRY_EXHAUSTED")
    return result


def main():
    event = {"eventId": str(uuid.uuid4()), "schemaVersion": "1.1",
             "applicationId": str(uuid.UUID(os.environ["OBSERVABILITY_APPLICATION_ID"])),
             "environmentId": str(uuid.UUID(os.environ["OBSERVABILITY_ENVIRONMENT_ID"])),
             "occurredAt": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
             "source": "REFERENCE_CLIENT", "category": "BACKEND", "severity": "ERROR",
             "eventCode": "reference.python", "normalizedMessage": "Controlled Python reference operation"}
    endpoint, token = os.environ["OBSERVABILITY_ENDPOINT"], os.environ["OBSERVABILITY_SERVER_CREDENTIAL"]
    output = {"first": send_batch(endpoint, token, [event])}
    if os.getenv("OBSERVABILITY_VERIFY_REPLAY") == "1":
        output["replay"] = send_batch(endpoint, token, [event])
    print(json.dumps(output))  # Counts only; never token, payload or server error body.
    return 1 if any(row["REJECTED"] for row in output.values()) else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        print("REFERENCE_CLIENT_FAILED", file=sys.stderr)
        sys.exit(1)
