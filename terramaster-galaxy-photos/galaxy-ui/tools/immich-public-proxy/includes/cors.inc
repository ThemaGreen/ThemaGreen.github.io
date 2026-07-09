# CORS + security headers for proxied locations. $cors_origin is "" for any
# origin that isn't allowlisted, and add_header skips empty values — so
# disallowed origins get NO CORS header and the browser blocks them.

if ($request_method = OPTIONS) {
  add_header Access-Control-Allow-Origin  $cors_origin always;
  add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
  add_header Access-Control-Allow-Headers "Content-Type, Authorization, Accept, X-Requested-With" always;
  add_header Access-Control-Max-Age 86400 always;
  add_header Vary Origin always;
  return 204;
}

add_header Access-Control-Allow-Origin $cors_origin always;
add_header Vary Origin always;

# re-declare security headers (location-level add_header replaces server-level)
add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy no-referrer always;
