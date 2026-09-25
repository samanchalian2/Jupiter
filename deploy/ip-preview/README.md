# IP preview

This is a temporary, HTTP-only operational preview for an explicit public IP
request. It is not the canonical staging deployment and must not be used as
evidence for GOAL-059 HTTPS, cookie-security or browser acceptance.

The preview binds the application web container only to loopback and Nginx
publishes port 8088. All data services remain on the private Compose network.
Secrets belong only in `/opt/jupiter/secrets/ip-preview.env` with owner-only
permissions; no values belong in this repository.
