# Tiny image with ImageMagick (+ HEIC) and ffmpeg so nothing is installed on TOS.
FROM alpine:3.20
RUN apk add --no-cache bash imagemagick imagemagick-heic ffmpeg
COPY generate-proxies.sh /usr/local/bin/generate-proxies.sh
RUN chmod +x /usr/local/bin/generate-proxies.sh
ENTRYPOINT ["bash", "/usr/local/bin/generate-proxies.sh"]
