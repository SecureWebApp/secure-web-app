FROM debian:11

# install dependencies & enable modules for proxy
RUN apt update -y \
    && apt install apache2 -y \
    && apt install systemctl -y \
    && apt install libssl-dev -y \
    && a2enmod ssl \
    && a2enmod proxy \
    && a2enmod proxy_http \
    && a2enmod proxy_balancer \
    && a2enmod lbmethod_byrequests \
    && a2enmod rewrite \
    && a2enmod headers \
    && mkdir -p /etc/ssl/private
    
# copy reverse proxy config
COPY ../../000-default.conf /etc/apache2/sites-available/000-default.conf

# copy SSL key and certificate
COPY ../../private/serverkeySWA.pem /etc/ssl/private/serverkeySWA.pem
COPY ../../certs/servercertSWA.pem /etc/ssl/private/servercertSWA.pem

ENTRYPOINT ["systemctl", "start", "apache2"]