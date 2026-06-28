# Recovery runbook — rebuild after a NAS failure / reinitialize

You have (from `immich-backup.sh`): `db/` (Postgres dumps), `upload/` (Immich
upload dir), `media/` (your originals), `config/` (compose + .env). Here's how to
come back from nothing.

## 1. Reinstall the base

1. Set up TOS on the (new/wiped) NAS, install the **Docker** app, enable SSH.
2. Recreate the folder layout and restore your **originals**:
   ```bash
   rsync -a /mnt/usb1/nas-backup/media/Photos/      /Volume1/Photos/
   rsync -a /mnt/usb1/nas-backup/media/homes/       /Volume1/homes/
   # …repeat for each folder under media/
   ```

## 2. Restore the project + config

```bash
mkdir -p /Volume1/public/Docker/terramaster-galaxy-photos
cp /mnt/usb1/nas-backup/config/docker-compose.yml /Volume1/public/Docker/terramaster-galaxy-photos/
cp /mnt/usb1/nas-backup/config/.env               /Volume1/public/Docker/terramaster-galaxy-photos/
# (also restore galaxy-ui/ from the git repo or the project zip)
```

## 3. Restore the Immich upload dir

```bash
rsync -a /mnt/usb1/nas-backup/upload/ /Volume1/public/Docker/galaxy/immich-upload/
```

## 4. Bring up DB + redis, then restore the database

```bash
cd /Volume1/public/Docker/terramaster-galaxy-photos
docker-compose up -d database redis
sleep 15   # let Postgres finish starting

# Restore the most recent dump:
LATEST=$(ls -t /mnt/usb1/nas-backup/db/immich-*.sql.gz | head -1)
gunzip < "$LATEST" | docker exec -i immich_postgres psql --username=postgres -d postgres
```

## 5. Start everything

```bash
docker-compose up -d
docker-compose ps        # confirm all Up
```

Open `http://<nas-ip>:2283` — your library, faces, albums and metadata are back.
External libraries re-link to the restored `media/` originals on the next scan.

## Test this BEFORE you need it

Once a month, restore the latest DB dump into a throwaway Postgres container and
confirm it loads without errors. A backup you've never restored is a guess, not
a backup.

```bash
docker run --rm -d --name pgtest -e POSTGRES_PASSWORD=x ghcr.io/immich-app/postgres:14-vectorchord0.3.0-pgvectors0.2.0
sleep 15
gunzip < "$(ls -t /mnt/usb1/nas-backup/db/immich-*.sql.gz | head -1)" \
  | docker exec -i pgtest psql -U postgres -d postgres && echo "RESTORE OK"
docker rm -f pgtest
```
