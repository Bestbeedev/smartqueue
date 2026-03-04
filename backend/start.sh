#!/usr/bin/env sh
set -eu

PORT_VALUE="${PORT:-8080}"

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  php artisan migrate --force
fi

cat > /etc/nginx/conf.d/default.conf <<EOF
server {
  listen 0.0.0.0:${PORT_VALUE};
  server_name _;
  root /var/www/html/public;
  index index.php index.html;

  location / {
    try_files \$uri \$uri/ /index.php?\$query_string;
  }

  location ~ \\.(php)$ {
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
    fastcgi_pass 127.0.0.1:9000;
  }

  client_max_body_size 20M;
}
EOF

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
