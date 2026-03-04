FROM php:8.2-fpm

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libpng-dev libonig-dev libxml2-dev libicu-dev \
    nginx supervisor \
    && docker-php-ext-configure intl \
    && docker-php-ext-install pdo_mysql pdo_pgsql mbstring zip exif pcntl bcmath intl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Optimisation du cache : on installe les libs avant de copier tout le code
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copie du code avec les bonnes permissions pour PHP-FPM (www-data)
COPY --chown=www-data:www-data . .

# Permissions runtime (Laravel)
RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwX storage bootstrap/cache

# Finalisation de l'autoloader et scripts
RUN composer dump-autoload --optimize

RUN rm -f /etc/nginx/sites-enabled/default

RUN chmod +x /var/www/html/start.sh

# Supervisor config to run php-fpm + nginx
RUN printf '%s\n' \
  '[supervisord]' \
  'nodaemon=true' \
  '' \
  '[program:php-fpm]' \
  'command=php-fpm -F' \
  'autorestart=true' \
  'stdout_logfile=/dev/stdout' \
  'stdout_logfile_maxbytes=0' \
  'stderr_logfile=/dev/stderr' \
  'stderr_logfile_maxbytes=0' \
  '' \
  '[program:nginx]' \
  'command=nginx -g "daemon off;"' \
  'autorestart=true' \
  'stdout_logfile=/dev/stdout' \
  'stdout_logfile_maxbytes=0' \
  'stderr_logfile=/dev/stderr' \
  'stderr_logfile_maxbytes=0' \
  > /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8080

CMD ["/var/www/html/start.sh"]
