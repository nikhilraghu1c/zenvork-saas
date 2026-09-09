# Email OTP Verification while creating businesses

# Expose business types for registration

Add an endpoint that returns the enabled business types. The frontend should use this response
instead of maintaining Salon and Clinic options locally, keeping business-type support data-driven.

# Add authenticated session recovery

Add a credentialed endpoint such as `GET /api/me` that validates the HttpOnly access-token cookie
and returns safe current-user data. The frontend will use it to restore authentication after a page
reload or in a newly opened browser tab without exposing the JWT to JavaScript.
