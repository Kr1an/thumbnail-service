# Thumbnail Service
##
Service is processing images. As an output you will get thumbnail 60x60.

## Requirenments
* Docker version 17.11.0-ce, build 1caf76c
* docker-compose version 1.17.1, build 6d101fb
* Application runs on PORT 3000, free it

## How to start processes
```
git clone https://github.com/Kr1an/thumbnail-service
cd thumbnail-service
docker-compose up
```

## Usage
* send POST to ```BASE_URL/jobrequests``` with body ```{ url: '<image_url>' }```
* get id from previous step response and call ```GET: BASE_URL/jobrequests/<id>```. If your image was already processed, you will see ```thumbnail_url``` that you will use in the next step
* if status is success, you can access thumbnail on ```GET: BASE_URL/<thumbnail_url>```
* if status is failed, something went wrong with processing, try again
