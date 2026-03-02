FROM php:8.2-fpm

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libpng-dev libonig-dev libxml2-dev libicu-dev \
    && docker-php-ext-configure intl \
    && docker-php-ext-install pdo_mysql mbstring zip exif pcntl bcmath intl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Optimisation du cache : on installe les libs avant de copier tout le code
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copie du code avec les bonnes permissions pour PHP-FPM (www-data)
COPY --chown=www-data:www-data . .

# Finalisation de l'autoloader et scripts
RUN composer dump-autoload --optimize

# On expose le port standard de PHP-FPM
EXPOSE 9000

CMD ["php-fpm"]
